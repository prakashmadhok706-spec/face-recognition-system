"""
Phase 2 Database Architecture, Data Integrity, and LMS Integration Tests
CoopSync AI - Smart India Hackathon 2026 (Problem Statement SIH26087)
"""

import unittest
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from main import app
from database import SessionLocal, User, Course, CourseEnrollment, CourseModuleProgress, Certificate, Job, JobApplication
from auth.security import hash_password
from auth.jwt_handler import create_access_token


class TestCoopSyncPhase2Integration(unittest.TestCase):
    test_cert_id = None

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        db = SessionLocal()
        try:
            # Seed test student
            cls.student = db.query(User).filter(User.email == "lms_test_student@coopsync.edu").first()
            if not cls.student:
                cls.student = User(
                    student_id="LMS_STU_001",
                    name="Aaditya Sharma",
                    email="lms_test_student@coopsync.edu",
                    password_hash=hash_password("password123"),
                    role="student",
                    department="Computer Science & Engineering"
                )
                db.add(cls.student)
                db.commit()
                db.refresh(cls.student)

            # Seed second test student (for unauthorized cross-student checks)
            cls.student2 = db.query(User).filter(User.email == "lms_test_student2@coopsync.edu").first()
            if not cls.student2:
                cls.student2 = User(
                    student_id="LMS_STU_002",
                    name="Kavita Rao",
                    email="lms_test_student2@coopsync.edu",
                    password_hash=hash_password("password123"),
                    role="student",
                    department="Agricultural Cooperative Management"
                )
                db.add(cls.student2)
                db.commit()
                db.refresh(cls.student2)

            # Seed admin
            cls.admin = db.query(User).filter(User.email == "lms_test_admin@coopsync.edu").first()
            if not cls.admin:
                cls.admin = User(
                    student_id="LMS_ADM_001",
                    name="Admin Sharma",
                    email="lms_test_admin@coopsync.edu",
                    password_hash=hash_password("adminpass123"),
                    role="admin",
                    department="NCCT Administration"
                )
                db.add(cls.admin)
                db.commit()
                db.refresh(cls.admin)

            # Seed test course
            cls.course = db.query(Course).filter(Course.title == "Cooperative Management & Governance").first()
            if not cls.course:
                cls.course = Course(
                    title="Cooperative Management & Governance",
                    category="Governance & Law",
                    trainer_name="Dr. Arvind V. Sharma",
                    duration="6 Weeks",
                    modules_count=5,
                    enrolled_count=0,
                    description="Study of cooperative society frameworks and MSCS Act 2002."
                )
                db.add(cls.course)
                db.commit()
                db.refresh(cls.course)

            # Clean any old test records for this student and course
            db.query(Certificate).filter(Certificate.user_id == cls.student.id).delete()
            db.query(CourseEnrollment).filter(
                CourseEnrollment.student_id == cls.student.id,
                CourseEnrollment.course_id == cls.course.id
            ).delete()
            db.commit()

            cls.student_id_val = cls.student.id
            cls.student_code = cls.student.student_id
            cls.student_name = cls.student.name

            cls.student2_id_val = cls.student2.id
            cls.student2_code = cls.student2.student_id
            cls.student2_name = cls.student2.name

            cls.admin_id_val = cls.admin.id
            cls.course_id_val = cls.course.id
            cls.course_title_val = cls.course.title

            # Generate JWT tokens
            cls.student_token = create_access_token(user_id=cls.student.id, role="student", email=cls.student.email, student_id=cls.student.student_id)
            cls.student2_token = create_access_token(user_id=cls.student2.id, role="student", email=cls.student2.email, student_id=cls.student2.student_id)
            cls.admin_token = create_access_token(user_id=cls.admin.id, role="admin", email=cls.admin.email, student_id=cls.admin.student_id)

            cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}
            cls.student2_headers = {"Authorization": f"Bearer {cls.student2_token}"}
            cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        finally:
            db.close()

    def test_01_sqlite_pragmas_enforced(self):
        """Verify SQLite PRAGMAs: foreign_keys=1, journal_mode=wal, busy_timeout=5000."""
        from database import engine
        with engine.connect() as conn:
            fk = conn.execute(text("PRAGMA foreign_keys;")).scalar()
            journal = conn.execute(text("PRAGMA journal_mode;")).scalar()
            timeout = conn.execute(text("PRAGMA busy_timeout;")).scalar()
            self.assertEqual(fk, 1, "Foreign keys must be enabled (PRAGMA foreign_keys=1)")
            self.assertIn(str(journal).lower(), ["wal", "memory"], "WAL journal mode expected")
            self.assertGreaterEqual(timeout, 5000, "Busy timeout should be at least 5000ms")

    def test_02_course_enrollment_creation(self):
        """Student enrolls in a course; 5 module progress records are created."""
        resp = self.client.post(
            f"/api/courses/{self.course_id_val}/enroll",
            headers=self.student_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["enrollment"]["status"], "Enrolled")
        self.assertEqual(data["enrollment"]["progress_percentage"], 0.0)
        self.assertEqual(data["enrollment"]["total_modules"], 5)

        # Verify DB records
        db = SessionLocal()
        try:
            enrollment = db.query(CourseEnrollment).filter(
                CourseEnrollment.student_id == self.student_id_val,
                CourseEnrollment.course_id == self.course_id_val
            ).first()
            self.assertIsNotNone(enrollment)
            modules = db.query(CourseModuleProgress).filter(
                CourseModuleProgress.enrollment_id == enrollment.id
            ).all()
            self.assertEqual(len(modules), 5, "Exactly 5 modules must be seeded for this course")
        finally:
            db.close()

    def test_03_course_enrollment_idempotent_no_duplicates(self):
        """Attempting to enroll again returns existing enrollment without duplicate DB rows."""
        resp = self.client.post(
            f"/api/courses/{self.course_id_val}/enroll",
            headers=self.student_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("already enrolled", data["message"].lower())

        db = SessionLocal()
        try:
            count = db.query(CourseEnrollment).filter(
                CourseEnrollment.student_id == self.student_id_val,
                CourseEnrollment.course_id == self.course_id_val
            ).count()
            self.assertEqual(count, 1, "Duplicate enrollments must not exist")
        finally:
            db.close()

    def test_04_get_my_enrollments_and_course_progress(self):
        """Student fetches their enrollments and checks module progress list."""
        resp = self.client.get("/api/students/me/enrollments", headers=self.student_headers)
        self.assertEqual(resp.status_code, 200)
        enrollments = resp.json()
        self.assertIsInstance(enrollments, list)
        self.assertGreaterEqual(len(enrollments), 1)
        self.assertEqual(enrollments[0]["course_title"], self.course_title_val)

        # Course progress
        prog_resp = self.client.get(f"/api/courses/{self.course_id_val}/progress", headers=self.student_headers)
        self.assertEqual(prog_resp.status_code, 200)
        prog_data = prog_resp.json()
        self.assertEqual(len(prog_data["modules"]), 5)
        self.assertFalse(prog_data["modules"][0]["is_completed"])

    def test_05_module_progress_calculation(self):
        """Marking modules as completed updates progress_percentage and status accurately."""
        # Complete module 1 (1/5 = 20%)
        resp1 = self.client.put(
            f"/api/courses/{self.course_id_val}/modules/1/progress",
            json={"is_completed": True, "time_spent_minutes": 25},
            headers=self.student_headers
        )
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.json()
        self.assertEqual(data1["progress_percentage"], 20.0)
        self.assertEqual(data1["completed_modules"], 1)
        self.assertEqual(data1["enrollment_status"], "In Progress")

        # Complete module 2 (2/5 = 40%)
        resp2 = self.client.put(
            f"/api/courses/{self.course_id_val}/modules/2/progress",
            json={"is_completed": True, "time_spent_minutes": 35},
            headers=self.student_headers
        )
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertEqual(data2["progress_percentage"], 40.0)
        self.assertEqual(data2["completed_modules"], 2)

    def test_06_certificate_gating_blocks_incomplete_course(self):
        """Student cannot generate certificate when course is incomplete (only 40% done)."""
        resp = self.client.post(
            "/api/certificates/generate",
            json={"student_name": self.student_name, "course_title": self.course_title_val},
            headers=self.student_headers
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Complete all modules first", resp.json()["detail"])

    def test_07_course_completion_and_certificate_issuance(self):
        """Completing all modules reaches 100% and unlocks digital certificate issuance."""
        # Complete remaining modules 3, 4, 5
        for m_id in [3, 4, 5]:
            self.client.put(
                f"/api/courses/{self.course_id_val}/modules/{m_id}/progress",
                json={"is_completed": True, "time_spent_minutes": 30},
                headers=self.student_headers
            )

        # Verify course can now be formally completed
        comp_resp = self.client.post(
            f"/api/courses/{self.course_id_val}/complete",
            headers=self.student_headers
        )
        self.assertEqual(comp_resp.status_code, 200)
        comp_data = comp_resp.json()
        self.assertEqual(comp_data["progress_percentage"], 100.0)
        self.assertEqual(comp_data["status"], "Completed")

        # Now certificate generation succeeds
        cert_resp = self.client.post(
            "/api/certificates/generate",
            json={"student_name": self.student_name, "course_title": self.course_title_val},
            headers=self.student_headers
        )
        self.assertEqual(cert_resp.status_code, 200)
        cert_data = cert_resp.json()
        self.assertTrue(cert_data["success"])
        self.assertIn("CS-", cert_data["certificate_id"])

        db = SessionLocal()
        try:
            cert = db.query(Certificate).filter(
                Certificate.certificate_no == cert_data["certificate_id"]
            ).first()
            self.assertIsNotNone(cert)
            self.assertEqual(cert.user_id, self.student_id_val)
            self.assertEqual(cert.course_id, self.course_id_val)
            self.assertEqual(cert.status, "Valid")
        finally:
            db.close()

        TestCoopSyncPhase2Integration.test_cert_id = cert_data["certificate_id"]

    def test_08_public_certificate_verification_and_revocation(self):
        """Public certificate verification validates DB record; revocation invalidates it."""
        cert_id = TestCoopSyncPhase2Integration.test_cert_id
        self.assertIsNotNone(cert_id, "Certificate must have been generated in test_07")

        # 1. Valid certificate verification
        verify_resp = self.client.get(f"/api/certificates/verify/{cert_id}")
        self.assertEqual(verify_resp.status_code, 200)
        v_data = verify_resp.json()
        self.assertTrue(v_data["valid"])
        self.assertEqual(v_data["student_name"], self.student_name)
        self.assertEqual(v_data["course"], self.course_title_val)

        # 2. Fake / non-existent certificate returns invalid (no Puneet mock bypass!)
        fake_resp = self.client.get("/api/certificates/verify/FAKE-CERT-99999999")
        self.assertEqual(fake_resp.status_code, 200)
        self.assertFalse(fake_resp.json()["valid"])
        self.assertIn("Invalid or Non-existent", fake_resp.json()["status"])

        # 3. Admin revokes the valid certificate
        revoke_resp = self.client.post(
            f"/api/certificates/{cert_id}/revoke",
            json={"reason": "Violation of academic honesty policies"},
            headers=self.admin_headers
        )
        self.assertEqual(revoke_resp.status_code, 200)
        self.assertEqual(revoke_resp.json()["status"], "Revoked")

        # 4. Public verification now returns valid=False with Revoked status
        verify_after_revoke = self.client.get(f"/api/certificates/verify/{cert_id}")
        self.assertEqual(verify_after_revoke.status_code, 200)
        rev_data = verify_after_revoke.json()
        self.assertFalse(rev_data["valid"])
        self.assertEqual(rev_data["status"], "Revoked Credential")
        self.assertIn("Violation", rev_data["revoked_reason"])

    def test_09_database_foreign_key_enforcement(self):
        """Inserting a record with a non-existent foreign key raises IntegrityError."""
        fake_db = SessionLocal()
        try:
            # Non-existent student_id = 9999999
            orphan_enrollment = CourseEnrollment(
                student_id=9999999,
                course_id=self.course_id_val,
                enrollment_status="Enrolled"
            )
            fake_db.add(orphan_enrollment)
            with self.assertRaises(IntegrityError):
                fake_db.commit()
        finally:
            fake_db.rollback()
            fake_db.close()

    def test_10_database_cascade_deletion(self):
        """Deleting a student user cascades and cleans up enrollments and module progress."""
        cascade_db = SessionLocal()
        try:
            temp_user = User(
                student_id="TEMP_DEL_999",
                name="Temporary Student",
                email="temp_del_999@test.edu",
                password_hash=hash_password("testpass123"),
                role="student"
            )
            cascade_db.add(temp_user)
            cascade_db.commit()
            cascade_db.refresh(temp_user)

            temp_enr = CourseEnrollment(
                student_id=temp_user.id,
                course_id=self.course_id_val,
                enrollment_status="Enrolled"
            )
            cascade_db.add(temp_enr)
            cascade_db.commit()
            cascade_db.refresh(temp_enr)

            temp_mod = CourseModuleProgress(
                enrollment_id=temp_enr.id,
                module_id=1,
                module_title="Temp Module"
            )
            cascade_db.add(temp_mod)
            cascade_db.commit()

            enr_id = temp_enr.id
            mod_id = temp_mod.id

            # Delete the user
            cascade_db.delete(temp_user)
            cascade_db.commit()

            # Confirm cascade deletion of enrollment and module progress
            self.assertIsNone(cascade_db.query(CourseEnrollment).filter_by(id=enr_id).first())
            self.assertIsNone(cascade_db.query(CourseModuleProgress).filter_by(id=mod_id).first())
        finally:
            cascade_db.close()

    def test_11_offline_sync_student_isolation(self):
        """Student cannot submit offline attendance for another student."""
        # Student 1 attempts to submit offline attendance for Student 2
        resp = self.client.post(
            "/api/attendance/sync-offline",
            json={
                "records": [
                    {
                        "student_id": self.student2_code,
                        "student_name": self.student2_name,
                        "date": "2026-11-04",
                        "time": "10:00:00",
                        "method": "Offline Sync",
                        "confidence": 98.0,
                        "latitude": 28.6139,
                        "longitude": 77.2090,
                        "accuracy": 10.0
                    }
                ]
            },
            headers=self.student_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Record must be rejected due to unauthorized cross-student attempt
        self.assertEqual(data["synced_count"], 0)
        self.assertEqual(data["results"][0]["status"], "rejected_unauthorized")

    def test_12_learning_progress_aggregate_endpoint(self):
        """GET /api/students/me/learning-progress returns valid aggregated stats."""
        resp = self.client.get(
            "/api/students/me/learning-progress",
            headers=self.student_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["student_name"], self.student_name)
        self.assertGreaterEqual(data["total_courses_enrolled"], 1)
        self.assertIn("completed_courses", data)
        self.assertIn("average_progress_percentage", data)


if __name__ == "__main__":
    unittest.main()
