with open(r'CoopSyncAI\backend\main.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Patch add_student
old_add_student = """@app.post("/api/students/add")
def add_student(req: AddStudentRequest, db: Session = Depends(get_db)):"""

new_add_student = """@app.post("/api/students/add")
def add_student(
    req: AddStudentRequest, 
    current_user: User = Depends(require_role("admin", "ncct_admin")), 
    db: Session = Depends(get_db)
):"""

text = text.replace(old_add_student, new_add_student)

# Also ensure password_hash in add_student is hashed
text = text.replace(
    "password_hash=req.password or \"pass123\",",
    "password_hash=hash_password(req.password or \"pass123\"),"
)

# 2. Patch get_risk_students
old_risk_students = """@app.get("/api/risk/students")
def get_risk_students(
    risk_level: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):"""

new_risk_students = """@app.get("/api/risk/students")
def get_risk_students(
    risk_level: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role("trainer", "admin", "ncct_admin")),
    db: Session = Depends(get_db)
):"""

text = text.replace(old_risk_students, new_risk_students)

# 3. Patch get_student_risk_profile
old_risk_profile = """@app.get("/api/risk/student/{student_id}")
def get_student_risk_profile(student_id: str, db: Session = Depends(get_db)):
    \"\"\"Deep-dive explainable risk report for an individual student\"\"\"
    user = db.query(User).filter(
        (User.student_id == student_id) | (User.id == (int(student_id) if student_id.isdigit() else -1))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")"""

new_risk_profile = """@app.get("/api/risk/student/{student_id}")
def get_student_risk_profile(
    student_id: str, 
    current_user: User = Depends(auth_get_current_user), 
    db: Session = Depends(get_db)
):
    \"\"\"Deep-dive explainable risk report for an individual student\"\"\"
    user = db.query(User).filter(
        (User.student_id == student_id) | (User.id == (int(student_id) if student_id.isdigit() else -1))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    # Task 4 & Task 8: Cross-user data isolation (Student can only view their own risk profile)
    verify_ownership_or_roles(
        current_user, 
        target_student_id=user.student_id, 
        target_user_id=user.id, 
        elevated_roles=["trainer", "admin", "ncct_admin"]
    )"""

text = text.replace(old_risk_profile, new_risk_profile)

with open(r'CoopSyncAI\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Remaining endpoints patched successfully!")
