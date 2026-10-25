import re
import os
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, List, Optional

# Load local .env file if present
def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("'\"")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception:
            pass

load_env_file()

# In-memory runtime AI configuration
RUNTIME_AI_CONFIG = {
    "provider": os.environ.get("AI_PROVIDER", "gemini"),
    "gemini_api_key": os.environ.get("GEMINI_API_KEY", ""),
    "groq_api_key": os.environ.get("GROQ_API_KEY", ""),
    "openrouter_api_key": os.environ.get("OPENROUTER_API_KEY", ""),
    "gemini_model": os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
    "groq_model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
}

def get_ai_config() -> Dict[str, Any]:
    load_env_file()
    has_key = bool(
        RUNTIME_AI_CONFIG.get("gemini_api_key") or
        os.environ.get("GEMINI_API_KEY") or
        RUNTIME_AI_CONFIG.get("groq_api_key") or
        os.environ.get("GROQ_API_KEY") or
        RUNTIME_AI_CONFIG.get("openrouter_api_key") or
        os.environ.get("OPENROUTER_API_KEY")
    )
    return {
        "success": True,
        "provider": RUNTIME_AI_CONFIG.get("provider", "gemini"),
        "gemini_model": RUNTIME_AI_CONFIG.get("gemini_model", "gemini-1.5-flash"),
        "groq_model": RUNTIME_AI_CONFIG.get("groq_model", "llama-3.3-70b-versatile"),
        "has_custom_key": has_key,
        "active_provider_name": "Google Gemini 1.5 Flash" if RUNTIME_AI_CONFIG.get("provider") == "gemini" else (
            "Groq Cloud Llama-3.3" if RUNTIME_AI_CONFIG.get("provider") == "groq" else (
                "OpenRouter Free AI" if RUNTIME_AI_CONFIG.get("provider") == "openrouter" else "CoopSync Local Semantic RAG"
            )
        )
    }

