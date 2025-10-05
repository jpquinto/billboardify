import json
import os

import boto3

from typing import Annotated, Any, Dict, List, Tuple, TypedDict, cast
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage, BaseMessage
from langchain_aws import ChatBedrockConverse
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages

lambda_client = boto3.client("lambda")
bedrock_client = boto3.client("bedrock-runtime")

class AgentState(TypedDict):
    user_query: str
    messages: Annotated[List[BaseMessage], add_messages]
    tool_data: Dict[str, Any]

def call_lambda_function(function_arn: str, data: any) -> any:
    try:
        print(f"Calling lambda function: {function_arn} with data: {json.dumps(data)}")
        response = lambda_client.invoke(
            FunctionName=function_arn,
            InvocationType="RequestResponse",
            Payload=json.dumps({"body": json.dumps(data)}),
        )
        response_payload = json.loads(response["Payload"].read().decode("utf-8"))
        
        # Parse the body string to get the actual response object
        body = json.loads(response_payload["body"]) if isinstance(response_payload["body"], str) else response_payload["body"]
        response_data = body["response"]
        
        print(f"Lambda function response from {function_arn}: {json.dumps(response_data)}")
        return response_data
    except Exception as e:
        print(f"Error calling lambda function {function_arn}: {e}")
        return json.dumps({"error": str(e)})

# Store the user query globally for tool access
_current_user_query = ""

@tool
def tool_query_listening_data() -> str:
    """
    Use this tool to query the user's listening data. It is used for direct lookups for any questions that involve the user's listening history.
    This tool returns track information including track IDs, names, artists, and play counts.
    
    Returns:
        str: The result of the SQL query execution as a JSON string containing track information.
    """
    try:
        print("Executing tool_query_listening_data...")
        response = call_lambda_function(
            os.getenv("QUERY_LISTENING_DATA_LAMBDA_ARN", ""),
            {
                "user_query": _current_user_query,
            },
        )

        if not response:
            raise ValueError("No response from listening history tool")
        
        print(f"tool_query_listening_data response type: {type(response)}")
        print(f"tool_query_listening_data response: {json.dumps(response) if isinstance(response, dict) else response}")
        
        # Ensure we return a string
        if isinstance(response, dict):
            return json.dumps(response)
        elif isinstance(response, str):
            return response
        else:
            return str(response)
            
    except Exception as e:
        print(f"Error in tool_query_listening_data: {e}")
        return json.dumps({"error": f"Failed to query listening history: {str(e)}"})
    
@tool
def tool_control_playback(track_ids: List[str], action: str = "add_to_queue") -> str:
    """
    Use this tool to control the user's playback. It can add tracks to the queue and/or replace the current playback.
    
    Args:
        track_ids: A list of Spotify track IDs (e.g., ["abc123", "def456"])
        action: The playback action to perform. Options are:
            - "add_to_queue": Add tracks to the end of the current queue (default)
            - "play_now": Replace current playback and start playing these tracks immediately
    
    Returns:
        str: The result of the playback control operation as a JSON string.
    
    Examples:
        - To play a user's top tracks: First use tool_query_listening_data to get the track IDs, 
          then use this tool with those IDs and action="play_now"
        - To add tracks to queue: Use action="add_to_queue" with the track IDs
    """
    try:
        print(f"Executing tool_control_playback with {len(track_ids)} tracks and action={action}")
        
        if not track_ids:
            return json.dumps({"error": "No track IDs provided"})
        
        response = call_lambda_function(
            os.getenv("PLAYBACK_CONTROLLER_LAMBDA_ARN", ""),
            {
                "track_ids": track_ids,
                "action": action
            },
        )
        
        print(f"tool_control_playback response: {json.dumps(response) if isinstance(response, dict) else response}")
        
        # Ensure we return a string
        if isinstance(response, dict):
            return json.dumps(response)
        elif isinstance(response, str):
            return response
        else:
            return str(response)
            
    except Exception as e:
        print(f"Error in tool_control_playback: {e}")
        return json.dumps({"error": f"Failed to control playback: {str(e)}"})


