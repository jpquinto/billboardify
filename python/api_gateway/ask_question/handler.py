import json
import os
from typing import Any, Dict, List, TypedDict

import boto3
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph
from sql_generator import SQLGenerator

class AgentState(TypedDict):
    generator: SQLGenerator
    user_query: str
    query_embedding: List[float]
    question_sql_examples: List[Dict[str, str]]
    ddl_examples: List[Dict[str, str]]
    message_log: List[Dict[str, str]]
    generated_sql: str
    rds_response: List[Any]
    text_response: str
    retry_count: int
    validation_error: str

llm_model_id = os.environ.get(
    "BEDROCK_LLM_MODEL_ID",
    "amazon.nova-pro-v1:0"
)

## Nodes
def connect_to_postgres(state: AgentState):
    state["generator"].connect_to_postgres()
    return {}

def generate_embedding(state: AgentState):
    user_query = state["user_query"]
    query_embedding = state["generator"].generate_embedding(user_query)
    print(f"Generated embedding for query: {user_query}")
    return {"query_embedding": query_embedding}

def get_similar_question_sql(state: AgentState):
    query_embedding = state["query_embedding"]
    question_sql_examples = state["generator"].get_similar_question_sql(query_embedding, top_k=3)
    return {"question_sql_examples": question_sql_examples}

def get_related_ddl(state: AgentState):
    query_embedding = state["query_embedding"]
    ddl_examples = state["generator"].get_related_ddl(query_embedding, top_k=3)
    return {"ddl_examples": ddl_examples}

def get_sql_prompt(state: AgentState):
    initial_prompt = None
    question = state["user_query"]
    question_sql_list = state["question_sql_examples"]
    ddl_list = state["ddl_examples"]

    message_log = state["generator"].get_sql_prompt(
        initial_prompt=initial_prompt,
        question=question,
        question_sql_list=question_sql_list,
        ddl_list=ddl_list,
    )
    return {"message_log": message_log}

def validate_sql(state: AgentState):
    """
    Validate the generated SQL query.
    Returns validation results to state.
    """
    generated_sql = state["generated_sql"]
    is_valid, error_msg = state["generator"].is_valid_sql(generated_sql)
    
    if not is_valid:
        print(f"SQL validation failed: {error_msg}")
        return {"validation_error": error_msg}
    
    print("SQL validation passed")
    return {"validation_error": ""}

def check_sql_validity(state: AgentState) -> str:
    """
    Router function to determine next step based on SQL validity.
    """
    # Check if validation error exists
    validation_error = state.get("validation_error", "")
    retry_count = state.get("retry_count", 0)
    max_retries = 2  # Maximum number of retry attempts
    
    if validation_error:
        if retry_count < max_retries:
            print(f"SQL invalid, retrying (attempt {retry_count + 1}/{max_retries})")
            return "retry"
        else:
            print(f"SQL invalid after {max_retries} retries, failing")
            return "failed"
    
    return "valid"

def increment_retry(state: AgentState):
    """
    Increment the retry counter and prepare for retry.
    """
    retry_count = state.get("retry_count", 0) + 1
    print(f"Incrementing retry count to {retry_count}")
    return {"retry_count": retry_count}

def handle_validation_failure(state: AgentState):
    """
    Handle case where SQL validation failed after max retries.
    """
    error_msg = f"Failed to generate valid SQL after {state.get('retry_count', 0)} attempts. Last error: {state.get('validation_error', 'Unknown error')}"
    print(error_msg)
    return {
        "text_response": error_msg,
        "rds_response": []
    }

def call_llm(state: AgentState):
    message_log = state["message_log"]
    generated_sql = state["generator"].call_llm(message_log)
    return {"generated_sql": generated_sql}


