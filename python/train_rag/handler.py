
from utils.get_questions import get_questions
from utils.get_ddls import get_ddls
from rag_trainer import RAGTrainer

def handler(event, context):
    trainer = RAGTrainer()

    print("Processing training data...")
    questions = get_questions()
    ddls = get_ddls()

    trainer.process_question_sql(questions)
    trainer.process_ddls(ddls)

    trainer.connect_to_postgres()

    trainer.train()

    trainer.close_connection()

    return {
        "statusCode": 200,
        "body": "Hello from Lambda!"
    }