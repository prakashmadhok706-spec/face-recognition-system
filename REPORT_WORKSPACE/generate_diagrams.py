"""
CoopSync AI - Academic Diagram Generator
Generates high-resolution academic diagrams for Mini Project Report:
- Fig 4.1: Factored Use Case Diagram
- Fig 5.1: Class Architecture Diagram
- Fig 5.2: Sequence Diagram (Biometric Attendance)
- Fig 5.3: Activity Diagram (Background Model Retraining)
- Fig 5.4: Level-1 Data Flow Diagram (DFD)
- Fig 5.5: Entity-Relationship (E-R) Diagram
- Fig 5.6: Gantt Chart and PERT Network Diagram
- Fig 7.8: UI Layout and Web Architecture Blueprint
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

FIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FIGURES")
os.makedirs(FIG_DIR, exist_ok=True)

def generate_use_case():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.2)
    ax.axis('off')

    rect = patches.FancyBboxPatch((2.2, 0.3), 5.6, 5.4, boxstyle='round,pad=0.2', ec='#1e3a8a', fc='#f8fafc', lw=2)
    ax.add_patch(rect)
    ax.text(5.0, 5.4, 'CoopSync AI System Boundary', ha='center', fontsize=11, fontweight='bold', color='#1e3a8a')

    # Actors
    actors = [
        ('Student / Enrollee', 1.0, 4.4),
        ('Trainer / Faculty', 1.0, 2.0),
        ('System Administrator', 9.0, 4.4),
        ('Apex Admin / Employer', 9.0, 2.0)
    ]
    for name, x, y in actors:
        ax.plot(x, y+0.3, 'o', ms=14, color='#0f172a', mfc='#e2e8f0', mew=2)
        ax.plot([x, x], [y+0.15, y-0.15], color='#0f172a', lw=2)
        ax.plot([x-0.25, x+0.25], [y+0.05, y+0.05], color='#0f172a', lw=2)
        ax.plot([x, x-0.2], [y-0.15, y-0.4], color='#0f172a', lw=2)
        ax.plot([x, x+0.2], [y-0.15, y-0.4], color='#0f172a', lw=2)
        ax.text(x, y-0.6, name, ha='center', fontsize=8, fontweight='bold')

    use_cases = [
        ('Biometric Attendance\n(Face Scanning)', 5.0, 4.6),
        ('<<include>> Anti-Spoof Liveness', 3.7, 3.8),
        ('<<include>> Duplicate Suppression', 6.3, 3.8),
        ('30-sec Rotating QR Attendance', 5.0, 3.0),
        ('Student ERP & Skills Registry', 3.7, 2.2),
        ('Asynchronous Model Retraining', 6.3, 2.2),
        ('Digital PDF Certificate Verification', 3.8, 1.2),
        ('Cooperative Employment Matching', 6.2, 1.2),
    ]

    for text, x, y in use_cases:
        is_inc = 'include' in text
        fc = '#fef3c7' if is_inc else '#dbeafe'
        ec = '#b45309' if is_inc else '#1d4ed8'
        ellipse = patches.Ellipse((x, y), 2.2, 0.58, ec=ec, fc=fc, lw=1.5)
        ax.add_patch(ellipse)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.5, fontweight='bold' if not is_inc else 'normal', color='#0f172a')

    # Association lines
    ax.plot([1.2, 3.9], [4.4, 4.6], color='#64748b', lw=1.5, ls='--')
    ax.plot([1.2, 3.9], [4.2, 3.0], color='#64748b', lw=1.5, ls='--')
    ax.plot([1.2, 2.6], [4.0, 2.2], color='#64748b', lw=1.5, ls='--')
    ax.plot([1.2, 2.7], [2.0, 1.2], color='#64748b', lw=1.5, ls='--')
    ax.plot([8.8, 7.4], [4.4, 2.2], color='#64748b', lw=1.5, ls='--')
    ax.plot([8.8, 7.3], [2.0, 1.2], color='#64748b', lw=1.5, ls='--')

    path = os.path.join(FIG_DIR, "fig4_1_use_case.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_class_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis('off')

    classes = [
        ("User", 0.5, 4.2, 2.6, 2.0,
         ["+ id: Integer [PK]", "+ name: String", "+ email: String", "+ role: RoleEnum", "+ password_hash: String"],
         ["+ verify_password()", "+ get_permissions()"]),
        ("StudentProfile", 3.7, 4.2, 2.8, 2.0,
         ["+ student_id: String", "+ roll_no: String [UQ]", "+ department: String", "+ semester: Integer", "+ tech_stack: List[str]"],
         ["+ update_skills()", "+ get_attendance_ratio()"]),
        ("AttendanceRecord", 7.0, 4.2, 2.6, 2.0,
         ["+ id: Integer [PK]", "+ student_id: String [FK]", "+ date: Date", "+ timestamp: DateTime", "+ status: StatusEnum", "+ method: MethodEnum"],
         ["+ mark_attendance()", "+ is_duplicate()"]),
        ("FaceEngine", 0.5, 0.6, 2.8, 2.2,
         ["- cascade: CascadeClassifier", "- recognizer: LBPHFaceRecognizer", "- min_blur_var: Float = 65.0", "- conf_threshold: Float = 68.0"],
         ["+ detect_faces(img)", "+ check_liveness(img)", "+ recognize_face(crop)", "+ train_model(samples)"]),
        ("ModelTrainer", 3.8, 0.6, 2.8, 2.2,
         ["- state: RetrainStateDict", "- worker_lock: Lock", "- classifier_path: Path", "- backup_path: Path"],
         ["+ trigger_retraining()", "+ get_status()", "+ _run_training_worker()", "+ _atomic_swap()"]),
        ("CertificateManager", 7.0, 0.6, 2.6, 2.2,
         ["- template_path: Path", "- font_name: Helvetica", "- qr_base_url: String"],
         ["+ generate_pdf(cert_data)", "+ embed_qr_code(canvas)", "+ verify_hash(cert_id)"])
    ]

    for title, x, y, w, h, attrs, methods in classes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.05', ec='#1e293b', fc='#ffffff', lw=1.5)
        ax.add_patch(rect)
        hdr = patches.Rectangle((x, y+h-0.45), w, 0.45, ec='#1e293b', fc='#0284c7', lw=1.5)
        ax.add_patch(hdr)
        ax.text(x+w/2, y+h-0.25, title, ha='center', va='center', fontsize=9, fontweight='bold', color='#ffffff')

        sep1_y = y+h - 0.45 - (len(attrs)*0.22) - 0.05
        cur_y = y+h - 0.65
        for a in attrs:
            ax.text(x+0.1, cur_y, a, fontsize=7.2, color='#0f172a', family='monospace')
            cur_y -= 0.22

        ax.plot([x, x+w], [sep1_y, sep1_y], color='#94a3b8', lw=1)
        cur_y = sep1_y - 0.2
        for m in methods:
            ax.text(x+0.1, cur_y, m, fontsize=7.2, color='#0369a1', family='monospace')
            cur_y -= 0.22

    # Associations
    ax.annotate("", xy=(3.7, 5.2), xytext=(3.1, 5.2), arrowprops=dict(arrowstyle="->", lw=1.5, color='#334155'))
    ax.annotate("", xy=(7.0, 5.2), xytext=(6.5, 5.2), arrowprops=dict(arrowstyle="->", lw=1.5, color='#334155'))
    ax.annotate("", xy=(3.8, 1.7), xytext=(3.3, 1.7), arrowprops=dict(arrowstyle="<->", lw=1.5, color='#334155', ls='--'))

    path = os.path.join(FIG_DIR, "fig5_1_class_diagram.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_sequence_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.2)
    ax.axis('off')

    cols = [
        ("Client Webcam\n(React View)", 1.2),
        ("FastAPI Server\n(/api/attendance)", 3.6),
        ("FaceEngine\n(OpenCV / LBPH)", 6.0),
        ("SQLite Database\n(WAL Mode)", 8.5)
    ]

    for label, x in cols:
        box = patches.FancyBboxPatch((x-0.9, 5.3), 1.8, 0.65, boxstyle='round,pad=0.08', ec='#1e3a8a', fc='#dbeafe', lw=1.5)
        ax.add_patch(box)
        ax.text(x, 5.62, label, ha='center', va='center', fontsize=8, fontweight='bold', color='#1e3a8a')
        ax.plot([x, x], [5.3, 0.4], color='#94a3b8', lw=1.5, ls=':')

    messages = [
        (4.8, 1.2, 3.6, "1. POST /api/attendance/face-recognize (Base64 JPEG)", False),
        (4.2, 3.6, 6.0, "2. detect_face() + check_liveness(frame)", False),
        (3.6, 6.0, 6.0, "3. Laplacian variance >= 65.0 (Passed)", True),
        (3.0, 6.0, 6.0, "4. LBPH confidence <= 68.0 (Student Recognized)", True),
        (2.4, 6.0, 3.6, "5. Return {student_id, roll_no, confidence}", False),
        (1.8, 3.6, 8.5, "6. INSERT INTO attendance (user_id, date, timestamp)", False),
        (1.2, 8.5, 3.6, "7. Attendance row persisted successfully", False),
        (0.6, 3.6, 1.2, "8. 200 OK {success: true, name, roll, confidence}", False)
    ]

    for y, x1, x2, text, self_call in messages:
        if self_call:
            ax.annotate("", xy=(x1, y-0.25), xytext=(x1+0.4, y-0.12), arrowprops=dict(arrowstyle="->", lw=1.2, color='#0284c7'))
            ax.plot([x1, x1+0.4], [y, y], color='#0284c7', lw=1.2)
            ax.plot([x1+0.4, x1+0.4], [y, y-0.12], color='#0284c7', lw=1.2)
            ax.text(x1+0.5, y-0.1, text, va='center', fontsize=7.5, color='#0369a1', fontweight='bold')
        else:
            is_return = x1 > x2
            ls = '--' if is_return else '-'
            color = '#047857' if is_return else '#1e293b'
            ax.annotate("", xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle="->", lw=1.4, color=color, ls=ls))
            ax.text((x1+x2)/2, y+0.12, text, ha='center', fontsize=7.3, color=color, fontweight='bold')

    path = os.path.join(FIG_DIR, "fig5_2_sequence_diagram.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_activity_diagram():
    fig, ax = plt.subplots(figsize=(9, 6.5), dpi=300)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 6.5)
    ax.axis('off')

    steps = [
        (4.5, 6.0, "Start Retrain Request\n(Admin triggers POST /api/model/retrain)", "start"),
        (4.5, 5.0, "Check worker_lock status\nIs retraining already active?", "decision"),
        (4.5, 4.0, "Set status = 'queued'\nSpawn asynchronous background Thread", "process"),
        (4.5, 3.0, "Scan data/faces/ directory\nLoad grayscale face crops & integer labels", "process"),
        (4.5, 2.0, "Execute cv2.face.LBPHFaceRecognizer.train()\nCompute histogram models for all labels", "process"),
        (4.5, 1.0, "Atomic Model Swap:\nSave to classifier.xml.tmp -> rename to classifier.xml", "process"),
        (4.5, 0.2, "Update status = 'completed', progress = 100%\nHot-reload new model into active memory", "end")
    ]

    for x, y, text, stype in steps:
        if stype == "start":
            c = patches.Circle((x, y), 0.2, ec='#15803d', fc='#22c55e', lw=2)
            ax.add_patch(c)
            ax.text(x+0.4, y, text, va='center', fontsize=8, fontweight='bold')
            ax.annotate("", xy=(x, y-0.6), xytext=(x, y-0.2), arrowprops=dict(arrowstyle="->", lw=1.5, color='#334155'))
        elif stype == "decision":
            d = patches.Polygon([[x, y+0.3], [x+1.5, y], [x, y-0.3], [x-1.5, y]], ec='#b45309', fc='#fef3c7', lw=1.5)
            ax.add_patch(d)
            ax.text(x, y, text, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#78350f')
            ax.annotate("", xy=(x, y-0.65), xytext=(x, y-0.3), arrowprops=dict(arrowstyle="->", lw=1.5, color='#334155'))
            ax.text(x+0.1, y-0.45, "No (Available)", fontsize=7, color='#15803d', fontweight='bold')
            # Alternate branch
            ax.plot([x+1.5, x+2.6, x+2.6], [y, y, y-0.8], color='#dc2626', lw=1.2, ls='--')
            ax.annotate("", xy=(x+2.6, y-0.8), xytext=(x+2.6, y-0.5), arrowprops=dict(arrowstyle="->", lw=1.2, color='#dc2626'))
            ax.text(x+1.6, y+0.1, "Yes (Busy)", fontsize=7, color='#dc2626', fontweight='bold')
            ax.text(x+2.6, y-1.0, "Return 409\nConflict error", ha='center', fontsize=6.8, color='#dc2626')
        elif stype == "process":
            p = patches.FancyBboxPatch((x-2.2, y-0.25), 4.4, 0.5, boxstyle='round,pad=0.08', ec='#1e40af', fc='#eff6ff', lw=1.5)
            ax.add_patch(p)
            ax.text(x, y, text, ha='center', va='center', fontsize=7.5, color='#1e3a8a', fontweight='bold')
            ax.annotate("", xy=(x, y-0.65), xytext=(x, y-0.25), arrowprops=dict(arrowstyle="->", lw=1.5, color='#334155'))
        elif stype == "end":
            p = patches.FancyBboxPatch((x-2.2, y-0.2), 4.4, 0.45, boxstyle='round,pad=0.08', ec='#047857', fc='#ecfdf5', lw=1.5)
            ax.add_patch(p)
            ax.text(x, y, text, ha='center', va='center', fontsize=7.5, color='#047857', fontweight='bold')

    path = os.path.join(FIG_DIR, "fig5_3_activity_diagram.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_dfd():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.2)
    ax.axis('off')

    entities = [
        ("Student / User", 0.8, 4.8),
        ("Institution Admin", 0.8, 1.4),
        ("Cooperative Employer", 9.0, 3.2)
    ]
    for name, x, y in entities:
        box = patches.Rectangle((x-0.7, y-0.35), 1.5, 0.7, ec='#0f172a', fc='#f1f5f9', lw=1.8)
        ax.add_patch(box)
        ax.text(x+0.05, y, name, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')

    processes = [
        ("1.0\nFace Verification\n& Attendance", 3.5, 4.8),
        ("2.0\nModel Retrain\nPipeline", 3.5, 2.8),
        ("3.0\nStudent ERP\n& Skill Profile", 6.2, 4.8),
        ("4.0\nEmployment\nJob Matching", 6.2, 2.8),
    ]
    for label, x, y in processes:
        circ = patches.Circle((x, y), 0.75, ec='#1e40af', fc='#dbeafe', lw=1.8)
        ax.add_patch(circ)
        ax.text(x, y, label, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#1e3a8a')

    datastores = [
        ("D1: Users & Student Profiles", 4.8, 5.8),
        ("D2: Attendance Log (WAL Mode)", 4.8, 4.0),
        ("D3: Trained LBPH Classifier (XML)", 3.5, 1.2),
        ("D4: Cooperative Job Postings", 6.2, 1.2)
    ]
    for label, x, y in datastores:
        rect = patches.Rectangle((x-1.3, y-0.22), 2.6, 0.44, ec='#334155', fc='#ffffff', lw=1.2)
        ax.add_patch(rect)
        ax.plot([x-1.3, x-1.3], [y-0.22, y+0.22], color='#334155', lw=2)
        ax.plot([x+1.3, x+1.3], [y-0.22, y+0.22], color='#334155', lw=2)
        ax.text(x, y, label, ha='center', va='center', fontsize=6.8, fontweight='bold', color='#334155')

    # Data flows
    flows = [
        (1.5, 4.8, 2.75, 4.8, "Webcam Frame"),
        (4.25, 4.8, 5.45, 4.8, "Verified ID"),
        (6.95, 4.8, 8.3, 3.4, "Profile Sync"),
        (1.5, 1.4, 2.75, 2.8, "Retrain Request"),
        (3.5, 2.05, 3.5, 1.42, "classifier.xml"),
        (6.2, 2.05, 6.2, 1.42, "Job Match Query")
    ]
    for x1, y1, x2, y2, label in flows:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", lw=1.3, color='#0284c7'))
        ax.text((x1+x2)/2, (y1+y2)/2 + 0.15, label, ha='center', fontsize=6.5, color='#0369a1', fontweight='bold')

    path = os.path.join(FIG_DIR, "fig5_4_dfd.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis('off')

    entities = [
        ("USERS", 1.8, 5.0, ["id (PK)", "name", "email", "role", "is_active"]),
        ("STUDENTS", 5.0, 5.0, ["id (PK)", "user_id (FK)", "roll_no [UQ]", "department", "tech_stack"]),
        ("ATTENDANCE", 8.2, 5.0, ["id (PK)", "user_id (FK)", "date", "timestamp", "status", "method"]),
        ("CERTIFICATES", 1.8, 1.8, ["id (PK)", "student_id (FK)", "course_name", "grade", "issue_date", "qr_hash"]),
        ("JOBS", 5.0, 1.8, ["id (PK)", "title", "coop_federation", "required_skills", "salary_range"]),
        ("SYNC_QUEUE", 8.2, 1.8, ["id (PK)", "client_tx_id", "payload_json", "status", "synced_at"])
    ]

    for title, x, y, fields in entities:
        w, h = 2.4, 1.8
        rect = patches.FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle='round,pad=0.05', ec='#1e293b', fc='#ffffff', lw=1.5)
        ax.add_patch(rect)
        hdr = patches.Rectangle((x-w/2, y+h/2-0.38), w, 0.38, ec='#1e293b', fc='#1e40af', lw=1.5)
        ax.add_patch(hdr)
        ax.text(x, y+h/2-0.19, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')

        cur_y = y+h/2 - 0.55
        for f in fields:
            is_pk = '(PK)' in f
            is_fk = '(FK)' in f
            col = '#b91c1c' if is_pk else ('#0369a1' if is_fk else '#334155')
            ax.text(x-w/2+0.12, cur_y, f, fontsize=7.2, color=col, family='monospace', fontweight='bold' if is_pk else 'normal')
            cur_y -= 0.22

    # Cardinality lines
    ax.plot([3.0, 3.8], [5.0, 5.0], color='#0f172a', lw=1.5)
    ax.text(3.1, 5.15, "1", fontsize=8, fontweight='bold')
    ax.text(3.7, 5.15, "1", fontsize=8, fontweight='bold')

    ax.plot([6.2, 7.0], [5.0, 5.0], color='#0f172a', lw=1.5)
    ax.text(6.3, 5.15, "1", fontsize=8, fontweight='bold')
    ax.text(6.9, 5.15, "N", fontsize=8, fontweight='bold')

    ax.plot([1.8, 1.8], [4.1, 2.7], color='#0f172a', lw=1.5)
    ax.text(1.95, 3.9, "1", fontsize=8, fontweight='bold')
    ax.text(1.95, 2.9, "N", fontsize=8, fontweight='bold')

    ax.plot([5.0, 5.0], [4.1, 2.7], color='#0f172a', lw=1.5, ls='--')
    ax.text(5.15, 3.4, "M : N (Skill Match)", fontsize=7, color='#0284c7', fontweight='bold')

    path = os.path.join(FIG_DIR, "fig5_5_er_diagram.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_gantt_pert():
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6.8), dpi=300, gridspec_kw={'height_ratios': [1.2, 1]})

    # Gantt Chart
    tasks = [
        "1. Problem Discovery & SIH Framing",
        "2. OpenCV Biometric & Liveness Engine",
        "3. FastAPI Backend & SQLite Schemas",
        "4. React 19 Frontend & Web Enrollment",
        "5. Asynchronous Retraining & Anti-Spoof",
        "6. Integration Testing & Docker Suite"
    ]
    starts = [1, 2, 4, 6, 8, 10]
    durations = [2, 3, 3, 4, 3, 2]
    colors = ['#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#6366f1']

    for i, (task, start, dur, col) in enumerate(zip(tasks, starts, durations, colors)):
        ax1.barh(i, dur, left=start, height=0.5, color=col, edgecolor='#1e293b', lw=1)
        ax1.text(start + 0.1, i, f"W{start}-W{start+dur}", va='center', fontsize=7, color='#ffffff', fontweight='bold')

    ax1.set_yticks(range(len(tasks)))
    ax1.set_yticklabels(tasks, fontsize=7.5, fontweight='bold')
    ax1.invert_yaxis()
    ax1.set_xlim(0, 13)
    ax1.set_xlabel("Project Timeline (Weeks)", fontsize=8, fontweight='bold')
    ax1.set_title("Gantt Chart: Work Breakdown & Implementation Schedule", fontsize=9, fontweight='bold', pad=8)
    ax1.grid(axis='x', linestyle=':', alpha=0.6)

    # PERT Network Chart
    ax2.axis('off')
    ax2.set_title("PERT Network Chart: Critical Path Analysis (T1 -> T2 -> T4 -> T5 -> T6)", fontsize=9, fontweight='bold', pad=8)
    nodes = [
        ("T1: Req Analysis\n[ES=0, EF=2]", 1.0, 0.5),
        ("T2: Face Engine\n[ES=2, EF=5]", 2.8, 0.8),
        ("T3: QR & DB\n[ES=2, EF=4]", 2.8, 0.2),
        ("T4: React ERP\n[ES=5, EF=9]", 5.0, 0.5),
        ("T5: Async Retrain\n[ES=9, EF=11]", 7.2, 0.5),
        ("T6: Verification\n[ES=11, EF=12]", 9.0, 0.5)
    ]
    for label, x, y in nodes:
        box = patches.FancyBboxPatch((x-0.75, y-0.22), 1.5, 0.44, boxstyle='round,pad=0.06', ec='#1e3a8a', fc='#dbeafe', lw=1.4)
        ax2.add_patch(box)
        ax2.text(x, y, label, ha='center', va='center', fontsize=6.8, fontweight='bold', color='#1e3a8a')

    # Pert Connections (Critical path in red)
    ax2.annotate("", xy=(2.05, 0.8), xytext=(1.75, 0.5), arrowprops=dict(arrowstyle="->", lw=1.8, color='#dc2626'))
    ax2.annotate("", xy=(2.05, 0.2), xytext=(1.75, 0.5), arrowprops=dict(arrowstyle="->", lw=1.2, color='#64748b', ls='--'))
    ax2.annotate("", xy=(4.25, 0.5), xytext=(3.55, 0.8), arrowprops=dict(arrowstyle="->", lw=1.8, color='#dc2626'))
    ax2.annotate("", xy=(4.25, 0.5), xytext=(3.55, 0.2), arrowprops=dict(arrowstyle="->", lw=1.2, color='#64748b', ls='--'))
    ax2.annotate("", xy=(6.45, 0.5), xytext=(5.75, 0.5), arrowprops=dict(arrowstyle="->", lw=1.8, color='#dc2626'))
    ax2.annotate("", xy=(8.25, 0.5), xytext=(7.95, 0.5), arrowprops=dict(arrowstyle="->", lw=1.8, color='#dc2626'))

    path = os.path.join(FIG_DIR, "fig5_6_gantt_pert.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_ui_blueprint():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.2)
    ax.axis('off')

    # Window frame
    win = patches.FancyBboxPatch((0.2, 0.2), 9.6, 5.8, boxstyle='round,pad=0.1', ec='#334155', fc='#0f172a', lw=2)
    ax.add_patch(win)

    # Top Navbar
    nav = patches.Rectangle((0.2, 5.3), 9.6, 0.7, ec='#334155', fc='#1e293b', lw=1.5)
    ax.add_patch(nav)
    ax.text(0.6, 5.65, "CoopSync AI", fontsize=11, fontweight='bold', color='#38bdf8')
    ax.text(2.0, 5.65, "|  Cooperative ERP & Biometric Suite (SIH26087)", fontsize=8, color='#94a3b8')
    ax.text(8.8, 5.65, "Admin Role  |  Logout", fontsize=7.5, color='#cbd5e1')

    # Left Sidebar
    side = patches.Rectangle((0.2, 0.2), 2.2, 5.1, ec='#334155', fc='#1e293b', lw=1.5)
    ax.add_patch(side)
    menu_items = [
        ("Face Attendance", True),
        ("QR Scanner", False),
        ("Student Registry", False),
        ("Analytics KPI", False),
        ("Digital Certs", False),
        ("Job Portal", False),
        ("Model Retrain", False),
        ("Sync Status", False)
    ]
    cur_y = 4.8
    for item, active in menu_items:
        fc = '#0284c7' if active else '#334155'
        tc = '#ffffff' if active else '#94a3b8'
        btn = patches.FancyBboxPatch((0.35, cur_y-0.18), 1.9, 0.36, boxstyle='round,pad=0.04', ec=fc, fc=fc, lw=1)
        ax.add_patch(btn)
        ax.text(0.5, cur_y, item, fontsize=7.5, fontweight='bold' if active else 'normal', color=tc)
        cur_y -= 0.55

    # Main Area: Face Scanner
    main = patches.Rectangle((2.6, 0.4), 6.9, 4.7, ec='#475569', fc='#020617', lw=1.5)
    ax.add_patch(main)
    ax.text(6.05, 4.7, "Live Biometric Face Scanner Feed (640x480 Webcam Stream)", ha='center', fontsize=9, fontweight='bold', color='#f8fafc')

    # Webcam viewport
    cam = patches.Rectangle((3.0, 1.2), 4.2, 3.2, ec='#22c55e', fc='#0f172a', lw=2, ls='--')
    ax.add_patch(cam)
    # Face Bounding Box
    box = patches.Rectangle((4.4, 2.0), 1.4, 1.8, ec='#22c55e', fc='none', lw=2)
    ax.add_patch(box)
    ax.text(5.1, 3.95, "Prakash Madhok (98.4% Match)", ha='center', fontsize=7.5, fontweight='bold', color='#22c55e')

    # Quality Meters Panel
    meter_panel = patches.FancyBboxPatch((7.4, 1.2), 1.9, 3.2, boxstyle='round,pad=0.06', ec='#334155', fc='#1e293b', lw=1.5)
    ax.add_patch(meter_panel)
    ax.text(8.35, 4.1, "Liveness Quality", ha='center', fontsize=8, fontweight='bold', color='#38bdf8')
    ax.text(7.6, 3.6, "Sharpness (Var):", fontsize=6.8, color='#94a3b8')
    ax.text(7.6, 3.35, "142.6 (Min 65.0) [OK]", fontsize=6.8, color='#22c55e', fontweight='bold')
    ax.text(7.6, 2.9, "Brightness:", fontsize=6.8, color='#94a3b8')
    ax.text(7.6, 2.65, "118.4 / 255 [Normal]", fontsize=6.8, color='#22c55e', fontweight='bold')
    ax.text(7.6, 2.2, "Face Centered:", fontsize=6.8, color='#94a3b8')
    ax.text(7.6, 1.95, "True (In Bounds)", fontsize=6.8, color='#22c55e', fontweight='bold')
    ax.text(7.6, 1.5, "Duplicate Today:", fontsize=6.8, color='#94a3b8')
    ax.text(7.6, 1.25, "False (Eligible)", fontsize=6.8, color='#22c55e', fontweight='bold')

    # Action bar
    act = patches.Rectangle((3.0, 0.6), 6.3, 0.45, ec='#334155', fc='#1e293b', lw=1)
    ax.add_patch(act)
    ax.text(4.2, 0.82, "[Mark Biometric Attendance]", fontsize=7.5, fontweight='bold', color='#38bdf8')
    ax.text(6.4, 0.82, "[Launch Desktop OpenCV Camera]", fontsize=7.5, fontweight='bold', color='#a855f7')

    path = os.path.join(FIG_DIR, "fig7_8_ui_layout_blueprint.png")
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

if __name__ == "__main__":
    print("[1/7] Generating Use Case Diagram...")
    print(" ", generate_use_case())
    print("[2/7] Generating Class Diagram...")
    print(" ", generate_class_diagram())
    print("[3/7] Generating Sequence Diagram...")
    print(" ", generate_sequence_diagram())
    print("[4/7] Generating Activity Diagram...")
    print(" ", generate_activity_diagram())
    print("[5/7] Generating DFD Diagram...")
    print(" ", generate_dfd())
    print("[6/7] Generating ER Diagram...")
    print(" ", generate_er_diagram())
    print("[7/7] Generating Gantt / PERT & UI Blueprint...")
    print(" ", generate_gantt_pert())
    print(" ", generate_ui_blueprint())
    print("All diagrams generated successfully in:", FIG_DIR)
