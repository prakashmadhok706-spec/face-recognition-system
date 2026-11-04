"""
CoopSync AI - Student Performance Prediction & Early Warning System Test Suite
Verifies:
1. Multi-factor Feature Extraction
2. Random Forest Model Training & Stratified 5-Fold Cross-Validation
3. Prediction Explainability & Component Risk Breakdown
4. Actionable Prescriptive Intervention Management
5. Educator Feedback Loop
6. REST API Endpoints End-to-End
"""

import sys
import os
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import (
    SessionLocal, init_db, User, Attendance, Course, Certificate,
    StudentAssessment, StudentRiskPrediction, MLModelMetadata,
    StudentIntervention, PredictionFeedback
)
from risk_engine import risk_engine, StudentRiskEngine, FEATURE_NAMES
from main import app
from fastapi.testclient import TestClient

class TestStudentRiskSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.db = SessionLocal()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_seed_and_feature_extraction(self):
        """Verify assessments are seeded and multidimensional features are extracted"""
        risk_engine.seed_initial_assessments_if_empty(self.db)
        assessments_count = self.db.query(StudentAssessment).count()
        self.assertGreater(assessments_count, 0, "Assessments should be seeded for students.")

        students = self.db.query(User).filter(User.role == "student").all()
        self.assertGreater(len(students), 0, "At least one student should exist in database.")

        for s in students:
            feats = risk_engine.extract_student_features(s, self.db)
            self.assertIn("attendance_pct", feats)
            self.assertIn("assessment_avg", feats)
            self.assertIn("course_completion_pct", feats)
            self.assertIn("placement_readiness", feats)
            self.assertIn("learning_activity_score", feats)
            self.assertTrue(0.0 <= feats["attendance_pct"] <= 100.0)
            self.assertTrue(0.0 <= feats["assessment_avg"] <= 100.0)

    def test_02_model_training_and_evaluation(self):
        """Train Random Forest classifier, verify Stratified 5-Fold CV and evaluation metrics"""
        res = risk_engine.train_model(self.db, model_type="RandomForestClassifier")
        self.assertTrue(res["success"])
        meta = res["metadata"]

        self.assertEqual(meta["model_type"], "RandomForestClassifier")
        self.assertIn("f1_score", meta)
        self.assertIn("precision_score", meta)
        self.assertIn("recall_score", meta)
        self.assertIn("cv_mean_f1", meta)
        self.assertIn("confusion_matrix", meta)
        self.assertIn("feature_importances", meta)

        # Check confusion matrix dimensions (3x3 for Low, Med, High risk)
        cm = meta["confusion_matrix"]
        self.assertEqual(len(cm), 3)
        self.assertEqual(len(cm[0]), 3)

        # Verify all features have non-negative importances
        for feat in FEATURE_NAMES:
            self.assertIn(feat, meta["feature_importances"])
            self.assertGreaterEqual(meta["feature_importances"][feat], 0.0)

    def test_03_prediction_and_explainability(self):
        """Verify student risk computation provides clear local explainability and action plan"""
        students = self.db.query(User).filter(User.role == "student").all()
        first_student = students[0]

        pred = risk_engine.compute_student_risk(first_student, self.db)
        self.assertIn(pred["risk_level"], ["Low Risk", "Medium Risk", "High Risk"])
        self.assertTrue(0.0 <= pred["risk_score"] <= 100.0)

        # Check explainability factors
        exp = pred["explainability"]
        self.assertIn("attendance", exp)
        self.assertIn("academic", exp)
        self.assertIn("course_completion", exp)
        self.assertIn("skills", exp)
        self.assertIn("placement_readiness", exp)

        for factor, data in exp.items():
            self.assertIn("value", data)
            self.assertIn("threshold", data)
            self.assertIn("component_risk", data)
            self.assertIn("status", data)

        # Check prescriptive recommendations
        self.assertIsInstance(pred["recommendations"], list)
        self.assertGreater(len(pred["recommendations"]), 0)

    def test_04_batch_prediction_persistence(self):
        """Verify batch prediction saves to database properly"""
        preds = risk_engine.predict_and_save_all(self.db)
        self.assertGreater(len(preds), 0)

        saved = self.db.query(StudentRiskPrediction).all()
        self.assertEqual(len(preds), len(saved))

    def test_05_api_endpoints(self):
        """Verify all FastAPI risk endpoints respond with 200 OK and valid schemas"""
        # 1. Overview
        r1 = self.client.get("/api/risk/overview")
        self.assertEqual(r1.status_code, 200)
        d1 = r1.json()
        self.assertIn("total_students", d1)
        self.assertIn("high_risk_count", d1)
        self.assertIn("department_distribution", d1)

        # 2. Students list
        r2 = self.client.get("/api/risk/students")
        self.assertEqual(r2.status_code, 200)
        st_list = r2.json()
        self.assertIsInstance(st_list, list)
        self.assertGreater(len(st_list), 0)

        # 3. Single student detail
        test_sid = st_list[0]["student_id"]
        r3 = self.client.get(f"/api/risk/student/{test_sid}")
        self.assertEqual(r3.status_code, 200)
        d3 = r3.json()
        self.assertTrue(d3["success"])
        self.assertIn("risk_profile", d3)
        self.assertIn("assessments", d3)

        # 4. Interventions lifecycle: Create -> Get -> Update
        r4 = self.client.post("/api/risk/interventions", json={
            "student_id": test_sid,
            "risk_level": "High Risk",
            "intervention_type": "Remedial Class",
            "title": "DSA Binary Search & Recursion Intensive Tutorial",
            "notes": "Student struggling with divide-and-conquer assignments.",
            "action_taken": "Assigned weekly 1-on-1 TA hours.",
            "assigned_trainer_name": "Dr. Arvind Subramanian",
            "follow_up_date": "2026-11-20"
        })
        self.assertEqual(r4.status_code, 200)
        inv_id = r4.json()["intervention_id"]

        r5 = self.client.put(f"/api/risk/interventions/{inv_id}", json={
            "status": "Completed",
            "outcome_notes": "Student scored 88% on make-up quiz."
        })
        self.assertEqual(r5.status_code, 200)
        self.assertEqual(r5.json()["status"], "Completed")

        # 5. Model Metrics
        r6 = self.client.get("/api/risk/model/metrics")
        self.assertEqual(r6.status_code, 200)
        d6 = r6.json()
        self.assertTrue(d6["success"])
        self.assertIn("confusion_matrix", d6["model_metadata"])

        # 6. Educator Feedback
        r7 = self.client.post("/api/risk/feedback", json={
            "prediction_id": st_list[0]["id"],
            "user_id": st_list[0]["user_id"],
            "reviewer_name": "Prof. Rajesh Sharma",
            "reviewer_role": "trainer",
            "actual_risk_status": "Accurate Risk",
            "comments": "Confirmed through classroom observation."
        })
        self.assertEqual(r7.status_code, 200)
        self.assertTrue(r7.json()["success"])

if __name__ == "__main__":
    unittest.main()

