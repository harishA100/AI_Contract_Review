import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== Starting AI Contract Review Assistant API Tests ===")
    
    # 1. Test Health Check
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        print("[OK] Health Check Passed:", response.json())
    except Exception as e:
        print("[FAIL] Health Check Failed:", e)
        sys.exit(1)
        
    # 2. Test User Registration
    test_user = {
        "email": "testuser@contractreview.com",
        "password": "password123",
        "full_name": "Test User"
    }
    
    try:
        # First, try to register
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        if response.status_code == 400 and "already registered" in response.json().get("detail", "").lower():
            print("[INFO] User already registered (expected behavior for rerun). Proceeding to login.")
        else:
            assert response.status_code == 201
            print("[OK] User Registration Passed:", response.json())
    except Exception as e:
        print("[FAIL] User Registration Failed:", e)
        sys.exit(1)
        
    # 3. Test User Login
    login_data = {
        "email": "testuser@contractreview.com",
        "password": "password123"
    }
    
    token = None
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 200
        result = response.json()
        assert "access_token" in result
        token = result["access_token"]
        print("[OK] User Login Passed. Token retrieved successfully.")
    except Exception as e:
        print("[FAIL] User Login Failed:", e)
        sys.exit(1)
        
    # 4. Test Get Profile (Protected Route)
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        assert response.status_code == 200
        profile = response.json()
        assert profile["email"] == "testuser@contractreview.com"
        print("[OK] Profile Fetch Passed:", profile)
    except Exception as e:
        print("[FAIL] Profile Fetch Failed:", e)
        sys.exit(1)
        
    print("\n=== All API Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_tests()
