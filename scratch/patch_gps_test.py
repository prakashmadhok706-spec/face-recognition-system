with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Add JWT imports and token creation
tokens_setup = """from auth.jwt_handler import create_access_token
from database import SessionLocal, User

_db = SessionLocal()
try:
    _admin_u = _db.query(User).filter(User.role.in_(["admin", "ncct_admin"])).first()
    _student_u = _db.query(User).filter(User.role == "student").first()
    _admin_token = create_access_token(_admin_u.id if _admin_u else 1, "admin", _admin_u.email if _admin_u else "admin@coopsync.edu")
    _student_token = create_access_token(_student_u.id if _student_u else 2, "student", _student_u.email if _student_u else "student@coopsync.edu")
finally:
    _db.close()

ADMIN_HEADERS = {"Authorization": f"Bearer {_admin_token}"}
STUDENT_HEADERS = {"Authorization": f"Bearer {_student_token}"}
"""

if "ADMIN_HEADERS" not in text:
    text = text.replace("class ApiWrapper:", tokens_setup + "\nclass ApiWrapper:")

text = text.replace(
    'res_unauth = api.put("/api/institution/config", json=unauth_payload)',
    'res_unauth = api.put("/api/institution/config", json=unauth_payload, headers=STUDENT_HEADERS)'
)

text = text.replace(
    'res_auth = api.put("/api/institution/config", json=auth_payload)',
    'res_auth = api.put("/api/institution/config", json=auth_payload, headers=ADMIN_HEADERS)'
)

text = text.replace(
    'api.post("/api/attendance/clear")',
    'api.post("/api/attendance/clear", headers=ADMIN_HEADERS)'
)

text = text.replace(
    'res = api.get("/api/attendance/logs")',
    'res = api.get("/api/attendance/logs", headers=ADMIN_HEADERS)'
)

with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched test_gps_attendance.py with JWT auth tokens!")
