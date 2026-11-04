import re

with open(r'CoopSyncAI\backend\main.py', 'r', encoding='utf-8') as f:
    text = f.read()

print('has /api/risk/students require_role:', 'get_risk_students' in text and 'require_role' in text)
print('has /api/risk/student/{student_id} verify_ownership:', 'verify_ownership_or_roles' in text)

match = re.search(r'@app\.get\(\"/api/risk/students\"\)[\s\S]*?def get_risk_students\([^)]*\):', text)
if match:
    print('\n--- Actual get_risk_students ---')
    print(match.group(0))

match2 = re.search(r'@app\.get\(\"/api/risk/student/\{student_id\}\"\)[\s\S]*?def get_student_risk_profile\([^)]*\):', text)
if match2:
    print('\n--- Actual get_student_risk_profile ---')
    print(match2.group(0))

match3 = re.search(r'@app\.post\(\"/api/attendance/sync-offline\"\)[\s\S]*?def sync_offline_records\([^)]*\):', text)
if match3:
    print('\n--- Actual sync_offline_records ---')
    print(match3.group(0))

