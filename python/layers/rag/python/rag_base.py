import json
import boto3
import os
import pg8000
import threading
from queue import Queue, Empty
from typing import List, Dict, Optional

class RAGBase():
    """
    Base class for RAG operations providing shared utilities for embedding generation,
    database connection management, and logging.
    """
    
    # Class-level connection pool (shared across all instances)
    _connection_pool = None
    _pool_lock = threading.Lock()
    _pool_size = 3 
    _pool_initialized = False
    
    def __init__(self, config=None):
        if config is None:
            config = {}
        
        self.config = config
        
        # Embedding configuration
        self.model_id = "us.cohere.embed-v4:0"
        
        # Default embedding input type (can be overridden by subclasses)
        self.embedding_input_type = "search_document"
        
        # Initialize the Bedrock client
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
        )
        
        # Database connection (initialized as None, connected later)
        # This is kept for backward compatibility with old single-connection approach
        self.connection: Optional[pg8000.Connection] = None
        
        # Initialize pool on first use
        if RAGBase._connection_pool is None:
            with RAGBase._pool_lock:
                if RAGBase._connection_pool is None:
                    RAGBase._connection_pool = Queue(maxsize=self._pool_size)
    
    def log(self, message: str, title: str = "Info"):
        """
        Log a message with an optional title.
        
        Args:
            message: The message to log
            title: The log level/title (default: "Info")
        """
        print(f"{title}: {message}")
    
    def generate_embedding(self, data: str, **kwargs) -> List[float]:
        """
        Generates an embedding for a given text using the configured Bedrock Cohere model.
        
        Args:
            data: The text to generate an embedding for
            **kwargs: Additional options, including 'input_type' to override default
            
        Returns:
            List of floats representing the embedding vector, or empty list on error
        """
        if not data or not data.strip():
            self.log("Empty input text provided", title="Error")
            return []

        body = json.dumps({
            "texts": [data],
            "input_type": kwargs.get("input_type", self.embedding_input_type)
        })

        try:
            response = self.bedrock_runtime.invoke_model(
                body=body,
                modelId=self.model_id,
                accept='application/json',
                contentType='application/json'
            )

            response_body = json.loads(response.get('body').read())

            embedding = response_body.get('embeddings')['float'][0]

            return embedding

        except Exception as e:
            self.log(f"Error generating embedding: {e}", title="Error")
            return []
    
    def connect_to_postgres(self):
        """
        Establish a connection to PostgreSQL using credentials from Secrets Manager.
        Also initializes the connection pool if not already initialized.
        
        Raises:
            pg8000.Error: If database connection fails
        """
        
        host = os.environ.get('DB_HOST')
        port = os.environ.get('DB_PORT', '5432')
        database = 'postgres'
        user = os.environ.get('DB_USER')
        password = os.environ.get('DB_PASSWORD')
        
        try:
            self.log(f"Connecting to database at {host}:{port}")
            
            # Create single connection for backward compatibility
            self.connection = pg8000.connect(
                host=host,
                port=5432,
                database=database,
                user=user,
                password=password
            )
            
            self.log("Successfully connected to PostgreSQL database")
            
            # Also initialize the connection pool if not already done
            credentials = {
                'host': host,
                'port': port,
                'dbname': database,
                'username': user,
                'password': password
            }
            self._initialize_connection_pool(host, credentials)

        except pg8000.Error as e:
            self.log(f"Database connection error: {e}", title="Error")
            raise e
        except Exception as e:
            self.log(f"Unexpected error during connection: {e}", title="Error")
            raise e
    
    def _initialize_connection_pool(self, host: str, credentials: Dict[str, str]):
        """
        Initialize the connection pool if it's empty.
        
        Args:
            host: Database host
            credentials: Database credentials dictionary
        """
        with RAGBase._pool_lock:
            # Only initialize if pool is empty and not already initialized
            if not RAGBase._pool_initialized:
                self.log(f"Initializing connection pool with {self._pool_size} connections")
                
                for i in range(self._pool_size):
                    try:
                        conn = pg8000.connect(
                            host=host,
                            port=int(credentials['port']),
                            database=credentials['dbname'],
                            user=credentials['username'],
                            password=credentials['password']
                        )
                        RAGBase._connection_pool.put(conn)
                        self.log(f"Created pooled connection {i+1}/{self._pool_size}")
                    except pg8000.Error as e:
                        self.log(f"Failed to create pooled connection {i+1}: {e}", title="Error")
                        # Don't raise here, we might have some connections
                        continue
                
                RAGBase._pool_initialized = True
                self.log(f"Successfully initialized connection pool")
    
    def _get_connection(self, timeout: int = 30) -> pg8000.Connection:
        """
        Get a connection from the pool.
        
        Args:
            timeout: Maximum time to wait for a connection (seconds)
            
        Returns:
            pg8000.Connection: A database connection from the pool
            
        Raises:
            Exception: If no connection is available within the timeout period
        """
        try:
            conn = RAGBase._connection_pool.get(timeout=timeout)
            
            # Test if connection is still alive
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
            except Exception as e:
                # Connection is dead, create a new one
                self.log(f"Connection was stale ({e}), creating new one")
                try:
                    conn.close()
                except:
                    pass
                conn = self._create_new_connection()
            
            return conn
        except Empty:
            raise Exception(f"No database connection available after {timeout} seconds")
    
    def _return_connection(self, conn: pg8000.Connection):
        """
        Return a connection to the pool.
        
        Args:
            conn: The database connection to return
        """
        try:
            RAGBase._connection_pool.put(conn, block=False)
        except Exception as e:
            # Pool is full, close the connection
            self.log(f"Pool is full or error returning connection ({e}), closing connection")
            try:
                conn.close()
            except:
                pass
    
    def _create_new_connection(self) -> pg8000.Connection:
        """
        Create a new database connection with current credentials.
        
        Returns:
            pg8000.Connection: A new database connection
            
        Raises:
            pg8000.Error: If database connection fails
        """
        
        host = os.environ.get('DB_HOST')
        port = os.environ.get('DB_PORT', '5432')
        database = 'postgres'
        user = os.environ.get('DB_USER')
        password = os.environ.get('DB_PASSWORD')
        
        return pg8000.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
    
    def close_connection(self):
        """
        Close the database connection if it exists.
        Note: This does NOT close the connection pool, only the instance connection.
        Use close_connection_pool() to close all pooled connections.
        """
        if self.connection:
            try:
                self.connection.close()
                self.log("Database connection closed")
                self.connection = None
            except Exception as e:
                self.log(f"Error closing connection: {e}", title="Error")
    
    @classmethod
    def close_connection_pool(cls):
        """
        Close all connections in the pool.
        This is typically only called on application shutdown.
        """
        with cls._pool_lock:
            if cls._connection_pool:
                print("Info: Closing all connections in pool")
                closed_count = 0
                while not cls._connection_pool.empty():
                    try:
                        conn = cls._connection_pool.get_nowait()
                        conn.close()
                        closed_count += 1
                    except Empty:
                        break
                    except Exception as e:
                        print(f"Error: Error closing pooled connection: {e}")
                
                print(f"Info: Closed {closed_count} pooled connections")
                cls._pool_initialized = False