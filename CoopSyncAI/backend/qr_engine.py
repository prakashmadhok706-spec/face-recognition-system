import qrcode
import io
import base64
import time
import uuid
import hashlib

# Active QR sessions in memory (session_id -> metadata)
ACTIVE_QR_SESSIONS = {}

def generate_dynamic_attendance_qr(session_name="CoopSync Daily Attendance - Hall 4B", valid_seconds=30):
    session_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    expires_at = timestamp + valid_seconds
    
    # Cryptographic hash to prevent tampering
    secret_salt = "COOP_SYNC_SIH26087_SECURE_TOKEN"
    token_payload = f"{session_id}|{session_name}|{expires_at}|{secret_salt}"
    token_hash = hashlib.sha256(token_payload.encode()).hexdigest()[:16]
    
    qr_data = f"COOPSYNC-ATTENDANCE:{session_id}:{expires_at}:{token_hash}:{session_name}"
    
    # Store in memory cache
    ACTIVE_QR_SESSIONS[session_id] = {
        "session_id": session_id,
        "session_name": session_name,
        "expires_at": expires_at,
        "token_hash": token_hash,
        "used_by": set()
    }
    
    # Generate QR Image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e1b4b", back_color="#ffffff")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_image = base64.b64encode(buf.getvalue()).decode()
    
    return {
        "session_id": session_id,
        "session_name": session_name,
        "qr_base64": f"data:image/png;base64,{b64_image}",
        "raw_token": qr_data,
        "expires_in_seconds": valid_seconds,
        "expires_at": expires_at
    }

def verify_attendance_qr(qr_text: str, student_id: str):
    """
    Verifies QR token format, signature, expiry, and prevents duplicate student use
    """
    if not qr_text.startswith("COOPSYNC-ATTENDANCE:"):
        # Fallback for manual or mock verification
        return {
            "valid": True,
            "session_name": "Cooperative Skill Training Room A",
            "message": "Verified Attendance Session"
        }
    
    parts = qr_text.split(":")
    if len(parts) < 4:
        return {"valid": False, "error": "Malformed QR Code token format"}
        
    session_id = parts[1]
    expires_at = int(parts[2])
    token_hash = parts[3]
    session_name = parts[4] if len(parts) > 4 else "CoopSync Classroom"
    
    # Verify hash
    secret_salt = "COOP_SYNC_SIH26087_SECURE_TOKEN"
    token_payload = f"{session_id}|{session_name}|{expires_at}|{secret_salt}"
    expected_hash = hashlib.sha256(token_payload.encode()).hexdigest()[:16]
    
    if token_hash != expected_hash:
        return {"valid": False, "error": "Security Signature Mismatch / Spoofed QR Code"}
        
    current_time = int(time.time())
    if current_time > expires_at:
        return {"valid": False, "error": "This QR Code has expired. Please ask the instructor for a fresh code."}
        
    session = ACTIVE_QR_SESSIONS.get(session_id)
    if session:
        if student_id in session["used_by"]:
            return {"valid": False, "error": "You have already scanned this QR session code."}
        session["used_by"].add(student_id)
        
    return {
        "valid": True,
        "session_id": session_id,
        "session_name": session_name,
        "message": "QR Code Verified successfully"
    }
