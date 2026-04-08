from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from services.ai_service import AIService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
ai_service = AIService()

# --- Models ---
class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    description: str
    posted_date: str
    status: str = "pending_review"  # pending_review, approved, rejected
    compatibility_score: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    company: str
    title: str
    status: str = "Applied" # Applied, Interviewing, Offer, Rejected
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResumeData(BaseModel):
    original_resume: str
    target_job_description: str
    hiring_manager_linkedin: Optional[str] = None

class InterviewSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_title: str
    status: str = "active"
    questions: List[str] = []
    answers: List[str] = []
    scores: List[int] = []
    feedbacks: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Endpoints ---

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs():
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(1000)
    for j in jobs:
        if isinstance(j.get('created_at'), str):
            j['created_at'] = datetime.fromisoformat(j['created_at'])
    return jobs

@api_router.post("/jobs", response_model=Job)
async def create_job(job: Job):
    doc = job.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.jobs.insert_one(doc)
    return job

@api_router.post("/jobs/{job_id}/score")
async def score_job(job_id: str, request: dict):
    # request: {"resume_text": "..."}
    job_doc = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    score = await ai_service.calculate_compatibility(request.get("resume_text", ""), job_doc["description"])
    
    await db.jobs.update_one({"id": job_id}, {"$set": {"compatibility_score": score}})
    return {"score": score}

@api_router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, request: dict):
    new_status = request.get("status")
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": new_status}})
    
    # If approved, create an application entry automatically
    if new_status == "approved":
        job_doc = await db.jobs.find_one({"id": job_id}, {"_id": 0})
        app_doc = Application(job_id=job_id, company=job_doc["company"], title=job_doc["title"])
        doc = app_doc.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.applications.insert_one(doc)
        
    return {"status": "success"}

@api_router.get("/applications", response_model=List[Application])
async def get_applications():
    apps = await db.applications.find({}, {"_id": 0}).to_list(1000)
    for a in apps:
        if isinstance(a.get('created_at'), str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
        if isinstance(a.get('updated_at'), str):
            a['updated_at'] = datetime.fromisoformat(a['updated_at'])
    return apps

@api_router.put("/applications/{app_id}/status")
async def update_app_status(app_id: str, request: dict):
    new_status = request.get("status")
    await db.applications.update_one(
        {"id": app_id}, 
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@api_router.post("/resume/optimize")
async def optimize_resume(data: ResumeData):
    optimized_resume = await ai_service.optimize_resume(
        data.original_resume, 
        data.target_job_description,
        data.hiring_manager_linkedin
    )
    return {"optimized_resume": optimized_resume}

@api_router.post("/resume/cover-letter")
async def generate_cover_letter(data: ResumeData):
    cover_letter = await ai_service.generate_cover_letter(
        data.original_resume, 
        data.target_job_description,
        data.hiring_manager_linkedin
    )
    return {"cover_letter": cover_letter}

@api_router.post("/interview/start")
async def start_interview(request: dict):
    job_title = request.get("job_title", "General")
    session = InterviewSession(job_title=job_title)
    
    first_question = await ai_service.generate_interview_question(job_title, [])
    session.questions.append(first_question)
    
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.interviews.insert_one(doc)
    
    return {"session_id": session.session_id, "first_question": first_question}

@api_router.post("/interview/{session_id}/answer")
async def evaluate_answer(session_id: str, request: dict):
    answer = request.get("answer")
    session_doc = await db.interviews.find_one({"session_id": session_id}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404)
        
    last_question = session_doc["questions"][-1]
    evaluation = await ai_service.evaluate_answer(last_question, answer, session_doc["job_title"])
    
    # Generate next question if < 5
    next_question = None
    if len(session_doc["questions"]) < 5:
        next_question = await ai_service.generate_interview_question(session_doc["job_title"], session_doc["questions"])
        
    # Update DB
    await db.interviews.update_one(
        {"session_id": session_id},
        {
            "$push": {
                "answers": answer,
                "scores": evaluation["score"],
                "feedbacks": evaluation["feedback"],
            }
        }
    )
    
    if next_question:
        await db.interviews.update_one(
            {"session_id": session_id},
            {"$push": {"questions": next_question}}
        )
    else:
        await db.interviews.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed"}}
        )
        
    return {
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "next_question": next_question,
        "is_complete": next_question is None
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
