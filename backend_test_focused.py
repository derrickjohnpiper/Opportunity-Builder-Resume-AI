import requests
import sys
import json
import time
from datetime import datetime

class FocusedAPITester:
    def __init__(self, base_url="https://career-ai-hub-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = "test-user-12345"

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

    def test_get_profile(self):
        """Test getting user profile (for Profile settings page)"""
        success, response = self.run_test("Get Profile", "GET", f"profile?user_id={self.test_user_id}", 200)
        return success

    def test_update_profile(self):
        """Test updating user profile (for Profile settings and Onboarding)"""
        profile_data = {
            "user_id": self.test_user_id,
            "full_name": "Test User",
            "base_resume": "Test resume content for testing purposes",
            "linkedin_url": "https://linkedin.com/in/testuser",
            "weekly_goal": 15
        }
        success, response = self.run_test("Update Profile", "PUT", "profile", 200, profile_data)
        return success

    def test_get_jobs_for_dashboard(self):
        """Test getting jobs for dashboard charts"""
        success, response = self.run_test("Get Jobs for Dashboard", "GET", f"jobs?user_id={self.test_user_id}", 200)
        return success

    def test_get_applications_for_dashboard(self):
        """Test getting applications for dashboard charts"""
        success, response = self.run_test("Get Applications for Dashboard", "GET", f"applications?user_id={self.test_user_id}", 200)
        return success

    def test_get_applications_for_kanban(self):
        """Test getting applications for Kanban board"""
        success, response = self.run_test("Get Applications for Kanban", "GET", f"applications?user_id={self.test_user_id}", 200)
        return success

    def test_resume_optimization_for_download(self):
        """Test resume optimization (for download feature)"""
        resume_data = {
            "original_resume": "John Doe\nSoftware Engineer\n5 years experience in web development",
            "target_job_description": "Senior Full Stack Developer position requiring React, Node.js, and Python expertise"
        }
        success, response = self.run_test("Resume Optimization", "POST", "resume/optimize", 200, resume_data, timeout=60)
        if success and response:
            # Check if we got a response (even if it's an error due to budget)
            if 'optimized_resume' in response:
                print(f"   Resume optimization response received (length: {len(response['optimized_resume'])})")
        return success

def main():
    print("🚀 Starting Focused API Tests for New Features")
    print("=" * 60)
    
    tester = FocusedAPITester()
    
    # Test sequence focusing on new features
    tests = [
        ("Profile GET (Profile Settings)", tester.test_get_profile),
        ("Profile UPDATE (Onboarding/Profile)", tester.test_update_profile),
        ("Jobs for Dashboard Charts", tester.test_get_jobs_for_dashboard),
        ("Applications for Dashboard Charts", tester.test_get_applications_for_dashboard),
        ("Applications for Kanban Board", tester.test_get_applications_for_kanban),
        ("Resume Optimization (Download Feature)", tester.test_resume_optimization_for_download),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
        
        # Small delay between tests
        time.sleep(1)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Core APIs for new features are working well!")
        return 0
    elif success_rate >= 50:
        print("⚠️  Some APIs have issues but core functionality works")
        return 1
    else:
        print("🚨 Core APIs have major issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())