import os
import re
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.emergent_key = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-4D336BeF76179Fc8cB")
        self.session_id = "ai-job-hunter-session"
        
    async def _generate(self, prompt: str, system_prompt: str = "You are a helpful AI assistant.") -> str:
        """Generate text using Emergent's universal key and LLM Chat integration"""
        try:
            chat = LlmChat(
                api_key=self.emergent_key,
                session_id=self.session_id,
                system_message=system_prompt
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            return response
        except Exception as e:
            logger.error(f"AI Generation failed: {e}")
            return f"Error generating response: {str(e)}"

    async def calculate_compatibility(self, resume: str, job_desc: str) -> int:
        prompt = f"Resume:\n{resume}\n\nJob Description:\n{job_desc}\n\nScore the compatibility of this resume against the job description from 0 to 100. Return ONLY the integer score."
        response = await self._generate(prompt, "You are an ATS scoring expert. Return only an integer.")
        try:
            # Extract just the number
            match = re.search(r'\d+', response)
            if match:
                return min(100, max(0, int(match.group())))
            return 50
        except:
            return 50

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
            
        prompt += "\nWrite a cover letter matching this job description. The tone should be warm, caring, yet direct (your standard tone, but adaptable to the hiring manager if insights provided). Keep it professional and concise."
        
        return await self._generate(prompt, system)

    async def generate_interview_question(self, job_title: str, previous_questions: list) -> str:
        system = "You are a professional hiring manager conducting a mock video interview."
        prompt = f"Role: {job_title}\nPrevious questions asked: {previous_questions}\n\nAsk the next relevant, challenging interview question. Do not repeat previous questions. Ask ONLY the question."
        return await self._generate(prompt, system)

    async def evaluate_answer(self, question: str, answer: str, job_title: str) -> dict:
        system = "You are an expert interview coach giving realistic, constructive feedback."
        prompt = f"Role: {job_title}\nQuestion: {question}\nCandidate Answer: {answer}\n\nEvaluate the answer from 1 to 10. Give a score and brief, direct feedback on how to improve.\nFormat exactly as:\nSCORE: [number]\nFEEDBACK: [text]"
        
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
