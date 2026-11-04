with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
sys.path.insert(0, r'CoopSyncAI\backend')
from database import SessionLocal, User
db = SessionLocal()
u = db.query(User).filter(User.role == "student").first()
sid = u.student_id
sname = u.name
db.close()

print(f"Target registered student: {sname} (ID: {sid})")
text = text.replace('"5025088"', f'"{sid}"')
text = text.replace('"Puneet"', f'"{sname}"')

with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced all hardcoded ghost student IDs in test_gps_attendance.py!")