def execute_query(state: AgentState):
    """
    Execute the validated SQL query and format the response.
    """
    generated_sql = state["generated_sql"]

    print(f"Executing SQL: {generated_sql}")
    
    # Execute query using the generator's execute_query method
    result = state["generator"].execute_query(generated_sql)
    
    if result['success']:
        # Format successful response
        print(f"Query executed successfully: {result['row_count']} rows returned")
        
        # Create a formatted text response
        text_response = f"Query executed successfully. Retrieved {result['row_count']} rows.\n\n"
        text_response += f"SQL Query:\n{generated_sql}\n\n"
        
        if result['row_count'] > 0:
            text_response += f"Columns: {', '.join(result['columns'])}\n"
            text_response += f"First {min(5, result['row_count'])} rows shown below."
        else:
            text_response += "No rows returned."

        print(text_response)
        print(f"RDS Response: {result['data'][:5]}")  # Print first 5 rows of data
        
        return {
            "rds_response": result['data'],
            "text_response": text_response
        }
    else:
        # Handle execution error
        error_msg = f"Query execution failed: {result['error']}\n\nSQL Query:\n{generated_sql}"
        print(f"Query execution failed: {result['error']}")
        
        return {
            "rds_response": [],
            "text_response": error_msg
        }

def close_connection(state: AgentState):
    state["generator"].close_connection()
    return {}

def create_graph():
    workflow = StateGraph(AgentState)

    # Add all nodes
    workflow.add_node("connect_to_postgres", connect_to_postgres)
    workflow.add_node("generate_embedding", generate_embedding)
    workflow.add_node("get_similar_question_sql", get_similar_question_sql)
    workflow.add_node("get_related_ddl", get_related_ddl)
    workflow.add_node("get_sql_prompt", get_sql_prompt)
    workflow.add_node("call_llm", call_llm)
    workflow.add_node("validate_sql", validate_sql)
    workflow.add_node("increment_retry", increment_retry)
    workflow.add_node("handle_validation_failure", handle_validation_failure)
    workflow.add_node("execute_query", execute_query)
    workflow.add_node("close_connection", close_connection)

    # Set entry point
    workflow.set_entry_point("connect_to_postgres")

    # Linear flow up to embedding
    workflow.add_edge("connect_to_postgres", "generate_embedding")

    # Parallel retrieval of examples
    workflow.add_edge("generate_embedding", "get_similar_question_sql")
    workflow.add_edge("generate_embedding", "get_related_ddl")
    
    # All three retrieval nodes converge to get_sql_prompt
    workflow.add_edge("get_similar_question_sql", "get_sql_prompt")
    workflow.add_edge("get_related_ddl", "get_sql_prompt")

    # LLM call and validation
    workflow.add_edge("get_sql_prompt", "call_llm")
    workflow.add_edge("call_llm", "validate_sql")

    # Conditional routing based on validation result
    workflow.add_conditional_edges(
        "validate_sql",
        check_sql_validity,
        {
            "valid": "execute_query",
            "retry": "increment_retry",
            "failed": "handle_validation_failure"
        }
    )

    # Retry loop: increment counter then go back to call_llm
    workflow.add_edge("increment_retry", "call_llm")

    # Both success and failure paths go to close_connection
    workflow.add_edge("execute_query", "close_connection")
    workflow.add_edge("handle_validation_failure", "close_connection")
    
    # End
    # workflow.add_edge("close_connection", END)

    app = workflow.compile()

    return app

def run_agent(user_query: str) -> Dict[str, Any]:
    try:
        generator = SQLGenerator()
        app = create_graph()
        print(f"Running agent with user query: {user_query}")
        llm_response = app.invoke(
            {
                "generator": generator,
                "user_query": user_query,
                "query_embedding": [],
                "question_sql_examples": [],
                "ddl_examples": [],
                "message_log": [],
                "generated_sql": "",
                "rds_response": [],
                "text_response": "",
            }
        )
        generated_sql = llm_response.get("generated_sql", "")
        text_response = llm_response.get("text_response", "")
        print(f"Agent response - SQL: {generated_sql}")
        return {
            "sql": generated_sql,
            "response": text_response
        }
    except Exception as e:
        print(f"Error during agent execution: {e}")
        return {"error": str(e)}
    
def handler(event, context):
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract user_query from the body
        user_query = body.get('user_query') or body.get('query')
        
        if not user_query:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "user_query is required in request body"
                }),
            }

        print(f"Processing request with user_query: {user_query}")

        response = run_agent(user_query=user_query)

        print(f"Returning response: {json.dumps(response) if not isinstance(response, dict) or 'error' not in response else 'Error response'}")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "response": response,
            }),
        }
    
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
        }
