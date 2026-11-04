with open(r'CoopSyncAI\backend\test_face_enrollment_retrain.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Add JWT imports and token creation
tokens_setup = """import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auth.jwt_handler import create_access_token
from database import SessionLocal, User

_db = SessionLocal()
try:
    _admin_u = _db.query(User).filter(User.role.in_(["admin", "ncct_admin"])).first()
    _student_u = _db.query(User).filter(User.role == "student").first()
    _admin_token = create_access_token(_admin_u.id if _admin_u else 1, "admin", _admin_u.email if _admin_u else "admin@coopsync.edu")
    _student_token = create_access_token(_student_u.id if _student_u else 2, "student", _student_u.email if _student_u else "student@coopsync.edu")
finally:
    _db.close()

ADMIN_AUTH_HEADER = {"Authorization": f"Bearer {_admin_token}"}
STUDENT_AUTH_HEADER = {"Authorization": f"Bearer {_student_token}"}
"""

if "ADMIN_AUTH_HEADER" not in text:
    text = tokens_setup + "\n" + text

# Update http_post definition to accept headers
old_http_post = """def http_post(endpoint, payload):
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, method="POST")"""

new_http_post = """def http_post(endpoint, payload, extra_headers=None):
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    data = json.dumps(payload).encode('utf-8')
    hdrs = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    if extra_headers:
        hdrs.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")"""

text = text.replace(old_http_post, new_http_post)

# Test 2: Student role blocked
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": b64_sample,\n        "requester_role": "student"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": b64_sample\n    }, extra_headers=STUDENT_AUTH_HEADER)'
)

# Test 3: Empty student ID (with admin header)
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "   ",\n        "student_name": "Ghost User",\n        "image_base64": b64_sample,\n        "requester_role": "admin"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "   ",\n        "student_name": "Ghost User",\n        "image_base64": b64_sample\n    }, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 4: No face
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": b64_sample,\n        "requester_role": "admin"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": b64_sample\n    }, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 5: Dark frame
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": dark_b64,\n        "requester_role": "admin"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": dark_b64\n    }, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 6: Bright frame
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": bright_b64,\n        "requester_role": "admin"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": bright_b64\n    }, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 7: Valid sample capture
text = text.replace(
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": real_face_b64,\n        "requester_role": "admin"\n    })',
    'res = http_post("students/capture-sample", {\n        "student_id": "5025088",\n        "student_name": "Puneet",\n        "image_base64": real_face_b64\n    }, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 8: Reset samples
text = text.replace(
    'res = http_post(f"students/{student_id}/reset-samples", {})',
    'res = http_post(f"students/{student_id}/reset-samples", {}, extra_headers=ADMIN_AUTH_HEADER)'
)

# Test 9: Unauthorized retrain
text = text.replace(
    'res = http_post("train", {"requester_role": "student"})',
    'res = http_post("train", {}, extra_headers=STUDENT_AUTH_HEADER)'
)

# Test 9: Authorized retrain
text = text.replace(
    'res = http_post("train", {"requester_role": "admin"})',
    'res = http_post("train", {}, extra_headers=ADMIN_AUTH_HEADER)'
)

with open(r'CoopSyncAI\backend\test_face_enrollment_retrain.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated test_face_enrollment_retrain.py with JWT auth tokens!")
