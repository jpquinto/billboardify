import json
import logging
import os
import re
import time
from typing import Any, Dict, List, TypedDict

import boto3
from langgraph.graph import StateGraph, END
from sql_generator import SQLGenerator

class AgentState(TypedDict):
    generator: SQLGenerator
    user_query: str
    tenant_id: str
    query_embedding: List[float]
    question_sql_examples: List[Dict[str, str]]
    documentation_examples: List[Dict[str, str]]
    ddl_examples: List[Dict[str, str]]
    message_log: List[Dict[str, str]]
    generated_sql: str
    athena_response: List[Any]
    text_response: str
    retry_count: int
    validation_error: str

llm_model_id = os.environ.get(
    "BEDROCK_LLM_MODEL_ID",
    "anthropic.claude-3-5-sonnet-20241022-v2:0"
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

def get_related_documentation(state: AgentState):
    query_embedding = state["query_embedding"]
    documentation_examples = state["generator"].get_related_documentation(query_embedding, top_k=3)
    return {"documentation_examples": documentation_examples}

def get_related_ddl(state: AgentState):
    query_embedding = state["query_embedding"]
    ddl_examples = state["generator"].get_related_ddl(query_embedding, top_k=3)
    return {"ddl_examples": ddl_examples}

def get_sql_prompt(state: AgentState):
    initial_prompt = None
    question = state["user_query"]
    question_sql_list = state["question_sql_examples"]
    ddl_list = state["ddl_examples"]
    doc_list = state["documentation_examples"]
    tenant_id = state["tenant_id"]

    message_log = state["generator"].get_sql_prompt(
        initial_prompt=initial_prompt,
        question=question,
        question_sql_list=question_sql_list,
        ddl_list=ddl_list,
        doc_list=doc_list,
        tenant_id=tenant_id
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
        "athena_response": []
    }

def call_llm(state: AgentState):
    message_log = state["message_log"]
    generated_sql = state["generator"].call_llm(message_log)
    return {"generated_sql": generated_sql}

def execute_query(state: AgentState):
    generated_sql = state["generated_sql"]
    athena_response = "MOCK RESPONSE"  # TODO: implement later
    return {
        "athena_response": athena_response,
        "text_response": generated_sql  # Add this so run_agent can access it
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
    workflow.add_node("get_related_documentation", get_related_documentation)
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
    workflow.add_edge("generate_embedding", "get_related_documentation")
    workflow.add_edge("generate_embedding", "get_related_ddl")
    
    # All three retrieval nodes converge to get_sql_prompt
    workflow.add_edge("get_similar_question_sql", "get_sql_prompt")
    workflow.add_edge("get_related_documentation", "get_sql_prompt")
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
    workflow.add_edge("close_connection", END)

    app = workflow.compile()

    return app

def run_agent(user_query: str, tenant_id: str) -> Dict[str, Any]:
    try:
        generator = SQLGenerator()
        app = create_graph()
        print(f"Running agent with user query: {user_query} and tenant ID: {tenant_id}")
        llm_response = app.invoke(
            {
                "generator": generator,
                "user_query": user_query,
                "tenant_id": tenant_id,
                "query_embedding": [],
                "question_sql_examples": [],
                "documentation_examples": [],
                "ddl_examples": [],
                "message_log": [],
                "generated_sql": "",
                "athena_response": [],
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

    tenant_id = '32bbf67c-cba7-4d0b-aea6-67388e016b5b'
    message_id = '1234'
    user_query = "Who are my top 5 customers by revenue in the last three months?"

    print(f"Processing request with user_query: {user_query}, tenant_id: {tenant_id}, message_id: {message_id}")

    response = run_agent(user_query=user_query, tenant_id=tenant_id)

    print(f"Returning response: {json.dumps(response) if not isinstance(response, dict) or 'error' not in response else 'Error response'}")

    return {
        "statusCode": 200,
        "body": {
            "response": response,
        },
    }
