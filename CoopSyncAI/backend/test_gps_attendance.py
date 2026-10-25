"""
Automated Test Suite for Real GPS-Based Attendance Verification
SIH 2026 - Problem Statement SIH26087 (CoopSync AI)
Covers all requirements from Requirement 15:
1. Inside-radius verification
2. Outside-radius rejection
3. Poor GPS accuracy rejection
4. Denied / missing location rejection
5. Invalid / out-of-bounds coordinates rejection
6. Duplicate attendance prevention
7. Unauthorized RBAC requests on config
8. Authorized institution geofence configuration
9. Offline attendance GPS revalidation
"""

import math
import sys
import os
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    USE_TEST_CLIENT = True
except Exception:
    import requests
    USE_TEST_CLIENT = False
    BASE_URL = "http://localhost:8000"

class ApiWrapper:
    def get(self, path, **kwargs):
        if USE_TEST_CLIENT:
            url = path if path.startswith("/api") else f"/api{path}"
            return client.get(url, **kwargs)
        else:
            return requests.get(f"{BASE_URL}{path}", **kwargs)

    def post(self, path, **kwargs):
        if USE_TEST_CLIENT:
            url = path if path.startswith("/api") else f"/api{path}"
            return client.post(url, **kwargs)
        else:
            return requests.post(f"{BASE_URL}{path}", **kwargs)

    def put(self, path, **kwargs):
        if USE_TEST_CLIENT:
            url = path if path.startswith("/api") else f"/api{path}"
            return client.put(url, **kwargs)
        else:
            return requests.put(f"{BASE_URL}{path}", **kwargs)

api = ApiWrapper()

def log_test(name, passed, detail=""):
    badge = "[PASS]" if passed else "[FAIL]"
    print(f"{badge} {name}: {detail}")
    if not passed:
        raise AssertionError(f"Test Failed: {name} - {detail}")

def test_haversine_formula():
    """Unit test for Haversine mathematical calculation"""
    from main import calculate_haversine_distance
    # Distance between New Delhi (28.6139, 77.2090) and Connaught Place (28.6315, 77.2167)
    # Approx 2.08 km (2080m)
    dist = calculate_haversine_distance(28.6139, 77.2090, 28.6315, 77.2167)
    passed = 1900 <= dist <= 2200
    log_test("Haversine Distance Accuracy", passed, f"Calculated distance: {dist}m")

def test_institution_config_api():
    """Test fetching and updating institution config with RBAC"""
    # 1. Fetch current config
    res = api.get("/api/institution/config")
    passed = res.status_code == 200 and res.json().get("success")
    cfg = res.json().get("config", {})
    log_test("Fetch Institution Config", passed, f"Campus: {cfg.get('name')}, Allowed Radius: {cfg.get('allowed_radius_meters')}m")

    # 2. Unauthorized update by student role
    unauth_payload = {
        "name": "Hacked Campus",
        "latitude": 0.0,
        "longitude": 0.0,
        "allowed_radius_meters": 5000.0,
        "requester_role": "student"
    }
    res_unauth = api.put("/api/institution/config", json=unauth_payload)
    passed_unauth = res_unauth.status_code == 403
    log_test("Reject Unauthorized Config Update (Student Role)", passed_unauth, f"HTTP {res_unauth.status_code}")

    # 3. Authorized update by admin role
    auth_payload = {
        "name": "Cooperative Skill Center (NCCT / VAMNICOM Campus)",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "allowed_radius_meters": 50.0,
        "max_accuracy_threshold": 100.0,
        "enforce_geofence": True,
        "requester_role": "admin"
    }
    res_auth = api.put("/api/institution/config", json=auth_payload)
    passed_auth = res_auth.status_code == 200 and res_auth.json().get("success")
    log_test("Authorized Config Update (Admin Role)", passed_auth, f"Updated: {res_auth.json().get('message')}")