@tool
def tool_create_playlist(track_ids: List[str], playlist_name: str = "") -> str:
    """
    Use this tool to create a playlist for the user with the specified tracks.
    
    Args:
        track_ids: A list of Spotify track IDs to add to the playlist (e.g., ["abc123", "def456"])
        playlist_name: Optional name for the playlist. If not provided, a name will be generated based on the user's request.
    
    Returns:
        str: The result of the playlist creation operation as a JSON string, including the playlist ID and URL.
    
    Examples:
        - To create a playlist from top tracks: First use tool_query_listening_data to get the track IDs,
          then use this tool with those IDs and an appropriate playlist_name
        - To create a playlist from Drake songs: Query listening data for Drake tracks, then create playlist
          with playlist_name="My Top Drake Songs"
    """
    try:
        print(f"Executing tool_create_playlist with {len(track_ids)} tracks and name='{playlist_name}'")
        
        if not track_ids:
            return json.dumps({"error": "No track IDs provided"})
        
        response = call_lambda_function(
            os.getenv("CREATE_PLAYLIST_LAMBDA_ARN", ""),
            {
                "track_ids": track_ids,
                "playlist_name": playlist_name,
                "user_query": _current_user_query
            },
        )
        
        print(f"tool_create_playlist response: {json.dumps(response) if isinstance(response, dict) else response}")
        
        # Ensure we return a string
        if isinstance(response, dict):
            return json.dumps(response)
        elif isinstance(response, str):
            return response
        else:
            return str(response)
            
    except Exception as e:
        print(f"Error in tool_create_playlist: {e}")
        return json.dumps({"error": f"Failed to create playlist: {str(e)}"})

tools = [tool_query_listening_data, tool_control_playback, tool_create_playlist]

# Initialize the LLM with tools using AWS Bedrock Nova Pro
llm = ChatBedrockConverse(
    model_id="us.amazon.nova-pro-v1:0",
    client=bedrock_client,
    temperature=0.0,
    top_p=0.8,
    max_tokens=2048,
).bind_tools(tools)

def execute_tools(state: AgentState) -> Dict[str, List[BaseMessage]]:
    """Execute tools and return properly formatted results."""
    messages = state["messages"]
    last_message = messages[-1]
    
    tool_messages = []
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        print(f"Processing {len(last_message.tool_calls)} tool calls")
        
        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            tool_input = tool_call.get("args", {})
            tool_call_id = tool_call["id"]
            
            print(f"Tool call ID: {tool_call_id}, Name: {tool_name}, Input: {tool_input}")
            
            # Find and execute the tool
            tool_func = None
            for tool in tools:
                if tool.name == tool_name:
                    tool_func = tool
                    break
            
            if tool_func:
                try:
                    # Execute the tool
                    result = tool_func.invoke(tool_input)
                    print(f"Tool {tool_name} result: {result}")
                    
                    # Create a properly formatted ToolMessage with status
                    tool_message = ToolMessage(
                        content=str(result),  # Ensure it's a string
                        tool_call_id=tool_call_id,
                        name=tool_name,
                        status="success"
                    )
                    tool_messages.append(tool_message)
                except Exception as e:
                    print(f"Error executing tool {tool_name}: {e}")
                    error_message = ToolMessage(
                        content=json.dumps({"error": str(e)}),
                        tool_call_id=tool_call_id,
                        name=tool_name,
                        status="error"
                    )
                    tool_messages.append(error_message)
            else:
                print(f"Tool {tool_name} not found")
                error_message = ToolMessage(
                    content=json.dumps({"error": f"Tool {tool_name} not found"}),
                    tool_call_id=tool_call_id,
                    name=tool_name,
                    status="error"
                )
                tool_messages.append(error_message)
    
    print(f"Returning {len(tool_messages)} tool messages")
    return {"messages": tool_messages}

def call_model(state: AgentState) -> Dict[str, List[BaseMessage]]:
    """Call the LLM to decide whether to use tools or respond directly."""
    messages = state["messages"]
    print(f"Calling model with {len(messages)} messages")
    for i, msg in enumerate(messages):
        msg_type = type(msg).__name__
        preview = str(msg.content)[:100] if hasattr(msg, 'content') else str(msg)[:100]
        print(f"Message {i}: Type={msg_type}, Preview={preview}")
    
    response = llm.invoke(messages)
    print(f"Model response type: {type(response).__name__}")
    print(f"Model response content: {response.content}")  # ADD THIS LINE
    print(f"Model response content type: {type(response.content)}")  # ADD THIS LINE
    if hasattr(response, "tool_calls"):
        print(f"Tool calls in response: {response.tool_calls}")
    
    return {"messages": [response]}

