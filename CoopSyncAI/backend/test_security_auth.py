"""
CoopSync AI - Comprehensive Security & Authentication Test Suite
Tests Phase 1 Critical Security Hardening:
1. Correct password authentication
2. Incorrect password rejection
3. Backdoor password rejection (pass123)
4. Cryptographic JWT signature validation
5. JWT expiration validation
6. Invalid token rejection
7. Missing token rejection on private endpoints
8. Student role access restrictions
9. Trainer role access restrictions
10. Institution admin permissions
11. Employer role access restrictions
12. NCCT admin permissions
13. Cross-user data isolation (Student A cannot view Student B)
14. Attendance QR fallback rejection (unknown student rejected; User 1 NOT credited)
15. Offline sync identity validation (unknown student rejected; User 1 NOT credited)
16. CORS allowed origins configuration
"""

import unittest
import os
import sys
import jwt
from datetime import datetime, timedelta, timezone

# Ensure backend root is on import path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, User, Attendance, init_db
from auth.security import hash_password, verify_password, is_bcrypt_hash
from auth.jwt_handler import (
    create_access_token, 
    create_refresh_token, 
    decode_token, 
    JWT_SECRET_KEY, 
    JWT_ALGORITHM,
    TOKEN_AUDIENCE,
    TOKEN_ISSUER
)

client = TestClient(app)

class TestCoopSyncSecurityPhase1(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        db = SessionLocal()
        try:
            # Seed or retrieve test users for all 5 roles
            cls.admin_user = db.query(User).filter_by(email="sec_admin@coopsync.edu").first()
            if not cls.admin_user:
                cls.admin_user = User(
                    name="Security Admin",
                    email="sec_admin@coopsync.edu",
                    password_hash=hash_password("AdminSecurePass!123"),
                    role="admin",
                    student_id="SEC_ADM01"
                )
                db.add(cls.admin_user)

            cls.ncct_user = db.query(User).filter_by(email="sec_ncct@gov.in").first()
            if not cls.ncct_user:
                cls.ncct_user = User(
                    name="NCCT Director",
                    email="sec_ncct@gov.in",
                    password_hash=hash_password("NcctSecurePass!123"),
                    role="ncct_admin",
                    student_id="SEC_NCCT01"
                )
                db.add(cls.ncct_user)

            cls.trainer_user = db.query(User).filter_by(email="sec_trainer@coopsync.edu").first()
            if not cls.trainer_user:
                cls.trainer_user = User(
                    name="Security Trainer",
                    email="sec_trainer@coopsync.edu",
                    password_hash=hash_password("TrainerSecurePass!123"),
                    role="trainer",
                    student_id="SEC_TRN01"
                )
                db.add(cls.trainer_user)

            cls.student_a = db.query(User).filter_by(email="sec_student_a@coopsync.edu").first()
            if not cls.student_a:
                cls.student_a = User(
                    name="Student Alpha",
                    email="sec_student_a@coopsync.edu",
                    password_hash=hash_password("StudentPass!123"),
                    role="student",
                    student_id="STU_SEC_01"
                )
                db.add(cls.student_a)

            cls.student_b = db.query(User).filter_by(email="sec_student_b@coopsync.edu").first()
            if not cls.student_b:
                cls.student_b = User(
                    name="Student Beta",
                    email="sec_student_b@coopsync.edu",
                    password_hash=hash_password("StudentPass!456"),
                    role="student",
                    student_id="STU_SEC_02"
                )
                db.add(cls.student_b)

            cls.employer_user = db.query(User).filter_by(email="sec_employer@agricoop.org").first()
            if not cls.employer_user:
                cls.employer_user = User(
                    name="AgriCoop Recruiter",
                    email="sec_employer@agricoop.org",
                    password_hash=hash_password("EmployerPass!123"),
                    role="employer",
                    student_id="EMP_SEC_01"
                )
                db.add(cls.employer_user)

            db.commit()
            db.refresh(cls.admin_user)
            db.refresh(cls.ncct_user)
            db.refresh(cls.trainer_user)
            db.refresh(cls.student_a)
            db.refresh(cls.student_b)
            db.refresh(cls.employer_user)
        finally:
            db.close()

        # Generate tokens
        cls.admin_token = create_access_token(cls.admin_user.id, cls.admin_user.role, cls.admin_user.email, cls.admin_user.student_id)
        cls.ncct_token = create_access_token(cls.ncct_user.id, cls.ncct_user.role, cls.ncct_user.email, cls.ncct_user.student_id)
        cls.trainer_token = create_access_token(cls.trainer_user.id, cls.trainer_user.role, cls.trainer_user.email, cls.trainer_user.student_id)
        cls.student_a_token = create_access_token(cls.student_a.id, cls.student_a.role, cls.student_a.email, cls.student_a.student_id)
        cls.student_b_token = create_access_token(cls.student_b.id, cls.student_b.role, cls.student_b.email, cls.student_b.student_id)
        cls.employer_token = create_access_token(cls.employer_user.id, cls.employer_user.role, cls.employer_user.email, cls.employer_user.student_id)

    # 1. Correct Password Authentication
    def test_01_correct_password_authentication(self):
        resp = client.post("/api/auth/login", json={
            "email_or_id": "sec_admin@coopsync.edu",
            "password": "AdminSecurePass!123"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "sec_admin@coopsync.edu")
        # Ensure password is NOT leaked in response
        self.assertNotIn("password", data["user"])
        self.assertNotIn("password_hash", data["user"])

    # 2. Incorrect Password Rejection
    def test_02_incorrect_password_rejection(self):
        resp = client.post("/api/auth/login", json={
            "email_or_id": "sec_admin@coopsync.edu",
            "password": "WrongPassword999!"
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Incorrect password", resp.json()["detail"])

    # 3. Backdoor Password Rejection (pass123 removal verification)
    def test_03_backdoor_password_rejection(self):
        resp = client.post("/api/auth/login", json={
            "email_or_id": "sec_admin@coopsync.edu",
            "password": "pass123"
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Incorrect password", resp.json()["detail"])

    # 4. Cryptographic JWT Signature Validation
    def test_04_jwt_signature_validation(self):
        # Decode valid token
        payload = decode_token(self.admin_token, expected_type="access")
        self.assertEqual(payload["email"], "sec_admin@coopsync.edu")
        self.assertEqual(payload["role"], "admin")

        # Fake signature with wrong secret key (>= 32 bytes)
        forged_token = jwt.encode(payload, "wrong_secret_key_999_super_long_32bytes_min", algorithm=JWT_ALGORITHM)
        with self.assertRaises(jwt.InvalidTokenError):
            decode_token(forged_token, expected_type="access")

    # 5. JWT Expiration Validation
    def test_05_jwt_expiration_validation(self):
        past_time = datetime.now(timezone.utc) - timedelta(hours=2)
        expired_payload = {
            "sub": str(self.student_a.id),
            "user_id": self.student_a.id,
            "role": "student",
            "email": self.student_a.email,
            "type": "access",
            "iss": TOKEN_ISSUER,
            "aud": TOKEN_AUDIENCE,
            "iat": int((past_time - timedelta(minutes=10)).timestamp()),
            "exp": int(past_time.timestamp())
        }
        expired_token = jwt.encode(expired_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

        # Calling protected endpoint with expired token must return 401
        resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("expired", resp.json()["detail"].lower())

    # 6. Invalid Token Rejection
    def test_06_invalid_token_rejection(self):
        resp = client.get("/api/users/me", headers={"Authorization": "Bearer completely_bogus_token_xyz"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid or revoked", resp.json()["detail"])

    # 7. Missing Token Rejection on Private Endpoints
    def test_07_missing_token_rejection(self):
        resp = client.get("/api/students")
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Authentication required", resp.json()["detail"])

    # 8. Student Access Restrictions (Student cannot add students or change config)
    def test_08_student_access_restrictions(self):
        # Attempt to add student using student token
        resp = client.post(
            "/api/students/add",
            headers={"Authorization": f"Bearer {self.student_a_token}"},
            json={"id": "STU_UNAUTH_99", "name": "Hacker", "email": "hacker@evil.com", "dept": "CSE"}
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("lacks sufficient privileges", resp.json()["detail"])

        # Attempt to update institution geofence config
        resp = client.put(
            "/api/institution/config",
            headers={"Authorization": f"Bearer {self.student_a_token}"},
            json={"allowed_radius_meters": 1000.0}
        )
        self.assertEqual(resp.status_code, 403)

    # 9. Trainer Access Restrictions (Trainer cannot delete student or update institution config)
    def test_09_trainer_access_restrictions(self):
        # Trainer attempting to update institution geofence
        resp = client.put(
            "/api/institution/config",
            headers={"Authorization": f"Bearer {self.trainer_token}"},
            json={"allowed_radius_meters": 1000.0}
        )
        self.assertEqual(resp.status_code, 403)

        # Trainer CAN access risk overview
        resp = client.get(
            "/api/risk/overview",
            headers={"Authorization": f"Bearer {self.trainer_token}"}
        )
        self.assertEqual(resp.status_code, 200)

    # 10. Institution Admin Isolation & Permissions
    def test_10_institution_admin_permissions(self):
        # Admin CAN update institution config
        resp = client.put(
            "/api/institution/config",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"allowed_radius_meters": 55.0}
        )
        self.assertEqual(resp.status_code, 200)

    # 11. Employer Access Restrictions
    def test_11_employer_access_restrictions(self):
        # Employer cannot view student risk list
        resp = client.get(
            "/api/risk/students",
            headers={"Authorization": f"Bearer {self.employer_token}"}
        )
        self.assertEqual(resp.status_code, 403)

        # Employer CAN view public health
        resp = client.get("/api/health")
        self.assertEqual(resp.status_code, 200)

    # 12. NCCT Admin Permissions (National level authority)
    def test_12_ncct_admin_permissions(self):
        resp = client.get(
            "/api/risk/overview",
            headers={"Authorization": f"Bearer {self.ncct_token}"}
        )
        self.assertEqual(resp.status_code, 200)

    # 13. Cross-User Data Access Prevention (Student A cannot view Student B)
    def test_13_cross_user_data_isolation(self):
        # Student A requests Student B's risk profile -> FORBIDDEN 403
        resp = client.get(
            f"/api/risk/student/{self.student_b.student_id}",
            headers={"Authorization": f"Bearer {self.student_a_token}"}
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("permission to access another student", resp.json()["detail"])

        # Student A requests their own risk profile -> Allowed (or 200/generated)
        resp = client.get(
            f"/api/risk/student/{self.student_a.student_id}",
            headers={"Authorization": f"Bearer {self.student_a_token}"}
        )
        self.assertEqual(resp.status_code, 200)

    # 14. Attendance QR Fallback Rejection (Unknown student rejected; User 1 NOT credited)
    def test_14_qr_fallback_rejection(self):
        db = SessionLocal()
        try:
            user_1 = db.query(User).filter_by(id=1).first()
            initial_u1_count = db.query(Attendance).filter_by(user_id=1).count()
        finally:
            db.close()

        # Attempt QR verification for non-existent student ID
        resp = client.post("/api/attendance/qr/verify", json={
            "qr_text": "CS-INVALID-SESSION-TEST",
            "student_id": "GHOST_STUDENT_999999",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "accuracy": 10.0
        })
        # Must NOT succeed or fallback to User 1
        self.assertFalse(resp.json().get("success"))
        
        db = SessionLocal()
        try:
            final_u1_count = db.query(Attendance).filter_by(user_id=1).count()
            self.assertEqual(initial_u1_count, final_u1_count, "Vulnerability Detected: User 1 was credited with ghost attendance!")
        finally:
            db.close()

    # 15. Offline Synchronization Identity Validation (Unknown offline student rejected; User 1 NOT credited)
    def test_15_offline_sync_identity_validation(self):
        db = SessionLocal()
        try:
            initial_u1_count = db.query(Attendance).filter_by(user_id=1).count()
        finally:
            db.close()

        # Send offline sync with unknown student ID
        resp = client.post("/api/attendance/sync-offline", json={
            "records": [
                {
                    "student_id": "UNKNOWN_OFFLINE_STUDENT_007",
                    "student_name": "Ghost Offline Student",
                    "date": "2026-11-04",
                    "time": "12:00:00",
                    "method": "Offline Sync",
                    "confidence": 95.0,
                    "latitude": 28.6139,
                    "longitude": 77.2090,
                    "accuracy": 15.0
                }
            ]
        })
        data = resp.json()
        self.assertEqual(data["synced_count"], 0)
        self.assertEqual(data["results"][0]["status"], "rejected_unknown_student")

        db = SessionLocal()
        try:
            final_u1_count = db.query(Attendance).filter_by(user_id=1).count()
            self.assertEqual(initial_u1_count, final_u1_count, "Vulnerability Detected: User 1 was credited with unverified offline record!")
        finally:
            db.close()

    # 16. CORS Origin Restrictions
    def test_16_cors_origin_restrictions(self):
        # Allowed origin
        resp = client.options("/api/health", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        })
        self.assertEqual(resp.headers.get("access-control-allow-origin"), "http://localhost:5173")

        # Disallowed arbitrary origin
        resp = client.options("/api/health", headers={
            "Origin": "http://evil-unauthorized-site.com",
            "Access-Control-Request-Method": "GET"
        })
        self.assertNotEqual(resp.headers.get("access-control-allow-origin"), "http://evil-unauthorized-site.com")

if __name__ == "__main__":
    unittest.main()

