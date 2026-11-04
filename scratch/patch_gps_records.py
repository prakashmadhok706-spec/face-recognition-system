with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('"4868448"', '"112"')
text = text.replace('"577575"', '"111"')
text = text.replace('"Varun"', '"Muskan"')

with open(r'CoopSyncAI\backend\test_gps_attendance.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated offline sync test student records to registered students.')
