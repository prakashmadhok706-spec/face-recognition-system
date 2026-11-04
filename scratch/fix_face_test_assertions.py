with open(r'CoopSyncAI\backend\test_face_enrollment_retrain.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix assertion 2
old_assert2 = """    assert not res.get("success"), "Student role should be rejected!"
    assert "Unauthorized" in res.get("error", ""), f"Expected Unauthorized error: {res}"
    print("[PASS] Unauthorized student role successfully blocked:", res.get("error"))"""

new_assert2 = """    assert not res.get("success"), "Student role should be rejected!"
    err_str = res.get("error", "") or res.get("detail", "")
    assert "Unauthorized" in err_str or "forbidden" in err_str.lower() or "privileges" in err_str.lower(), f"Expected Auth error: {res}"
    print("[PASS] Unauthorized student role successfully blocked:", err_str)"""

text = text.replace(old_assert2, new_assert2)

# Fix test 7 capture-sample headers
old_test7 = """        res = http_post("students/capture-sample", {
            "student_id": "5025088",
            "student_name": "Puneet",
            "image_base64": valid_b64,
            "requester_role": "admin",
            "target_samples": 50
        })"""

new_test7 = """        res = http_post("students/capture-sample", {
            "student_id": "5025088",
            "student_name": "Puneet",
            "image_base64": valid_b64,
            "target_samples": 50
        }, extra_headers=ADMIN_AUTH_HEADER)"""

text = text.replace(old_test7, new_test7)

# Fix test 8 reset-samples
old_test8 = """    reset_res = http_post("students/5025088/reset-samples", {"requester_role": "admin"})"""
new_test8 = """    reset_res = http_post("students/5025088/reset-samples", {}, extra_headers=ADMIN_AUTH_HEADER)"""
text = text.replace(old_test8, new_test8)

# Fix test 9 unauthorized train
old_test9_unauth = """    # Student role blocked
    res = http_post("train", {"requester_role": "student"})
    assert not res.get("success")
    assert "Unauthorized" in res.get("error", "")
    print("[PASS] Unauthorized training trigger blocked:", res.get("error"))"""

new_test9_unauth = """    # Student role blocked
    res = http_post("train", {}, extra_headers=STUDENT_AUTH_HEADER)
    assert not res.get("success")
    err_str = res.get("error", "") or res.get("detail", "")
    assert "Unauthorized" in err_str or "forbidden" in err_str.lower() or "privileges" in err_str.lower()
    print("[PASS] Unauthorized training trigger blocked:", err_str)"""

text = text.replace(old_test9_unauth, new_test9_unauth)

# Fix test 9 authorized train
old_test9_auth = """    res = http_post("train", {"requester_role": "admin"})"""
new_test9_auth = """    res = http_post("train", {}, extra_headers=ADMIN_AUTH_HEADER)"""
text = text.replace(old_test9_auth, new_test9_auth)

with open(r'CoopSyncAI\backend\test_face_enrollment_retrain.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated test_face_enrollment_retrain.py assertions!")
