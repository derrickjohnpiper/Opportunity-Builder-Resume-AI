import requests
import sys
import json
import time
from datetime import datetime

class AIJobHunterAPITester:
    def __init__(self, base_url="https://career-ai-hub-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.job_id = None
        self.app_id = None
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_get_jobs(self):
        """Test getting jobs list"""
        success, response = self.run_test("Get Jobs", "GET", "jobs", 200)
        return success

    def test_create_job(self):
        """Test creating a new job"""
        job_data = {
            "title": "Senior Full Stack Developer",
            "company": "TechCorp Inc.",
            "description": "We are looking for a Senior Developer experienced in React, Node.js, and Python. You will lead a team of 5 and architect scalable cloud solutions.",
            "posted_date": datetime.now().isoformat()
        }
        success, response = self.run_test("Create Job", "POST", "jobs", 200, job_data)
        if success and 'id' in response:
            self.job_id = response['id']
            print(f"   Created job with ID: {self.job_id}")
        return success

    def test_score_job(self):
        """Test job compatibility scoring"""
        if not self.job_id:
            print("❌ No job ID available for scoring test")
            return False
            
        score_data = {
            "resume_text": "Senior Software Engineer with 5+ years experience in React, Node.js, Python, and cloud architecture. Led teams of 3-8 developers."
        }
        success, response = self.run_test("Score Job", "POST", f"jobs/{self.job_id}/score", 200, score_data)
        return success

    def test_approve_job(self):
        """Test approving a job (should create application)"""
        if not self.job_id:
            print("❌ No job ID available for approval test")
            return False
            
        status_data = {"status": "approved"}
        success, response = self.run_test("Approve Job", "PUT", f"jobs/{self.job_id}/status", 200, status_data)
        return success

    def test_get_applications(self):
        """Test getting applications list"""
        success, response = self.run_test("Get Applications", "GET", "applications", 200)
        if success and response and len(response) > 0:
            self.app_id = response[0]['id']
            print(f"   Found application with ID: {self.app_id}")
        return success

    def test_update_application_status(self):
        """Test updating application status"""
        if not self.app_id:
            print("❌ No application ID available for status update test")
            return False
            
        status_data = {"status": "Interviewing"}
        success, response = self.run_test("Update App Status", "PUT", f"applications/{self.app_id}/status", 200, status_data)
        return success

    def test_optimize_resume(self):
        """Test resume optimization"""
        resume_data = {
            "original_resume": "John Doe\nSoftware Engineer\n5 years experience in web development",
            "target_job_description": "Senior Full Stack Developer position requiring React, Node.js, and Python expertise",
            "hiring_manager_linkedin": "Passionate about technology and team leadership"
        }
        success, response = self.run_test("Optimize Resume", "POST", "resume/optimize", 200, resume_data, timeout=60)
        return success

    def test_generate_cover_letter(self):
        """Test cover letter generation"""
        cover_data = {
            "original_resume": "John Doe\nSoftware Engineer\n5 years experience in web development",
            "target_job_description": "Senior Full Stack Developer position requiring React, Node.js, and Python expertise"
        }
        success, response = self.run_test("Generate Cover Letter", "POST", "resume/cover-letter", 200, cover_data, timeout=60)
        return success

    def test_start_interview(self):
        """Test starting interview session"""
        interview_data = {"job_title": "Software Engineer"}
        success, response = self.run_test("Start Interview", "POST", "interview/start", 200, interview_data, timeout=60)
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            print(f"   Created interview session: {self.session_id}")
        return success

    def test_submit_interview_answer(self):
        """Test submitting interview answer"""
        if not self.session_id:
            print("❌ No session ID available for answer submission test")
            return False
            
        answer_data = {"answer": "I have 5 years of experience in software development, specializing in React and Node.js. I've led several successful projects and enjoy working in collaborative environments."}
        success, response = self.run_test("Submit Interview Answer", "POST", f"interview/{self.session_id}/answer", 200, answer_data, timeout=60)
        return success

def main():
    print("🚀 Starting AI Job Hunter API Tests")
    print("=" * 50)
    
    tester = AIJobHunterAPITester()
    
    # Test sequence
    tests = [
        ("Get Jobs", tester.test_get_jobs),
        ("Create Job", tester.test_create_job),
        ("Score Job", tester.test_score_job),
        ("Approve Job", tester.test_approve_job),
        ("Get Applications", tester.test_get_applications),
        ("Update Application Status", tester.test_update_application_status),
        ("Optimize Resume", tester.test_optimize_resume),
        ("Generate Cover Letter", tester.test_generate_cover_letter),
        ("Start Interview", tester.test_start_interview),
        ("Submit Interview Answer", tester.test_submit_interview_answer),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
        
        # Small delay between tests
        time.sleep(1)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend APIs are working well!")
        return 0
    elif success_rate >= 50:
        print("⚠️  Backend has some issues but core functionality works")
        return 1
    else:
        print("🚨 Backend has major issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())