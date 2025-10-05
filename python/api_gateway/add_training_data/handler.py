import json
from rag_trainer import RAGTrainer

def handler(event, context):
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract question and sql from the body
        question = body.get('question')
        sql = body.get('sql')
        
        if not question or not sql:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Both 'question' and 'sql' are required in request body"
                }),
            }

        print(f"Processing HITL feedback - Question: {question}")
        print(f"SQL: {sql}")

        trainer = RAGTrainer()

        # Create question-sql pair in the expected format
        question_sql_pair = [{
            "question": question,
            "sql": sql
        }]

        # Process the single question-sql pair
        trainer.process_question_sql(question_sql_pair)

        # Connect to postgres and train
        trainer.connect_to_postgres()
        trainer.train()
        trainer.close_connection()

        print("HITL feedback processed successfully!")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Training data added successfully!",
                "question": question
            }),
        }
    
    except Exception as e:
        print(f"Error processing HITL feedback: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
        }