def extract_tool_data(state: AgentState) -> Dict[str, Any]:
    """Extract tool data from the most recent ToolMessage."""
    messages = state["messages"]
    tool_data = state.get("tool_data", {})
    
    # Find the most recent ToolMessage
    for message in reversed(messages):
        if isinstance(message, ToolMessage):
            tool_name = message.name
            try:
                # Try to parse the content as JSON
                parsed_content = json.loads(message.content)
                tool_data[tool_name] = parsed_content
            except json.JSONDecodeError:
                # If it's not JSON, store as-is
                tool_data[tool_name] = message.content
    
    return {"tool_data": tool_data}

def should_continue(state: AgentState) -> str:
    """Determine whether to continue to tools or end."""
    messages = state["messages"]
    last_message = messages[-1]
    
    # Count how many times we've called tools
    tool_message_count = sum(1 for msg in messages if isinstance(msg, ToolMessage))
    
    # If we've used tools more than 3 times, end to prevent loops
    if tool_message_count > 3:
        print("Max tool calls reached, ending")
        return END
    
    # If there are tool calls, route to tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        print(f"Tool calls detected: {last_message.tool_calls}")
        return "tools"
    
    return END

def create_graph():
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", execute_tools)  # Use custom function instead of ToolNode
    workflow.add_node("extract_tool_data", extract_tool_data)

    # Set the entry point
    workflow.set_entry_point("agent")

    # Add edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )
    
    # After tools run, extract data then go back to agent
    workflow.add_edge("tools", "extract_tool_data")
    workflow.add_edge("extract_tool_data", "agent")

    app = workflow.compile()

    return app

def run_agent(user_query: str) -> Dict[str, Any]:
    global _current_user_query
    _current_user_query = user_query
    
    app = create_graph()
    state: AgentState = {
        "user_query": user_query,
        "messages": [HumanMessage(content=user_query)],
        "tool_data": {}
    }

    # Run the graph
    result = app.invoke(state, {"recursion_limit": 10})
    
    # Extract the final response
    final_message = result["messages"][-1]
    
    response_text = ""
    if isinstance(final_message, AIMessage):
        # Handle different content formats from Bedrock
        if isinstance(final_message.content, str):
            response_text = final_message.content
        elif isinstance(final_message.content, list):
            # Extract text from content blocks
            text_parts = []
            for block in final_message.content:
                if isinstance(block, dict) and block.get('type') == 'text':
                    text_parts.append(block.get('text', ''))
                elif isinstance(block, str):
                    text_parts.append(block)
            response_text = ' '.join(text_parts)
        else:
            response_text = str(final_message.content)
    else:
        response_text = str(final_message)
    
    # Add logging to debug
    print(f"Final message type: {type(final_message)}")
    print(f"Final message content: {final_message.content if hasattr(final_message, 'content') else final_message}")
    print(f"Extracted response text: {response_text}")
    
    # Fallback if response is empty
    if not response_text or response_text.strip() == "":
        # Check if we have tool data that indicates success
        if result.get("tool_data", {}).get("tool_create_playlist"):
            playlist_data = result["tool_data"]["tool_create_playlist"]
            if playlist_data.get("status") == "success":
                response_text = f"Successfully created playlist: {playlist_data.get('message', 'Playlist created')}"
    
    # Return both the LLM response and the raw tool data
    return {
        "response": response_text,
        "tool_data": result.get("tool_data", {})
    }

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    body = json.loads(event.get("body", "{}"))
    user_query = body.get("user_query", "")
    if not user_query:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "user_query is required"}),
        }
    
    try:
        result = run_agent(user_query)
        return {
            "statusCode": 200,
            "body": json.dumps(result),
        }
    except Exception as e:
        print(f"Error in handler: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }