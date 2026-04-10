import os
import re
import logging
import httpx
import json

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.grok_key = os.environ.get("GROK_API_KEY")
        self.grok_model = os.environ.get("GROK_MODEL", "grok-beta") # Standard Grok model
        self.base_url = "https://api.x.ai/v1/chat/completions"
        
    async def _generate(self, prompt: str, system_prompt: str = "You are a helpful AI assistant.") -> str:
        """Standardized AI generation using the Grok/xAI API directly"""
        if not self.grok_key:
            logger.warning("GROK_API_KEY not found. AI features will be limited.")
            return "AI Error: API Key missing. Please check your .env file."

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.grok_key}"
        }
        
        data = {
            "model": self.grok_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=data)
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Grok API call failed: {e}")
            return f"AI Error: Failed to generate response ({str(e)})"

    async def calculate_compatibility(self, resume: str, job_desc: str) -> int:
        if not resume or len(resume.strip()) < 50:
            return 0
            
        prompt = f"Resume:\n{resume}\n\nJob Description:\n{job_desc}\n\nScore the compatibility of this resume against the job description from 0 to 100. Return ONLY the integer score. Be highly critical. Punish missing required skills heavily. Do not just return 100% out of politeness. A standard score should be between 30 and 85."
        response = await self._generate(prompt, "You are a ruthlessly strict ATS scoring expert. Return only an integer.")
        try:
            match = re.search(r'\d+', response)
            if match:
                return min(100, max(0, int(match.group())))
            return 50
        except:
            return 50

    async def analyze_linkedin_personality(self, linkedin_url: str) -> str:
        prompt = f"Extract a professional communication style and personality profile from this LinkedIn data: {linkedin_url}. Determine the best tone to use when writing to them (e.g., Warm and Direct, Formal, Analytical)."
        system = "You are an expert HR Profiler and Communication Strategist."
        return await self._generate(prompt, system)

    async def optimize_resume(self, resume: str, job_desc: str, linkedin_profile: str = None) -> str:
        system = "You are an expert AI Resume Specialist."
        prompt = f"Original Resume:\n{resume}\n\nJob Description:\n{job_desc}\n"
        if linkedin_profile:
            prompt += f"\nHiring Manager Personality Insights (based on LinkedIn):\n{linkedin_profile}\nAdapt the tone to match this personality.\n"
        
        prompt += "\nRewrite and optimize this resume to perfectly align with the wording of the job post to pass the ATS system. Emphasize relevant skills."
        return await self._generate(prompt, system)

    async def generate_cover_letter(self, resume: str, job_desc: str, linkedin_profile: str = None) -> str:
        system = "You are an expert Career Coach and Writer."
        prompt = f"Resume:\n{resume}\n\nJob Description:\n{job_desc}\n"
        if linkedin_profile:
            prompt += f"\nHiring Manager Personality Insights:\n{linkedin_profile}\n"
        prompt += "\nWrite a cover letter matching this job description. The tone should be warm, caring, yet direct. Keep it professional and concise."
        return await self._generate(prompt, system)

    async def generate_interview_question(self, job_title: str, previous_questions: list) -> str:
        system = "You are a professional hiring manager conducting a mock video interview."
        prompt = f"Role: {job_title}\nPrevious questions asked: {previous_questions}\n\nAsk the next relevant, challenging interview question. Do not repeat previous questions. Ask ONLY the question."
        return await self._generate(prompt, system)

    async def evaluate_answer(self, question: str, answer: str, job_title: str) -> dict:
        system = "You are an extreme, brutally honest, no-nonsense senior hiring manager. Do not give out fake praise. Do not act like a polite AI."
        prompt = f"Role: {job_title}\nQuestion: {question}\nCandidate Answer: {answer}\n\nEvaluate the user's answer from 1 to 10. If the answer is short, empty, a mumble, or they indicate they ended the call accidentally, score them between 1 and 3, tell them they failed, and explain exactly why they would never be hired with that response. Do NOT hand out participation trophies. Format exactly as:\nSCORE: [number]\nFEEDBACK: [direct, truthful text]"
        
        response = await self._generate(prompt, system)
        
        score = 5
        feedback = response
        
        for line in response.split('\n'):
            if line.upper().startswith('SCORE:'):
                try:
                    score = int(re.search(r'\d+', line).group())
                except:
                    pass
            elif line.upper().startswith('FEEDBACK:'):
                feedback = line.replace('FEEDBACK:', '').replace('Feedback:', '').strip()
                
        return {"score": score, "feedback": feedback}

# Singleton instance
ai_service = AIService()
