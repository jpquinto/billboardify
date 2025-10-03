import json
import pg8000
from typing import List, Dict, Optional
from utils.rag_base import RAGBase


class SQLGenerator(RAGBase):
    """
    Generator class for RAG system. Handles query embedding, retrieval of similar
    training examples, and SQL generation via LLM.
    """
    
    def __init__(self, config=None):
        super().__init__(config)
        
        # Set embedding input type for search queries
        self.embedding_input_type = "search_query"

        self.prompt = ""
        
        # LLM configuration
        self.llm_model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
        
        # Retrieval configuration
        self.top_k = self.config.get("top_k", 10)  # Number of similar examples to retrieve

    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}
    
    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def generate_sql(self):
        pass

    def get_sql_prompt(
        self,
        initial_prompt: str,
        question: str,
        question_sql_list: List[Dict],
        ddl_list: List[Dict],
        doc_list: List[Dict],
        **kwargs,
    ):
        """
        Generate a prompt for the LLM to generate SQL.

        Args:
            initial_prompt: The initial system prompt (if None, uses default)
            question: The question to generate SQL for
            question_sql_list: List of dicts with 'question', 'sql', 'similarity' keys
            ddl_list: List of dicts with 'content', 'similarity' keys
            doc_list: List of dicts with 'content', 'similarity' keys
            tenant_id: The tenant ID to use for filtering (optional)

        Returns:
            List of message dicts formatted for the LLM
        """

        if initial_prompt is None:
            initial_prompt = (
                "You are an SQL expert generating queries for RDS (PostgreSQL). "
                "Please help to generate a SQL query to answer the question. "
                "Your response should ONLY be based on the given context and follow the response guidelines and format instructions."
            )

        # Add DDL statements to prompt
        if ddl_list:
            initial_prompt += "\n===Database Schema (DDL)\n"
            for ddl in ddl_list:
                initial_prompt += f"{ddl['content']}\n\n"

        # Add documentation to prompt
        if doc_list:
            initial_prompt += "\n===Additional Context\n"
            for doc in doc_list:
                initial_prompt += f"{doc['content']}\n\n"

        # Add response guidelines
        initial_prompt += (
            "\n===Response Guidelines\n"
            "1. If the provided context is sufficient, please generate a valid SQL query without any explanations for the question.\n"
            "2. If the provided context is insufficient, please explain why it can't be generated.\n"
            "3. Please use the most relevant table(s).\n"
            "4. If the question has been asked and answered before, please repeat the answer exactly as it was given before.\n"
            "5. Ensure that the output SQL is Athena/Presto-compliant and executable, and free of syntax errors.\n"
            "6. If querying a large table, limit the results to 10 at the max using LIMIT.\n"
        )
        
        # Start with system message
        message_log = [self.system_message(initial_prompt)]

        # Add few-shot examples from similar questions
        for example in question_sql_list:
            if example and "question" in example and "sql" in example:
                message_log.append(self.user_message(example["question"]))
                message_log.append(self.assistant_message(example["sql"]))

        # Add the actual user question
        message_log.append(self.user_message(question))

        return message_log


    def is_valid_sql(self, sql: str) -> tuple[bool, str]:
        """
        Validate if the generated SQL is valid and safe to execute.
        
        Args:
            sql: The SQL query string to validate
            
        Returns:
            Tuple of (is_valid: bool, error_message: str)
            If valid, error_message will be empty string
            If invalid, error_message will contain the reason
        """
        if not sql:
            return False, "SQL query is empty"
        
        # Strip whitespace and convert to uppercase for checking
        sql_stripped = sql.strip()
        sql_upper = sql_stripped.upper()
        
        # Check if SQL starts with SELECT
        if not sql_upper.startswith('SELECT'):
            return False, "SQL query must start with SELECT statement"
        
        # If we get here, it's valid
        return True, ""

    def get_similar_question_sql(self, query_embedding: List[float], top_k: Optional[int] = None) -> List[Dict]:
        """
        Retrieve the most similar question-SQL pairs from the vector database.
        Uses connection pool for parallel-safe execution.
        
        Args:
            query_embedding: The embedding vector for the user's question
            top_k: Number of similar examples to retrieve (defaults to self.top_k)
            
        Returns:
            List of dicts with 'question', 'sql', and 'similarity' keys
            
        Raises:
            ValueError: If connection pool is not initialized
        """
        if top_k is None:
            top_k = self.top_k
        
        # Convert embedding to pgvector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        # Get connection from pool
        conn = self._get_connection()
        
        try:
            cursor = conn.cursor()
            
            try:
                # Query for most similar question-SQL pairs using cosine similarity
                # The <=> operator computes cosine distance (lower is more similar)
                query = """
                    SELECT 
                        content,
                        sql,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM training_embeddings
                    WHERE type = 'question-sql'
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """
                
                cursor.execute(query, (embedding_str, embedding_str, top_k))
                results = cursor.fetchall()

                if not results:
                    self.log("No question-sql entries found")
                    return []
                
                # Format results
                similar_examples = []
                for row in results:
                    similar_examples.append({
                        "question": row[0],
                        "sql": row[1],
                        "similarity": float(row[2])
                    })
                
                self.log(f"Retrieved {len(similar_examples)} similar question-SQL pairs")
                return similar_examples
                
            finally:
                cursor.close()
                
        except pg8000.Error as e:
            self.log(f"Database error during similarity search: {e}", title="Error")
            raise e
        except Exception as e:
            self.log(f"Unexpected error during similarity search: {e}", title="Error")
            raise e
        finally:
            # Always return connection to pool
            self._return_connection(conn)

    def get_related_documentation(self, query_embedding: List[float], top_k: Optional[int] = None) -> List[Dict]:
        """
        Retrieve the most relevant documentation from the vector database.
        Uses connection pool for parallel-safe execution.
        
        Args:
            query_embedding: The embedding vector for the user's question
            top_k: Number of documentation entries to retrieve (defaults to self.top_k)
            
        Returns:
            List of dicts with 'content' and 'similarity' keys
            
        Raises:
            ValueError: If connection pool is not initialized
        """
        if top_k is None:
            top_k = self.top_k
        
        # Convert embedding to pgvector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'

        # Get connection from pool
        conn = self._get_connection()
        
        try:
            cursor = conn.cursor()
            
            try:
                # Query for most relevant documentation using cosine similarity
                query = """
                    SELECT 
                        content,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM training_embeddings
                    WHERE type = 'documentation'
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """
                
                cursor.execute(query, (embedding_str, embedding_str, top_k))
                results = cursor.fetchall()

                if not results:
                    self.log("No documentation entries found")
                    return []
                
                # Format results
                documentation = []
                for row in results:
                    documentation.append({
                        "content": row[0],
                        "similarity": float(row[1])
                    })
                
                self.log(f"Retrieved {len(documentation)} related documentation entries")
                return documentation
                
            finally:
                cursor.close()
                
        except pg8000.Error as e:
            self.log(f"Database error during documentation search: {e}", title="Error")
            raise e
        except Exception as e:
            self.log(f"Unexpected error during documentation search: {e}", title="Error")
            raise e
        finally:
            # Always return connection to pool
            self._return_connection(conn)

    def get_related_ddl(self, query_embedding: List[float], top_k: Optional[int] = None) -> List[Dict]:
        """
        Retrieve the most relevant DDL statements from the vector database.
        Uses connection pool for parallel-safe execution.
        
        Args:
            query_embedding: The embedding vector for the user's question
            top_k: Number of DDL statements to retrieve (defaults to self.top_k)
            
        Returns:
            List of dicts with 'content' and 'similarity' keys
            
        Raises:
            ValueError: If connection pool is not initialized
        """
        if top_k is None:
            top_k = self.top_k

        # Convert embedding to pgvector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        # Get connection from pool
        conn = self._get_connection()
        
        try:
            cursor = conn.cursor()
            
            try:
                # Query for most relevant DDL statements using cosine similarity
                query = """
                    SELECT 
                        content,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM training_embeddings
                    WHERE type = 'ddl'
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """
                
                cursor.execute(query, (embedding_str, embedding_str, top_k))
                results = cursor.fetchall()

                if not results:
                    self.log("No DDL entries found")
                    return []
                
                # Format results
                ddl_statements = []
                for row in results:
                    ddl_statements.append({
                        "content": row[0],
                        "similarity": float(row[1])
                    })
                
                self.log(f"Retrieved {len(ddl_statements)} related DDL statements")
                return ddl_statements
                
            finally:
                cursor.close()
                
        except pg8000.Error as e:
            self.log(f"Database error during DDL search: {e}", title="Error")
            raise e
        except Exception as e:
            self.log(f"Unexpected error during DDL search: {e}", title="Error")
            raise e
        finally:
            # Always return connection to pool
            self._return_connection(conn)

    def call_llm(self, message_log: List[Dict], **kwargs) -> str:
        """
        Call the Bedrock LLM to generate SQL based on the provided messages.
        
        Args:
            message_log: List of message dicts with 'role' and 'content' keys
            **kwargs: Additional options for the LLM call
            
        Returns:
            The generated SQL query string
            
        Raises:
            Exception: If LLM call fails
        """
        try:
            # Separate system message from conversation messages
            system_message = ""
            messages = []
            
            for msg in message_log:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            # Prepare the request body for Claude
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": kwargs.get("max_tokens", 4096),
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.0),  # Low temp for deterministic SQL
            }
            
            # Add system message if present
            if system_message:
                body["system"] = system_message
            
            self.log(f"Calling LLM model: {self.llm_model_id}")
            
            # Invoke the Bedrock model
            response = self.bedrock_runtime.invoke_model(
                body=json.dumps(body),
                modelId=self.llm_model_id,
                accept='application/json',
                contentType='application/json'
            )
            
            # Parse response
            response_body = json.loads(response.get('body').read())
            
            # Extract the generated text from Claude's response
            generated_sql = response_body.get('content')[0].get('text')
            
            self.log(f"Successfully generated SQL")
            
            return generated_sql
            
        except Exception as e:
            self.log(f"Error calling LLM: {e}", title="Error")
            raise e

    def generate_followup_questions(self):
        pass