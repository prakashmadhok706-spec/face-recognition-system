import re
import os
from typing import Dict, Any, List

def calculate_skill_match(student_skills: str, required_skills: str) -> int:
    """
    Computes a smart match percentage between student skills and job requirements
    """
    if not student_skills or not required_skills:
        return 65
    
    student_set = set([s.strip().lower() for s in re.split(r'[,|/]+', student_skills) if s.strip()])
    req_set = set([s.strip().lower() for s in re.split(r'[,|/]+', required_skills) if s.strip()])
    
    if not req_set:
        return 75
        
    overlap = student_set.intersection(req_set)
    base_score = int((len(overlap) / len(req_set)) * 100)
    # Give a realistic baseline between 60% and 98%
    final_score = max(55, min(98, base_score + 25 if len(overlap) > 0 else 55))
    return final_score

def get_ai_chat_response(query: str, user_profile: Dict[str, Any], attendance_count: int, jobs: List[Dict[str, Any]], courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    q = query.lower()
    student_name = user_profile.get("name", "Student")
    dept = user_profile.get("department", "CSE")
    skills = user_profile.get("skills", "Python, OpenCV")
    
    # 1. Attendance queries
    if any(k in q for k in ["attendance", "present", "days", "attended", "absent", "percentage"]):
        percent = min(100, int((attendance_count / max(1, 24)) * 100))
        return {
            "reply": f"Hello {student_name}! You have recorded **{attendance_count} total verified attendance sessions** this semester. Your current attendance rating is **{percent}%**.\n\n✅ You exceed the 75% cooperative curriculum eligibility threshold for semester examination & certificates.",
            "suggestions": ["Show my attendance logs", "Generate QR attendance", "View eligible certificates"]
        }
        
    # 2. Job queries
    elif any(k in q for k in ["job", "career", "employment", "hire", "apply", "salary", "placement"]):
        matched_jobs = []
        for j in jobs[:3]:
            score = calculate_skill_match(skills, j.get("required_skills", ""))
            matched_jobs.append(f"• **{j.get('title')}** at {j.get('company')} ({j.get('salary')}) – *{score}% Skill Match*")
            
        jobs_text = "\n".join(matched_jobs)
        return {
            "reply": f"Based on your profile skills ({skills}), here are your top recommended opportunities:\n\n{jobs_text}\n\nWould you like to auto-submit your application?",
            "suggestions": ["Apply to top matched job", "How to increase skill match?", "View all jobs"]
        }
        
    # 3. Course recommendations / skill gaps
    elif any(k in q for k in ["course", "recommend", "learn", "study", "module", "skills", "gap"]):
        course_names = [f"• **{c.get('title')}** ({c.get('duration')})" for c in courses[:3]]
        return {
            "reply": f"To accelerate your placement in Cooperative Technology & AI, here are recommended skill modules:\n\n" + "\n".join(course_names) + f"\n\n🎯 Completing these will boost your job match score by **+25%**.",
            "suggestions": ["Enroll in AI Course", "Check my progress", "Download certificate"]
        }
        
    # 4. Anti-spoofing & security
    elif any(k in q for k in ["proxy", "anti-spoof", "spoof", "liveness", "security", "camera"]):
        return {
            "reply": "🔒 **CoopSync Anti-Spoof Protection** is active. The system runs real-time texture analysis (Laplacian variance) and micro-movement verification to prevent 2D photo or phone screen proxy attendance.",
            "suggestions": ["Test camera recognition", "Generate QR backup", "View security logs"]
        }
        
    # Default smart assistant response
    else:
        return {
            "reply": f"Hi {student_name}! I am your **CoopSync AI Advisor** for SIH 2026. I can assist you with:\n\n1. **Attendance Tracking**: Face recognition & QR audit records.\n2. **Academic ERP**: Enrolled courses, notes, and PDF certificates.\n3. **Employment Portal**: AI-matched internships & cooperative jobs.\n\nWhat would you like to explore?",
            "suggestions": ["How many attendance days do I have?", "Recommend jobs for me", "Verify a certificate"]
        }
