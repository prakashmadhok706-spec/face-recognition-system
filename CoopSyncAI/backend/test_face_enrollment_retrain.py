import sys
import base64
import cv2
import numpy as np
import urllib.request
import urllib.error
import json
import time
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

def http_get(endpoint):
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_post(endpoint, payload):
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return json.loads(body)
        except Exception:
            return {"success": False, "error": f"HTTP {e.code}: {body}"}

def create_blank_image(width=640, height=480, color=(0, 0, 0)):
    img = np.full((height, width, 3), color, dtype=np.uint8)
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def test_all():
    print("=== 1. Testing Health Endpoint ===")
    health = None
    for attempt in range(12):
        try:
            health = http_get("health")
            if health.get("status") == "healthy":
                break
        except Exception:
            time.sleep(1)
    assert health and health.get("status") == "healthy", f"Health check failed after wait: {health}"
    print("[PASS] Health check OK:", health.get("status"))

    print("\n=== 2. Testing Role-Based Authorization on Enrollment ===")
    b64_sample = create_blank_image()
    # Student role must be blocked
    res = http_post("students/capture-sample", {
        "student_id": "5025088",
        "student_name": "Puneet",
        "image_base64": b64_sample,
        "requester_role": "student"
    })
    assert not res.get("success"), "Student role should be rejected!"
    assert "Unauthorized" in res.get("error", ""), f"Expected Unauthorized error: {res}"
    print("[PASS] Unauthorized student role successfully blocked:", res.get("error"))

    print("\n=== 3. Testing Invalid Student ID ===")
    res = http_post("students/capture-sample", {
        "student_id": "999999999_nonexistent",
        "student_name": "Ghost User",
        "image_base64": b64_sample,
        "requester_role": "admin"
    })
    assert not res.get("success"), "Invalid student ID should fail"
    assert "not found" in res.get("error", "").lower(), f"Expected not found message: {res}"
    print("[PASS] Non-existent student ID rejected:", res.get("error"))

    print("\n=== 4. Testing Empty / No Face Rejection ===")
    res = http_post("students/capture-sample", {
        "student_id": "5025088",
        "student_name": "Puneet",
        "image_base64": create_blank_image(color=(120, 120, 120)),
        "requester_role": "admin"
    })
    assert not res.get("success"), "Blank image should be rejected"
    assert "No face detected" in res.get("error", ""), f"Expected No face detected: {res}"
    print("[PASS] No face detected properly rejected:", res.get("error"))

    print("\n=== 5. Testing Too Dark Image Rejection ===")
    res = http_post("students/capture-sample", {
        "student_id": "5025088",
        "student_name": "Puneet",
        "image_base64": create_blank_image(color=(15, 15, 15)),
        "requester_role": "admin"
    })
    assert not res.get("success")
    assert "Too dark" in res.get("error", "")
    print("[PASS] Dark frame properly rejected:", res.get("error"))

    print("\n=== 6. Testing Too Bright Image Rejection ===")
    res = http_post("students/capture-sample", {
        "student_id": "5025088",
        "student_name": "Puneet",
        "image_base64": create_blank_image(color=(245, 245, 245)),
        "requester_role": "admin"
    })
    assert not res.get("success")
    assert "Too bright" in res.get("error", "")
    print("[PASS] Bright frame properly rejected:", res.get("error"))

    print("\n=== 7. Testing Valid Sample Acquisition Using Real Dataset Sample ===")
    dataset_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "dataset"))
    sample_file = None
    for root, dirs, files in os.walk(dataset_root):
        for f in files:
            if f.endswith('.jpg'):
                sample_file = os.path.join(root, f)
                break
        if sample_file:
            break

    if sample_file and os.path.exists(sample_file):
        with open(sample_file, "rb") as sf:
            valid_b64 = base64.b64encode(sf.read()).decode('utf-8')

        res = http_post("students/capture-sample", {
            "student_id": "5025088",
            "student_name": "Puneet",
            "image_base64": valid_b64,
            "requester_role": "admin",
            "target_samples": 50
        })
        print("Valid sample capture response:", res)
        assert res.get("success"), f"Valid sample should be accepted: {res}"
        assert res.get("samples_count", 0) > 0
        print(f"[PASS] Valid face sample accepted! Sample count: {res.get('samples_count')}, Quality: {res.get('quality')}")

    print("\n=== 8. Testing Sample Count & Reset Endpoint ===")
    count_res = http_get("students/5025088/samples-count")
    print("Sample count before reset:", count_res)
    assert count_res.get("success")

    reset_res = http_post("students/5025088/reset-samples", {"requester_role": "admin"})
    print("Reset response:", reset_res)
    assert reset_res.get("success")
    assert reset_res.get("samples_count") == 0
    print("[PASS] Student samples reset successfully!")

    print("\n=== 9. Testing Asynchronous Model Retraining ===")
    # Verify student cannot trigger training
    unauth_train = http_post("train", {"requester_role": "student"})
    assert not unauth_train.get("success"), "Student cannot trigger training"
    print("[PASS] Unauthorized training trigger blocked:", unauth_train.get("message"))

    # Wait if previous training job is still in progress
    for _ in range(15):
        st = http_get("train/status")
        if st.get("status") not in ("queued", "processing"):
            break
        time.sleep(1)

    # Trigger training as admin
    train_res = http_post("train", {"requester_role": "admin"})
    assert train_res.get("success"), f"Training start failed: {train_res}"
    print("[PASS] Retraining queued successfully:", train_res)

    # Poll status
    completed = False
    for i in range(30):
        time.sleep(0.5)
        status_res = http_get("train/status")
        print(f"  [Poll {i+1}] Status: {status_res.get('status')}, Progress: {status_res.get('progress')}%, Msg: {status_res.get('message')}")
        if status_res.get("status") == "completed":
            completed = True
            break
        elif status_res.get("status") == "failed":
            print("Training failed with error:", status_res.get("error"))
            break

    assert completed, "Model retraining should complete successfully!"
    print("[PASS] Retraining completed! Trained across classes:", status_res.get("classes_trained"))

    # Verify backup exists
    data_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    bak_path = os.path.join(data_dir, "classifier.xml.bak")
    active_path = os.path.join(data_dir, "classifier.xml")
    assert os.path.exists(bak_path), f"Backup file {bak_path} must exist!"
    assert os.path.exists(active_path) and os.path.getsize(active_path) > 10000, "Active model file must exist and be valid"
    print(f"[PASS] Verified classifier backup exists: {bak_path} ({os.path.getsize(bak_path)} bytes)")
    print(f"[PASS] Verified active model exists: {active_path} ({os.path.getsize(active_path)} bytes)")

    print("\nALL TESTS PASSED SUCCESSFULLY! Biometric Web Enrollment & Asynchronous Retraining fully verified.")

if __name__ == "__main__":
    test_all()