def test_gps_attendance_scenarios():
    """Test attendance verification under different GPS conditions"""
    # First generate a live dynamic 30s QR session
    qr_res = api.post("/api/attendance/qr/generate").json()
    token = qr_res.get("raw_token")
    session_id = qr_res.get("session_id")
    log_test("Dynamic 30s QR Generation", bool(token), f"Session: {session_id}")

    # Clear previous attendance logs for clean test state
    api.post("/api/attendance/clear")

    # Campus coordinates: (28.6139, 77.2090)

    # --- Test 1: Missing GPS Coordinates (User denied permission) ---
    req_denied = {
        "qr_text": token,
        "student_id": "5025088",
        "latitude": None,
        "longitude": None,
        "accuracy": None
    }
    res1 = api.post("/api/attendance/qr/verify", json=req_denied).json()
    passed1 = res1.get("success") is False and res1.get("code") == "MISSING_COORDINATES"
    log_test("Reject Missing / Denied Location", passed1, f"Error: {res1.get('error')}")

    # --- Test 2: Invalid / Out-of-bounds Coordinates ---
    req_invalid = {
        "qr_text": token,
        "student_id": "5025088",
        "latitude": 999.0,
        "longitude": 77.2090,
        "accuracy": 10.0
    }
    res2 = api.post("/api/attendance/qr/verify", json=req_invalid).json()
    passed2 = res2.get("success") is False and res2.get("code") == "OUT_OF_BOUNDS_COORDINATES"
    log_test("Reject Out-of-bounds Coordinates", passed2, f"Error: {res2.get('error')}")

    # --- Test 3: Poor Accuracy Signal (> 100m threshold) ---
    req_poor = {
        "qr_text": token,
        "student_id": "5025088",
        "latitude": 28.61391,
        "longitude": 77.20901,
        "accuracy": 145.0  # Accuracy ±145m is too poor
    }
    res3 = api.post("/api/attendance/qr/verify", json=req_poor).json()
    passed3 = res3.get("success") is False and res3.get("code") == "POOR_ACCURACY"
    log_test("Reject Poor GPS Accuracy (>100m)", passed3, f"Accuracy: 145m, Error: {res3.get('error')}")

    # --- Test 4: Outside Allowed Radius (> 50m) ---
    # Coordinates ~1.6km away
    req_outside = {
        "qr_text": token,
        "student_id": "5025088",
        "latitude": 28.6250,
        "longitude": 77.2200,
        "accuracy": 8.0
    }
    res4 = api.post("/api/attendance/qr/verify", json=req_outside).json()
    passed4 = res4.get("success") is False and res4.get("code") == "OUTSIDE_RADIUS"
    log_test("Reject Outside Geofence Perimeter", passed4, f"Distance: {res4.get('distance')}m, Error: {res4.get('error')}")

    # --- Test 5: Inside Allowed Radius (<= 50m) - SUCCESS ---
    # Coordinates ~1.5 meters from campus center
    req_inside = {
        "qr_text": token,
        "student_id": "5025088",
        "latitude": 28.61391,
        "longitude": 77.20901,
        "accuracy": 6.5,
        "session_id": session_id,
        "device_info": "Chrome Mobile / Android (GPS Test Device)"
    }
    res5 = api.post("/api/attendance/qr/verify", json=req_inside).json()
    passed5 = res5.get("success") is True and res5.get("is_duplicate") is False
    log_test("Accept Inside Geofence Attendance", passed5, f"Distance: {res5.get('distance')}m, Message: {res5.get('message')}")

    # --- Test 6A: Duplicate Scan Prevention on Same QR Session ---
    res6a = api.post("/api/attendance/qr/verify", json=req_inside).json()
    passed6a = res6a.get("valid") is False or "already scanned" in str(res6a.get("error", ""))
    log_test("Block Duplicate QR Session Rescan", passed6a, f"Blocked: {res6a.get('error')}")

    # --- Test 6B: Duplicate Attendance Prevention Across Entire Day (Database Check) ---
    qr_res_new = api.post("/api/attendance/qr/generate").json()
    req_inside_new_session = dict(req_inside)
    req_inside_new_session["qr_text"] = qr_res_new.get("raw_token")
    req_inside_new_session["session_id"] = qr_res_new.get("session_id")

    res6b = api.post("/api/attendance/qr/verify", json=req_inside_new_session).json()
    passed6b = res6b.get("is_duplicate") is True and res6b.get("code") == "DUPLICATE_ATTENDANCE"
    log_test("Block Duplicate Attendance Across Entire Day (DB Level)", passed6b, f"Message: {res6b.get('message')}")

def test_offline_gps_revalidation():
    """Test Requirement 14: Offline attendance cannot bypass GPS validation"""
    # Student 4868448 (Ranjan)
    offline_payload = {
        "records": [
            {
                # Record A: Inside radius -> should be confirmed Present
                "student_id": "4868448",
                "student_name": "Ranjan",
                "date": "2026-10-24",
                "time": "10:15:00",
                "method": "Offline Mobile Cache",
                "confidence": 98.0,
                "latitude": 28.61392,
                "longitude": 77.20902,
                "accuracy": 8.0
            },
            {
                # Record B: Outside radius -> must be flagged / pending verification
                "student_id": "577575",
                "student_name": "Varun",
                "date": "2026-10-24",
                "time": "10:16:00",
                "method": "Offline Mobile Cache",
                "confidence": 97.0,
                "latitude": 28.6500,  # Far outside
                "longitude": 77.2500,
                "accuracy": 12.0
            }
        ]
    }

    res = api.post("/api/attendance/sync-offline", json=offline_payload).json()
    passed = res.get("success") is True and res.get("synced_count") == 1 and res.get("flagged_count") == 1
    log_test("Offline Attendance GPS Revalidation (Requirement 14)", passed, 
             f"Synced: {res.get('synced_count')}, Flagged (Outside Geofence): {res.get('flagged_count')}")

def test_attendance_logs_telemetry():
    """Verify that GPS telemetry (lat, lon, distance, geofence_status) is in attendance logs"""
    res = api.get("/api/attendance/logs").json()
    passed = False
    for r in res:
        if r.get("student_id") == "5025088":
            if r.get("distance") is not None and r.get("latitude") is not None and "Verified" in (r.get("geofence_status") or ""):
                passed = True
                log_test("Attendance Logs GPS Telemetry", True, 
                         f"Found Record: Lat {r.get('latitude')}, Lon {r.get('longitude')}, Distance: {r.get('distance')}m, Status: {r.get('geofence_status')}")
                break
    if not passed:
        log_test("Attendance Logs GPS Telemetry", False, "No verified GPS record in logs")

def run_all():
    print("\n=======================================================")
    print(" 🚀 RUNNING COOPSYNC AI REAL GPS VERIFICATION TEST SUITE ")
    print("=======================================================\n")
    test_haversine_formula()
    test_institution_config_api()
    test_gps_attendance_scenarios()
    test_offline_gps_revalidation()
    test_attendance_logs_telemetry()
    print("\n=======================================================")
    print(" ✅ ALL GPS ATTENDANCE TESTS PASSED SUCCESSFULLY! ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_all()
