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
from supabase import create_client, Client
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()
api_router = APIRouter(prefix="/api")

from services.ai_service import AIService
ai_service = AIService()

# Stripe Integration
stripe_checkout = StripeCheckout(
    api_key=os.environ.get("STRIPE_API_KEY", "sk_test_emergent"),
    webhook_url=os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001") + "/api/webhook/stripe"
)

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

# --- Endpoints ---

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(user_id: str = None):
    # Only returning user's jobs if user_id is provided, else all for testing
    query = supabase.table('jobs').select('*')
    if user_id:
        query = query.eq('user_id', user_id)
    response = query.execute()
    return response.data

@api_router.post("/jobs", response_model=Job)
async def create_job(job: Job):
    doc = job.model_dump()
    response = supabase.table('jobs').insert(doc).execute()
    return response.data[0]

@api_router.post("/jobs/{job_id}/score")
async def score_job(job_id: str, request: dict):
    job_doc = supabase.table('jobs').select('*').eq('id', job_id).execute()
    if not job_doc.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    score = await ai_service.calculate_compatibility(request.get("resume_text", ""), job_doc.data[0]["description"])
    
    supabase.table('jobs').update({"compatibility_score": score}).eq('id', job_id).execute()
    return {"score": score}

@api_router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, request: dict):
    new_status = request.get("status")
    supabase.table('jobs').update({"status": new_status}).eq('id', job_id).execute()
    
    if new_status == "approved":
        job_doc = supabase.table('jobs').select('*').eq('id', job_id).execute().data[0]
        app_doc = Application(job_id=job_id, company=job_doc["company"], title=job_doc["title"], user_id=job_doc.get("user_id"))
        supabase.table('applications').insert(app_doc.model_dump()).execute()
        
    return {"status": "success"}

@api_router.get("/applications", response_model=List[Application])
async def get_applications(user_id: str = None):
    query = supabase.table('applications').select('*')
    if user_id:
        query = query.eq('user_id', user_id)
    response = query.execute()
    return response.data

@api_router.put("/applications/{app_id}/status")
async def update_app_status(app_id: str, request: dict):
    new_status = request.get("status")
    supabase.table('applications').update({"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}).eq('id', app_id).execute()
    return {"status": "success"}

@api_router.post("/resume/optimize")
async def optimize_resume(data: ResumeData):
    optimized_resume = await ai_service.optimize_resume(data.original_resume, data.target_job_description, data.hiring_manager_linkedin)
    return {"optimized_resume": optimized_resume}

@api_router.post("/resume/cover-letter")
async def generate_cover_letter(data: ResumeData):
    cover_letter = await ai_service.generate_cover_letter(data.original_resume, data.target_job_description, data.hiring_manager_linkedin)
    return {"cover_letter": cover_letter}

@api_router.post("/interview/start")
async def start_interview(request: dict):
    job_title = request.get("job_title", "General")
    user_id = request.get("user_id")
    session = InterviewSession(job_title=job_title, user_id=user_id)
    
    first_question = await ai_service.generate_interview_question(job_title, [])
    session.questions.append(first_question)
    
    supabase.table('interviews').insert(session.model_dump()).execute()
    return {"session_id": session.session_id, "first_question": first_question}

@api_router.post("/interview/{session_id}/answer")
async def evaluate_answer(session_id: str, request: dict):
    answer = request.get("answer")
    session_doc = supabase.table('interviews').select('*').eq('session_id', session_id).execute()
    if not session_doc.data:
        raise HTTPException(status_code=404)
        
    s = session_doc.data[0]
    last_question = s["questions"][-1]
    evaluation = await ai_service.evaluate_answer(last_question, answer, s["job_title"])
    
    s["answers"].append(answer)
    s["scores"].append(evaluation["score"])
    s["feedbacks"].append(evaluation["feedback"])
    
    next_question = None
    if len(s["questions"]) < 5:
        next_question = await ai_service.generate_interview_question(s["job_title"], s["questions"])
        s["questions"].append(next_question)
    else:
        s["status"] = "completed"
        
    supabase.table('interviews').update(s).eq('session_id', session_id).execute()
        
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
    if request.packageId not in PACKAGES:
        raise HTTPException(400, "Invalid package")
        
    amount = PACKAGES[request.packageId]
    success_url = f"{request.originUrl}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.originUrl}/dashboard"
    
    checkoutrequest = CheckoutSessionRequest(
        amount=amount, 
        currency="usd", 
        success_url=success_url, 
        cancel_url=cancel_url, 
        metadata={"user_id": request.user_id or "anonymous", "package": request.packageId}
    )
    
    session = await stripe_checkout.create_checkout_session(checkoutrequest)
    
    # Store pending transaction in Supabase
    tx_data = {
        "user_id": request.user_id,
        "session_id": session.session_id,
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "metadata": {"package": request.packageId}
    }
    supabase.table('payment_transactions').insert(tx_data).execute()
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def check_status(session_id: str):
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Update the transaction in database
    supabase.table('payment_transactions').update({
        "payment_status": status_response.payment_status
    }).eq("session_id", session_id).execute()
    
    return status_response

@api_router.post("/webhook/stripe")
async def handle_stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    # This automatically verifies the signature and parses the event using emergentintegrations
    event = await stripe_checkout.handle_webhook(body, signature)
    
    if event.event_type == 'checkout.session.completed':
        # Update db status asynchronously
        supabase.table('payment_transactions').update({
            "payment_status": "paid"
        }).eq("session_id", event.session_id).execute()
        
    return {"status": "success"}

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

