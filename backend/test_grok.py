import asyncio
import os
from dotenv import load_dotenv
from services.ai_service import AIService

async def test_grok():
    load_dotenv()
    service = AIService()
    
    print("Testing Grok-4.20-reasoning Integration...")
    
    resume = "Software Engineer with 5 years experience in Python and FastAPI."
    job_desc = "Seeking a Senior Python Developer with strong backend skills."
    
    score = await service.calculate_compatibility(resume, job_desc)
    print(f"Compatibility Score: {score}")
    
    optimization = await service.optimize_resume(resume, job_desc)
    print("\nOptimized Resume Snippet:")
    print(optimization[:200] + "...")
    
    question = "What is your experience with asynchronous programming?"
    answer = "I have used asyncio in several high-traffic microservices."
    evaluation = await service.evaluate_answer(question, answer, "Software Engineer")
    print(f"\nInterview Evaluation Score: {evaluation['score']}")
    print(f"Feedback: {evaluation['feedback']}")

if __name__ == "__main__":
    asyncio.run(test_grok())