def update_ai_config(provider: Optional[str] = None, api_key: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
    if provider:
        RUNTIME_AI_CONFIG["provider"] = provider.lower()
    
    if api_key:
        api_key = api_key.strip()
        curr_p = RUNTIME_AI_CONFIG.get("provider", "gemini")
        if curr_p == "gemini" or api_key.startswith("AIzaSy"):
            RUNTIME_AI_CONFIG["gemini_api_key"] = api_key
            os.environ["GEMINI_API_KEY"] = api_key
            RUNTIME_AI_CONFIG["provider"] = "gemini"
        elif curr_p == "groq" or api_key.startswith("gsk_"):
            RUNTIME_AI_CONFIG["groq_api_key"] = api_key
            os.environ["GROQ_API_KEY"] = api_key
            RUNTIME_AI_CONFIG["provider"] = "groq"
        elif curr_p == "openrouter" or api_key.startswith("sk-or-"):
            RUNTIME_AI_CONFIG["openrouter_api_key"] = api_key
            os.environ["OPENROUTER_API_KEY"] = api_key
            RUNTIME_AI_CONFIG["provider"] = "openrouter"
            
        # Persist to .env file
        try:
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            env_lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    env_lines = f.readlines()
            
            key_name = f"{RUNTIME_AI_CONFIG['provider'].upper()}_API_KEY"
            found = False
            for i, line in enumerate(env_lines):
                if line.startswith(f"{key_name}="):
                    env_lines[i] = f"{key_name}={api_key}\n"
                    found = True
                    break
            if not found:
                env_lines.append(f"{key_name}={api_key}\n")
                
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(env_lines)
        except Exception as e:
            print(f"[AI Config] Could not save to .env: {e}")

    if model:
        if RUNTIME_AI_CONFIG.get("provider") == "gemini":
            RUNTIME_AI_CONFIG["gemini_model"] = model
        else:
            RUNTIME_AI_CONFIG["groq_model"] = model

    return get_ai_config()

def calculate_skill_match(student_skills: str, required_skills: str) -> int:
    """Computes a smart match percentage between student skills and job requirements"""
    if not student_skills or not required_skills:
        return 65
    
    student_set = set([s.strip().lower() for s in re.split(r'[,|/]+', student_skills) if s.strip()])
    req_set = set([s.strip().lower() for s in re.split(r'[,|/]+', required_skills) if s.strip()])
    
    if not req_set:
        return 75
        
    overlap = student_set.intersection(req_set)
    base_score = int((len(overlap) / len(req_set)) * 100)
    final_score = max(55, min(98, base_score + 25 if len(overlap) > 0 else 55))
    return final_score

def call_gemini_api(prompt: str, system_context: str, api_key: str, model_name: str = "gemini-1.5-flash") -> Optional[str]:
    """Calls Google Gemini API (Free Tier from Google AI Studio) with automatic model fallback"""
    candidate_models = [model_name, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    tried = set()
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_context}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000
        }
    }
    
    for m in candidate_models:
        if m in tried:
            continue
        tried.add(m)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                data = json.loads(response.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except urllib.error.HTTPError as he:
            err_msg = ""
            try:
                err_msg = he.read().decode("utf-8")
            except Exception:
                pass
            print(f"[Gemini API HTTP {he.code} for {m}]: {err_msg[:160]}")
            if he.code in (400, 404):
                continue
            return None
        except Exception as e:
            print(f"[Gemini API Error for {m}]: {e}")
            continue
    return None

def call_groq_api(prompt: str, system_context: str, api_key: str, model_name: str = "llama-3.3-70b-versatile") -> Optional[str]:
    """Calls Groq Cloud API (Free Tier with fast Llama-3.3 / Llama-3.1)"""
    candidate_models = [model_name, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    tried = set()
    
    for m in candidate_models:
        if m in tried:
            continue
        tried.add(m)
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": m,
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                data = json.loads(response.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
        except Exception as e:
            print(f"[Groq API Error for {m}]: {e}")
            continue
    return None

def call_openrouter_api(prompt: str, system_context: str, api_key: str) -> Optional[str]:
    """Calls OpenRouter API with free models"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "meta-llama/llama-3.2-3b-instruct:free",
        "messages": [
            {"role": "system", "content": system_context},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        print(f"[OpenRouter API Error] {e}")
        return None

def fetch_educational_summary(query: str) -> Optional[Dict[str, Any]]:
    """Fetches high-quality educational summary from Wikipedia for general science/engineering/CS questions"""
    clean = re.sub(r'^(what is|what are|define|explain|who is|how does|tell me about|describe|what does)\s+', '', query.strip(), flags=re.IGNORECASE)
    clean = clean.rstrip('?!. ').strip()
    if not clean or len(clean) < 2:
        return None
        
    topic_slug = urllib.parse.quote(clean.replace(' ', '_'))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic_slug}"
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CoopSyncAI/1.0 (Student-Educational-Advisor; contact=admin@coopsync.local)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            title = data.get("title")
            extract = data.get("extract")
            if extract and len(extract) > 40 and data.get("type") != "disambiguation":
                return {
                    "title": title,
                    "extract": extract,
                    "description": data.get("description", "")
                }
    except Exception:
        pass
    return None

BUILTIN_KNOWLEDGE_BANK = {
    "photosynthesis": (
        "🌱 **Photosynthesis** is the biological process by which green plants, algae, and certain bacteria convert light energy (typically from the sun) into chemical energy stored in glucose and other carbohydrate molecules.\n\n"
        "• **Chemical Equation:** $6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Light} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$\n"
        "• **Organelle:** Occurs primarily within the **chloroplasts** using the green pigment **chlorophyll**.\n"
        "• **Stages:** Light-dependent reactions (thylakoids, producing ATP & NADPH) and light-independent Calvin cycle (stroma, fixing $\\text{CO}_2$ into sugar).\n"
        "• **Importance:** Produces virtually all oxygen in Earth's atmosphere and forms the primary energy base of the global food chain, directly supporting agriculture and rural cooperatives."
    ),
    "python": (
        "🐍 **Python** is a high-level, interpreted programming language known for its readability and concise syntax. In CoopSync AI, Python powers our FastAPI backend microservices, OpenCV computer vision pipeline, ReportLab PDF certificate engine, and SQLite database models."
    ),
    "opencv": (
        "👁️ **OpenCV (Open Source Computer Vision Library)** is an open-source computer vision and machine learning software library. CoopSync AI uses OpenCV's Haar Feature-based Cascades for face detection and Local Binary Patterns Histograms (LBPH) for facial identity recognition."
    ),
    "cooperative": (
        "🤝 A **Cooperative** is an autonomous association of persons united voluntarily to meet their common economic, social, and cultural needs through a jointly owned and democratically controlled enterprise (e.g., AMUL, IFFCO, KRIBHCO, PACS)."
    ),
    "haversine": (
        "📍 The **Haversine Formula** determines the great-circle distance between two points on a sphere given their longitudes and latitudes. CoopSync AI calculates this geodesic distance in `qr_engine.py` to enforce our zero-trust 50-meter campus attendance geofence."
    ),
    "machine learning": (
        "🤖 **Machine Learning (ML)** is a branch of artificial intelligence where algorithms improve their performance on tasks through experience. CoopSync uses ML for biometric face recognition (LBPH) and algorithmic skill-to-job recommendation matching."
    )
}

def generate_smart_suggestions(query: str, reply: str) -> List[str]:
    """Generates 3 contextual action chips based on the user's question and response"""
    q = (query + " " + reply).lower()
    if "attendance" in q or "percentage" in q or "eligib" in q:
        return ["Show my attendance logs", "Generate QR attendance", "View exam eligibility rules"]
    elif "job" in q or "career" in q or "placement" in q or "amul" in q or "iffco" in q:
        return ["Apply to top matched job", "How to improve skill match?", "View all cooperative jobs"]
    elif "course" in q or "learn" in q or "study" in q or "certif" in q:
        return ["Enroll in AI Vision Course", "Study YouTube lectures", "Download verified certificate"]
    elif "gps" in q or "geofence" in q or "radius" in q:
        return ["Check campus coordinates", "View QR check-in status", "Test device GPS accuracy"]
    elif "face" in q or "biometric" in q or "spoof" in q:
        return ["Launch OpenCV camera", "Test webcam liveness", "Enroll new face dataset"]
    elif "photosynthesis" in q or "science" in q or "biology" in q or "plant" in q:
        return ["How does photosynthesis relate to Agri-IoT?", "Recommend Agriculture Courses", "How to connect Gemini AI?"]
    else:
        return ["How many attendance days do I have?", "Recommend jobs for my profile", "Connect Free Gemini AI Key"]

def get_local_semantic_response(query: str, user_profile: Dict[str, Any], attendance_count: int, jobs: List[Dict[str, Any]], courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """High-quality local semantic RAG response when offline or before cloud key is configured"""
    q = query.lower()
    student_name = user_profile.get("name", "Student")
    dept = user_profile.get("department", "CSE")
    skills = user_profile.get("skills", "Python, OpenCV, Machine Learning")
    percent = min(100, int((attendance_count / max(1, 26)) * 100))
    is_eligible = percent >= 75
    
    # 1. Attendance & Examination Eligibility queries
    if any(k in q for k in ["attendance", "present", "days", "attended", "absent", "percentage", "exam", "eligib"]):
        status_text = "✅ **Eligible for Exams:** Your attendance exceeds the statutory 75% NCCT requirement." if is_eligible else "⚠️ **Short Attendance Warning:** Your attendance is below 75%. Please attend upcoming lab and lecture sessions."
        return {
            "reply": f"Hello **{student_name}**!\n\nHere is your official academic attendance summary:\n\n• **Verified Sessions Attended:** {attendance_count} / 26 sessions\n• **Overall Attendance Rate:** **{percent}%**\n• **Examination Eligibility:** {status_text}\n\nAll attendance records are cryptographically verified using **Real Device GPS Geofencing (50m campus perimeter)** and **Anti-Spoofing Biometrics**.",
            "suggestions": ["Show my attendance logs", "Open QR Check-In", "View course timetable"],
            "model_used": "CoopSync Local Semantic RAG"
        }
        
    # 2. Job & Placement queries
    elif any(k in q for k in ["job", "career", "employment", "hire", "apply", "salary", "placement", "intern", "amul", "iffco"]):
        matched_jobs = []
        for j in jobs[:4]:
            score = calculate_skill_match(skills, j.get("required_skills", ""))
            matched_jobs.append(f"• **{j.get('title')}** at **{j.get('company')}**\n  *Salary:* {j.get('salary')} | *AI Skill Match:* **{score}%**\n  *Required Competencies:* `{j.get('required_skills')}`")
            
        jobs_text = "\n\n".join(matched_jobs) if matched_jobs else "No cooperative openings currently matching your profile."
        return {
            "reply": f"Based on your capacity building skills (`{skills}`), here are top cooperative federations hiring right now:\n\n{jobs_text}\n\n💡 *Tip: Enrolling in our AI Vision & Agri-IoT courses can boost your match score to 98%!*",
            "suggestions": ["Apply to top matched job", "How to increase skill match?", "View all cooperative jobs"],
            "model_used": "CoopSync Local Semantic RAG"
        }
        
    # 3. Course recommendations & learning
    elif any(k in q for k in ["course", "recommend", "learn", "study", "module", "skills", "gap", "youtube", "lecture"]):
        course_list = []
        for c in courses[:4]:
            course_list.append(f"• **{c.get('title')}** ({c.get('duration')})\n  *Category:* {c.get('category')} | Modules: {c.get('modules_count', 12)}")
        courses_text = "\n\n".join(course_list)
        return {
            "reply": f"Here are the recommended curriculum courses tailored for **{dept}**:\n\n{courses_text}\n\n🎥 Each course includes embedded **YouTube Video Lectures**, One-Click **Study Mode ▶**, and automatic skill synchronization directly into your Student ERP profile.",
            "suggestions": ["Enroll in AI Biometrics", "Study Video Lectures", "View My Certificates"],
            "model_used": "CoopSync Local Semantic RAG"
        }
        
    # 4. GPS Geofence & Location queries
    elif any(k in q for k in ["gps", "geofence", "location", "radius", "haversine", "perimeter", "meters"]):
        return {
            "reply": "📍 **Real GPS Geofencing Verification (Requirement SIH26087)** is active:\n\n• **Campus Coordinates:** Configured by Institution Admin via `/api/institution/config`\n• **Allowed Radius:** **50.0 meters** from campus center\n• **Mathematical Formula:** Geodesic distance is verified on the backend using the spherical **Haversine formula** ($R = 6,371,000\\text{ m}$)\n• **Signal Quality Threshold:** Rejects poor GPS accuracy signals > 100 meters\n• **Zero-Trust Backend Validation:** Prevents client coordinate spoofing and validates offline sync logs.",
            "suggestions": ["Test device GPS check-in", "View geofence parameters", "How does Haversine formula work?"],
            "model_used": "CoopSync Local Semantic RAG"
        }

    # 5. Anti-spoofing & security
    elif any(k in q for k in ["proxy", "anti-spoof", "spoof", "liveness", "security", "camera", "opencv", "face"]):
        return {
            "reply": "🔒 **CoopSync Biometric Security Engine**:\n\n• **LBPH Model Integration:** Pre-trained Haar Cascade + LBPH recognizer (`classifier.xml`).\n• **Laplacian Edge Frequency Filter:** Calculates variance of the Laplacian filter in real time ($> 28.0$) to detect and block 2D photo printouts and smartphone screen replay attacks.\n• **Dynamic 30-Second QR Code:** Rotating HMAC-SHA256 salt with visual countdown timer preventing shared screenshot proxies.\n• **Native Desktop Bridge:** Launch native Python Tkinter detector (`facedetector.py`) directly from the web interface.",
            "suggestions": ["Launch OpenCV Camera", "Web Face Enrollment", "View Attendance Roster"],
            "model_used": "CoopSync Local Semantic RAG"
        }

    # 6. Check Built-in Knowledge Bank
    for kw, answer in BUILTIN_KNOWLEDGE_BANK.items():
        if kw in q:
            return {
                "reply": f"{answer}\n\n---\n💡 *CoopSync AI Advisor Tip: Connect your free **Google Gemini** or **Groq** API key in **⚙️ AI Settings** for full conversational AI reasoning on any topic!*",
                "suggestions": [f"Learn more about {kw.title()}", "Recommend related courses", "Configure Gemini API Key"],
                "model_used": "CoopSync Academic Knowledge Bank"
            }

    # 7. Check Live Educational Encyclopedia (Wikipedia API)
    edu_summary = fetch_educational_summary(query)
    if edu_summary:
        return {
            "reply": f"📚 **{edu_summary['title']}**\n\n{edu_summary['extract']}\n\n---\n💡 *CoopSync AI Advisor: Connect your free **Google Gemini** or **Groq** API key via **⚙️ AI Settings** to chat conversationally about this topic!*",
            "suggestions": [f"Explore {edu_summary['title']} in Courses", "Recommend technical courses", "Configure Cloud AI Key"],
            "model_used": "CoopSync Educational Knowledge Base (Live Wikipedia)"
        }

    # 8. Friendly Fallback with Setup Instructions
    return {
        "reply": f"Hello **{student_name}**!\n\nI couldn't find a direct local ERP record or encyclopedia summary for: **\"{query}\"**.\n\n✨ **To enable full generative conversational AI answers for any topic:**\n1. Click the **⚙️ AI Settings** button in the top right of this chat window.\n2. Paste your free **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)) or **Groq Key**.\n3. Click **Save & Connect**.\n\nOnce connected, I will directly answer any question—academic, science, programming, or cooperative governance!",
        "suggestions": ["Configure Free Gemini API Key", "How many attendance days do I have?", "Recommend jobs for my profile"],
        "model_used": "CoopSync Local Assistant"
    }

def get_ai_chat_response(
    query: str, 
    user_profile: Dict[str, Any], 
    attendance_count: int, 
    jobs: List[Dict[str, Any]], 
    courses: List[Dict[str, Any]],
    provider_override: Optional[str] = None,
    api_key_override: Optional[str] = None,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dual-engine AI chat handler:
    1. Compiles context-rich RAG data from live database records.
    2. Attempts generative Cloud LLM (Gemini / Groq / OpenRouter) if an API key is present.
    3. Seamlessly falls back to local semantic engine if offline or key is missing.
    """
    load_env_file()
    student_name = user_profile.get("name", "Student")
    dept = user_profile.get("department", "CSE")
    skills = user_profile.get("skills", "Python, OpenCV, Machine Learning")
    percent = min(100, int((attendance_count / max(1, 26)) * 100))
    is_eligible = percent >= 75
    
    # 1. Build RAG System Context from Live ERP Database
    jobs_summary = "; ".join([f"{j.get('title')} at {j.get('company')} ({j.get('salary')}, skills: {j.get('required_skills')})" for j in jobs[:5]])
    courses_summary = "; ".join([f"{c.get('title')} ({c.get('duration')}, {c.get('category')})" for c in courses[:5]])
    
    system_context = f"""You are CoopSync AI Advisor, an intelligent assistant for the CoopSync AI Enterprise Cooperative ERP & Employment Ecosystem (Smart India Hackathon 2026, Problem Statement SIH26087).

CURRENT LOGGED IN USER CONTEXT (FROM DATABASE):
- Student Name: {student_name}
- Department: {dept}
- Current Verified Skills: {skills}
- Verified Attendance Count: {attendance_count} / 26 sessions ({percent}%)
- Examination Eligibility: {"ELIGIBLE (>= 75% NCCT requirement)" if is_eligible else "SHORTAGE WARNING (< 75% required)"}
- Available Cooperative Jobs: {jobs_summary}
- Available LMS Courses: {courses_summary}
- GPS Geofence Rules: Real device browser GPS validated on backend via Haversine formula (allowed radius: 50m).

GUIDELINES:
- Provide helpful, friendly, and structured responses using markdown (bullet points, bold text).
- You can answer ANY question asked by the user, including academic concepts (science, math, engineering), career advice, coding, or cooperative economics.
- If asked about attendance or exams, mention their exact attendance percentage ({percent}%) and whether they meet the 75% NCCT threshold.
- Keep responses concise, inspiring, and professional.
"""

    provider = (provider_override or RUNTIME_AI_CONFIG.get("provider", "gemini")).lower()
    gemini_key = api_key_override if (provider == "gemini" or (api_key_override and api_key_override.startswith("AIzaSy"))) and api_key_override else (
        RUNTIME_AI_CONFIG.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY", "")
    )
    groq_key = api_key_override if (provider == "groq" or (api_key_override and api_key_override.startswith("gsk_"))) and api_key_override else (
        RUNTIME_AI_CONFIG.get("groq_api_key") or os.environ.get("GROQ_API_KEY", "")
    )
    openrouter_key = api_key_override if provider == "openrouter" and api_key_override else (
        RUNTIME_AI_CONFIG.get("openrouter_api_key") or os.environ.get("OPENROUTER_API_KEY", "")
    )
    
    cloud_reply = None
    model_name_used = "CoopSync Local Semantic RAG"
    
    # 2. Attempt Google Gemini API
    if (provider == "gemini" or gemini_key) and gemini_key:
        model = model_override or RUNTIME_AI_CONFIG.get("gemini_model", "gemini-1.5-flash")
        cloud_reply = call_gemini_api(query, system_context, gemini_key, model)
        if cloud_reply:
            model_name_used = f"Google Gemini (Live Cloud AI)"
            
    # 3. Attempt Groq Cloud API
    elif (provider == "groq" or groq_key) and groq_key:
        model = model_override or RUNTIME_AI_CONFIG.get("groq_model", "llama-3.3-70b-versatile")
        cloud_reply = call_groq_api(query, system_context, groq_key, model)
        if cloud_reply:
            model_name_used = f"Groq {model} (Live Cloud AI)"

    # 4. Attempt OpenRouter API
    elif (provider == "openrouter" or openrouter_key) and openrouter_key:
        cloud_reply = call_openrouter_api(query, system_context, openrouter_key)
        if cloud_reply:
            model_name_used = "OpenRouter (Live Cloud AI)"

    # 5. If Cloud API succeeded, return it
    if cloud_reply:
        return {
            "reply": cloud_reply,
            "suggestions": generate_smart_suggestions(query, cloud_reply),
            "model_used": model_name_used
        }
        
    # 6. Fallback seamlessly to rock-solid Local Semantic RAG Engine + Wikipedia Educational Base
    local_result = get_local_semantic_response(query, user_profile, attendance_count, jobs, courses)
    return local_result
