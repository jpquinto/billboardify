import pg8000
from typing import List, Dict
from rag_base import RAGBase

class RAGTrainer(RAGBase):
    """
    Trainer class for RAG system. Handles ingestion of training data
    (question-SQL pairs, DDL statements, documentation) and storage in vector database.
    """

    def __init__(self, config=None):
        super().__init__(config)
        
        # Set embedding input type for training documents
        self.embedding_input_type = "search_document"
        
        # Initialize training data collection
        self.training_data: List[Dict] = []
    
    def add_question_sql(self, question: str, sql: str, **kwargs) -> str:
        """
        Adds a question-SQL pair to the training data.
        
        Args:
            question: The natural language question
            sql: The corresponding SQL query
            **kwargs: Additional options
            
        Returns:
            Success message or empty string on failure
        """
        # Generate embedding for the question
        embedding = self.generate_embedding(question)
        
        if not embedding:
            self.log("Failed to generate embedding for question", title="Error")
            return ""
        
        training_datum = {
            "content": question,
            "embedding": embedding,
            "type": "question-sql",
            "sql": sql
        }
        
        self.training_data.append(training_datum)
        self.log(f"Added question-SQL pair")
        
        return "success"
    
    def process_question_sql(self, questions: List[Dict[str, str]]) -> Dict[str, int]:
        """
        Process a list of question-SQL pairs and add them to training data.
        
        Args:
            questions: List of dictionaries with 'question' and 'sql' keys
            
        Returns:
            Dict with 'success' and 'failed' counts
        """
        success_count = 0
        failed_count = 0
        
        self.log(f"Processing {len(questions)} question-SQL pairs...")
        
        for i, item in enumerate(questions, 1):
            question = item.get('question') or item.get('query')
            sql = item.get('sql')
            
            if not question or not sql:
                self.log(f"Skipping item {i}: missing question or sql", title="Warning")
                failed_count += 1
                continue
            
            result = self.add_question_sql(question, sql)
            
            if result == "success":
                success_count += 1
            else:
                failed_count += 1
        
        self.log(f"Processed question-SQL pairs: {success_count} success, {failed_count} failed")
        
        return {"success": success_count, "failed": failed_count}

    def add_ddl(self, ddl: str, **kwargs) -> str:
        """
        Adds a DDL statement to the training data.
        
        Args:
            ddl: The DDL statement (CREATE TABLE, etc.)
            **kwargs: Additional options
            
        Returns:
            Success message or empty string on failure
        """
        # Generate embedding for the DDL
        embedding = self.generate_embedding(ddl)
        
        if not embedding:
            self.log("Failed to generate embedding for DDL", title="Error")
            return ""
        
        training_datum = {
            "content": ddl,
            "embedding": embedding,
            "type": "ddl",
            "sql": None
        }
        
        self.training_data.append(training_datum)
        self.log(f"Added DDL statement")
        
        return "success"
    
    def process_ddls(self, ddl_statements: List[str]) -> Dict[str, int]:
        """
        Process a list of DDL statements and add them to training data.
        
        Args:
            ddl_statements: List of DDL statement strings
            
        Returns:
            Dict with 'success' and 'failed' counts
        """
        success_count = 0
        failed_count = 0
        
        self.log(f"Processing {len(ddl_statements)} DDL statements...")
        
        for i, ddl in enumerate(ddl_statements, 1):
            if not ddl or not ddl.strip():
                self.log(f"Skipping empty DDL statement {i}", title="Warning")
                failed_count += 1
                continue
            
            result = self.add_ddl(ddl)
            
            if result == "success":
                success_count += 1
            else:
                failed_count += 1
        
        self.log(f"Processed DDL statements: {success_count} success, {failed_count} failed")
        
        return {"success": success_count, "failed": failed_count}

    def add_documentation(self, documentation: str, **kwargs) -> str:
        """
        Adds documentation to the training data.
        
        Args:
            documentation: The documentation text
            **kwargs: Additional options
            
        Returns:
            Success message or empty string on failure
        """
        # Generate embedding for the documentation
        embedding = self.generate_embedding(documentation)
        
        if not embedding:
            self.log("Failed to generate embedding for documentation", title="Error")
            return ""
        
        training_datum = {
            "content": documentation,
            "embedding": embedding,
            "type": "documentation",
            "sql": None
        }
        
        self.training_data.append(training_datum)
        self.log(f"Added documentation")
        
        return "success"
    
    def process_documentation(self, documentation: List[str]) -> Dict[str, int]:
        """
        Process a list of documentation strings and add them to training data.
        
        Args:
            documentation: List of documentation strings
            
        Returns:
            Dict with 'success' and 'failed' counts
        """
        success_count = 0
        failed_count = 0
        
        self.log(f"Processing {len(documentation)} documentation entries...")
        
        for i, doc in enumerate(documentation, 1):
            if not doc or not doc.strip():
                self.log(f"Skipping empty documentation entry {i}", title="Warning")
                failed_count += 1
                continue
            
            result = self.add_documentation(doc)
            
            if result == "success":
                success_count += 1
            else:
                failed_count += 1
        
        self.log(f"Processed documentation: {success_count} success, {failed_count} failed")
        
        return {"success": success_count, "failed": failed_count}
    
    def train(self):
        """
        Trains the model by inserting all training data into the vector store.
        Sets up the database (pgvector extension and table) if needed, then inserts all training data.
        
        Raises:
            ValueError: If connection is not established
            pg8000.Error: If database operations fail
        """
        if not self.connection:
            raise ValueError("Database connection not established. Call connect_to_postgres() first.")
        
        try:
            with self.connection.cursor() as cursor:
                # Step 1: Create pgvector extension if it doesn't exist
                self.log("Creating pgvector extension if not exists...")
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                self.connection.commit()
                self.log("pgvector extension ready")
                
                # Step 2: Create training_embeddings table if it doesn't exist
                self.log("Creating training_embeddings table if not exists...")
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS training_embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    content TEXT NOT NULL,
                    embedding vector(1536),
                    type VARCHAR(50) NOT NULL,
                    sql TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
                cursor.execute(create_table_sql)
                self.connection.commit()
                self.log("training_embeddings table ready")
                
                # Step 3: Create index for vector similarity search if it doesn't exist
                self.log("Creating vector index if not exists...")
                create_index_sql = """
                    CREATE INDEX IF NOT EXISTS training_embeddings_embedding_idx 
                    ON training_embeddings 
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """
                cursor.execute(create_index_sql)
                self.connection.commit()
                self.log("Vector index ready")
                
                # Step 4: Insert training data
                if not self.training_data:
                    self.log("No training data to insert", title="Warning")
                    return
                
                self.log(f"Inserting {len(self.training_data)} training examples...")
                
                insert_sql = """
                    INSERT INTO training_embeddings (content, embedding, type, sql)
                    VALUES (%s, %s, %s, %s)
                """
                
                inserted_count = 0
                for datum in self.training_data:
                    try:
                        # Convert embedding list to pgvector format string
                        embedding_str = '[' + ','.join(map(str, datum['embedding'])) + ']'
                        
                        cursor.execute(
                            insert_sql,
                            (
                                datum['content'],
                                embedding_str,
                                datum['type'],
                                datum['sql']
                            )
                        )
                        inserted_count += 1
                        
                    except Exception as e:
                        self.log(f"Error inserting training datum: {e}", title="Error")
                        self.connection.rollback()
                        raise e
                
                # Commit all inserts
                self.connection.commit()
                self.log(f"Successfully inserted {inserted_count} training examples")
                
        except pg8000.Error as e:
            self.log(f"Database error during training: {e}", title="Error")
            if self.connection:
                self.connection.rollback()
            raise e
        except Exception as e:
            self.log(f"Unexpected error during training: {e}", title="Error")
            if self.connection:
                self.connection.rollback()
            raise e

    