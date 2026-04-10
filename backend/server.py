from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

from db import get_connection, init_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize SQLite
init_db()

app = FastAPI()
api_router = APIRouter(prefix="/api")

from services.ai_service import AIService
ai_service = AIService()

from services.scraper_service import scraper_service

# Tracking last scan for cooldown protection
LAST_SCAN_TIME = {}

# Stripe Integration
# stripe_checkout = StripeCheckout(
#     api_key=os.environ.get("STRIPE_API_KEY", "sk_test_..."),
#     webhook_url=os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001") + "/api/webhook/stripe"
# )
stripe_checkout = None

# PACKAGES for Stripe Checkout
PACKAGES = {"pro": 19.99}

# --- Models ---
class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    title: str
    company: str
    description: str
    posted_date: str
    status: str = "pending_review"
    compatibility_score: Optional[int] = None

class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    job_id: str
    company: str
    title: str
    status: str = "Applied"
    notes: str = ""

class ResumeData(BaseModel):
    user_id: str
    original_resume: str
    target_job_description: str
    hiring_manager_linkedin: Optional[str] = None

class InterviewSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    job_title: str
    status: str = "active"
    questions: List[str] = []
    answers: List[str] = []
    scores: List[int] = []
    feedbacks: List[str] = []

class UserProfile(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    base_resume: Optional[str] = None
    personality_profile: Optional[str] = None
    linkedin_url: Optional[str] = None
    subscription_tier: Optional[str] = 'free'
    weekly_goal: int = 10

# --- Helper Functions ---
async def check_usage_limit(user_id: str, service_type: str) -> bool:
    if not user_id: return True # Fallback for anonymous
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM usage_logs WHERE user_id = ? AND service_type = ? AND created_at >= ?", (user_id, service_type, today_start))
    usage_logs = c.fetchall()
    
    # Bypass subscriptions completely for local zero-setup usage
    conn.close()
    return len(usage_logs) < 5

async def log_usage(user_id: str, service_type: str):
    if user_id:
        conn = get_connection()
        conn.execute("INSERT INTO usage_logs (user_id, service_type) VALUES (?, ?)", (user_id, service_type))
        conn.commit()
        conn.close()

# --- Endpoints ---

@api_router.get("/profile")
async def get_profile(user_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return UserProfile(user_id=user_id)
    return dict(row)

@api_router.put("/profile")
async def update_profile(profile: UserProfile):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (profile.user_id,))
    existing = c.fetchone()
    if existing:
        c.execute("UPDATE user_profiles SET name=?, weekly_goal=?, base_resume=?, personality_profile=?, subscription_tier=? WHERE user_id=?", 
                  (profile.full_name, profile.weekly_goal, profile.base_resume, profile.personality_profile, profile.subscription_tier, profile.user_id))
    else:
        c.execute("INSERT INTO user_profiles (user_id, name, base_resume, personality_profile, subscription_tier) VALUES (?, ?, ?, ?, ?)", 
                  (profile.user_id, profile.full_name, profile.base_resume, profile.personality_profile, profile.subscription_tier))
    conn.commit()
    conn.close()
    return profile

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(user_id: str = None):
    conn = get_connection()
    c = conn.cursor()
    if user_id:
        c.execute("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        c.execute("SELECT * FROM jobs ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api_router.post("/jobs", response_model=Job)
async def create_job(job: Job):
    conn = get_connection()
    conn.execute("INSERT INTO jobs (id, user_id, title, company, description, posted_date) VALUES (?, ?, ?, ?, ?, ?)",
        (job.id, job.user_id, job.title, job.company, job.description, job.posted_date))
    conn.commit()
    conn.close()
    return job

@api_router.post("/jobs/aggregate")
async def aggregate_jobs(request: dict):
    user_id = request.get("user_id") or "anonymous"
    
    # ENFORCE 5-MINUTE COOLDOWN
    now = datetime.now()
    if user_id in LAST_SCAN_TIME:
        time_since_last = (now - LAST_SCAN_TIME[user_id]).total_seconds()
        if time_since_last < 300: # 5 minutes
            wait_remaining = int(300 - time_since_last)
            raise HTTPException(status_code=429, detail=f"Scan cooldown active. Please wait {wait_remaining}s to protect your IP.")

    filters = request.get("filters", {})
    keywords = filters.get("keywords", "")
    city = filters.get("city", "")
    state = filters.get("state", "")
    salary_min = filters.get("salary_min", "")
    location = f"{city} {state}".strip() or "Remote"
    limit = request.get("limit", 20)
    
    # Trigger REAL scraping with salary support
    scraped_jobs = await scraper_service.scrape_indeed(
        keywords=keywords, 
        location=location, 
        limit=limit,
        salary_min=salary_min
    )
    
    if not scraped_jobs:
        return {"status": "error", "message": "Scraper was blocked or returned no results. Try again in a few minutes."}

    # Mark scan time upon success
    LAST_SCAN_TIME[user_id] = now

    conn = get_connection()
    jobs_added = []
    for s_job in scraped_jobs:
        job = Job(
            user_id=user_id, 
            title=s_job["title"], 
            company=s_job["company"], 
            description=s_job["description"], 
            posted_date=s_job["posted_date"]
        )
        conn.execute("INSERT INTO jobs (id, user_id, title, company, description, posted_date) VALUES (?, ?, ?, ?, ?, ?)",
            (job.id, job.user_id, job.title, job.company, job.description, job.posted_date))
        jobs_added.append(job.model_dump())
        
    conn.commit()
    conn.close()
    return {"status": "success", "count": len(jobs_added), "jobs": jobs_added}

@api_router.post("/jobs/{job_id}/score")
async def score_job(job_id: str, request: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT description FROM jobs WHERE id=?", (job_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")
    
    score = await ai_service.calculate_compatibility(request.get("resume_text", ""), dict(row)["description"])
    
    conn.execute("UPDATE jobs SET compatibility_score=? WHERE id=?", (score, job_id))
    conn.commit()
    conn.close()
    return {"score": score}

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM jobs WHERE id=?", (job_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@api_router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, request: dict):
    new_status = request.get("status")
    conn = get_connection()
    conn.execute("UPDATE jobs SET status=? WHERE id=?", (new_status, job_id))
    
    if new_status == "approved":
        c = conn.cursor()
        c.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
        job_doc = c.fetchone()
        if job_doc:
            app_id = str(uuid.uuid4())
            conn.execute("INSERT INTO applications (id, job_id, company, title, user_id, status) VALUES (?, ?, ?, ?, ?, 'Saved')",
                (app_id, job_id, job_doc['company'], job_doc['title'], job_doc['user_id']))
                
    conn.commit()
    conn.close()
    return {"status": "success"}

@api_router.get("/applications")
async def get_applications(user_id: str = None):
    conn = get_connection()
    c = conn.cursor()
    if user_id:
        c.execute("SELECT * FROM applications WHERE user_id=? ORDER BY updated_at DESC", (user_id,))
    else:
        c.execute("SELECT * FROM applications ORDER BY updated_at DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api_router.post("/applications")
async def create_application(app: Application):
    conn = get_connection()
    conn.execute("INSERT INTO applications (id, user_id, job_id, company, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (app.id, app.user_id, app.job_id, app.company, app.title, app.status, app.notes))
    conn.commit()
    conn.close()
    return app

@api_router.put("/applications/{app_id}/status")
async def update_app_status(app_id: str, request: dict):
    new_status = request.get("status")
    conn = get_connection()
    conn.execute("UPDATE applications SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (new_status, app_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@api_router.post("/linkedin/analyze")
async def analyze_linkedin(request: dict):
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="LinkedIn URL required")
    profile = await ai_service.analyze_linkedin_personality(url)
    return {"profile": profile}

@api_router.post("/personality/evaluate")
async def evaluate_personality(request: dict):
    answers = request.get("answers", [])
    prompt = f"Analyze the following responses to a multi-framework behavioral personality test (incorporating Big Five OCEAN, DISC, and Jungian MBTI elements):\n{json.dumps(answers)}\n\nGenerate a cohesive, highly professional 2-paragraph personality profile describing this individual's communication style, traits, cognitive processing, and core strengths in the workplace. Return ONLY the profile."
    profile = await ai_service._generate(prompt, "You are an expert organizational psychologist and executive profiler.")
    return {"profile": profile}

@api_router.post("/insights/manager-strategy")
async def get_manager_strategy(request: dict):
    linkedin_url = request.get("linkedin_url")
    user_id = request.get("user_id")
    
    if not linkedin_url or not user_id:
        raise HTTPException(status_code=400, detail="Missing linked url or user_id")
        
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT personality_profile FROM user_profiles WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    
    user_profile = dict(row)["personality_profile"] if row else ""
    if not user_profile:
        user_profile = "No personality test taken. Default to standard professional."
        
    mgr_profile = await ai_service.analyze_linkedin_personality(linkedin_url)
    
    # Run comparative strategy
    prompt = f"User Personality:\n{user_profile}\n\nHiring Manager Persona (from LinkedIn):\n{mgr_profile}\n\nCompare these two profiles. Formulate a 3-bullet point strategy on EXACTLY how the User should communicate with this hiring manager to win them over."
    
    strategy = await ai_service._generate(prompt, "You are an expert communication strategist for high-stakes job interviews.")
    return {
        "manager_analysis": mgr_profile,
        "communication_strategy": strategy
    }

@api_router.get("/artifacts")
async def get_artifacts(user_id: str, artifact_type: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM saved_artifacts WHERE user_id=? AND artifact_type=? ORDER BY created_at DESC", (user_id, artifact_type))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api_router.post("/artifacts")
async def save_artifact(request: dict):
    doc_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute("INSERT INTO saved_artifacts (id, user_id, artifact_type, title, content) VALUES (?, ?, ?, ?, ?)",
                 (doc_id, request["user_id"], request["artifact_type"], request["title"], request["content"]))
    conn.commit()
    conn.close()
    return {"status": "success", "id": doc_id}

@api_router.delete("/artifacts/{doc_id}")
async def delete_artifact(doc_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM saved_artifacts WHERE id=?", (doc_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@api_router.post("/resume/optimize")
async def optimize_resume(data: ResumeData):

    if not await check_usage_limit(data.user_id, 'resume'):
        raise HTTPException(status_code=403, detail="Daily limit reached. Upgrade to Premium.")
        
    optimized_resume = await ai_service.optimize_resume(data.original_resume, data.target_job_description, data.hiring_manager_linkedin)
    await log_usage(data.user_id, 'resume')
    return {"optimized_resume": optimized_resume}

@api_router.post("/resume/cover-letter")
async def generate_cover_letter(data: ResumeData):
    if not await check_usage_limit(data.user_id, 'cover_letter'):
        raise HTTPException(status_code=403, detail="Daily limit reached. Upgrade to Premium.")
        
    cover_letter = await ai_service.generate_cover_letter(data.original_resume, data.target_job_description, data.hiring_manager_linkedin)
    await log_usage(data.user_id, 'cover_letter')
    return {"cover_letter": cover_letter}

@api_router.post("/interview/start")
async def start_interview(request: dict):
    job_title = request.get("job_title", "General")
    user_id = request.get("user_id")
    session = InterviewSession(job_title=job_title, user_id=user_id)
    
    first_question = await ai_service.generate_interview_question(job_title, [])
    session.questions.append(first_question)
    
    conn = get_connection()
    import json
    conn.execute("INSERT INTO interviews (session_id, user_id, job_title, status, questions, answers, scores, feedbacks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (session.session_id, session.user_id, session.job_title, session.status, 
         json.dumps(session.questions), json.dumps(session.answers), json.dumps(session.scores), json.dumps(session.feedbacks)))
    conn.commit()
    conn.close()
    
    return {"session_id": session.session_id, "first_question": first_question}

@api_router.post("/interview/{session_id}/answer")
async def evaluate_answer(session_id: str, request: dict):
    answer = request.get("answer")
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM interviews WHERE session_id=?", (session_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404)
        
    s = dict(row)
    import json
    questions = json.loads(s["questions"])
    answers = json.loads(s["answers"])
    scores = json.loads(s["scores"])
    feedbacks = json.loads(s["feedbacks"])
    
    last_question = questions[-1]
    evaluation = await ai_service.evaluate_answer(last_question, answer, s["job_title"])
    
    answers.append(answer)
    scores.append(evaluation["score"])
    feedbacks.append(evaluation["feedback"])
    
    next_question = None
    if len(questions) < 5:
        next_question = await ai_service.generate_interview_question(s["job_title"], questions)
        questions.append(next_question)
    else:
        s["status"] = "completed"
        
    conn.execute("UPDATE interviews SET status=?, questions=?, answers=?, scores=?, feedbacks=? WHERE session_id=?",
        (s["status"], json.dumps(questions), json.dumps(answers), json.dumps(scores), json.dumps(feedbacks), session_id))
    conn.commit()
    conn.close()
        
    return {
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "next_question": next_question,
        "is_complete": next_question is None
    }

# --- Payments API ---
class PaymentRequest(BaseModel):
    packageId: str
    originUrl: str
    user_id: Optional[str] = None

@api_router.post("/checkout/session")
async def create_checkout(request: PaymentRequest):
    raise HTTPException(status_code=501, detail="Payments disabled in local offline edition")

@api_router.get("/checkout/status/{session_id}")
async def check_status(session_id: str):
    raise HTTPException(status_code=501, detail="Payments disabled in local offline edition")

@api_router.post("/webhook/stripe")
async def handle_stripe_webhook(request: Request):
    raise HTTPException(status_code=501, detail="Payments disabled in local offline edition")

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)

