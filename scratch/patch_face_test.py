with open(r"CoopSyncAI\backend\test_face_enrollment_retrain.py", "r", encoding="utf-8") as f:
    text = f.read()

s_target = 'BASE_URL = "http://127.0.0.1:8000/api"'
e_target = 'def create_blank_image(width=640, height=480, color=(0, 0, 0)):'
s_idx = text.find(s_target)
e_idx = text.find(e_target)
assert s_idx != -1 and e_idx != -1

replacement = '''from fastapi.testclient import TestClient
from main import app

_test_client = TestClient(app)

def http_get(endpoint):
    resp = _test_client.get(f"/api/{endpoint.lstrip('/')}")
    return resp.json()

def http_post(endpoint, payload, extra_headers=ADMIN_AUTH_HEADER):
    resp = _test_client.post(f"/api/{endpoint.lstrip('/')}", json=payload, headers=extra_headers)
    try:
        return resp.json()
    except Exception:
        return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text}"}

'''

text = text[:s_idx] + replacement + text[e_idx:]
with open(r"CoopSyncAI\backend\test_face_enrollment_retrain.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated test_face_enrollment_retrain.py to use TestClient")
