with open(r'CoopSyncAI\backend\test_student_risk_system.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('r5 = self.client.put(f"/api/risk/interventions/{inv_id}", json=', 'r5 = self.client.put(f"/api/risk/interventions/{inv_id}", headers=self.headers, json=')
text = text.replace('r7 = self.client.post("/api/risk/feedback", json=', 'r7 = self.client.post("/api/risk/feedback", headers=self.headers, json=')

with open(r'CoopSyncAI\backend\test_student_risk_system.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated r5 and r7!')
