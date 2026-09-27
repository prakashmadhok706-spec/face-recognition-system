from tkinter import *
from tkinter import ttk
from PIL import Image, ImageDraw, ImageFont, ImageTk
import os

from student import Student
from train import Train
from facedetector import Face_Detector
from attendence import Attendance

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSET_DIR = os.path.join(BASE_DIR, "assets")
os.makedirs(ASSET_DIR, exist_ok=True)


def generate_placeholder_icon(path, bg_color, accent_color, title):
    img = Image.new("RGB", (220, 160), bg_color)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((10, 10, 210, 150), radius=20, fill=bg_color)
    draw.rectangle((22, 22, 198, 138), fill=accent_color, outline=None)
    draw.rectangle((40, 50, 180, 105), fill=bg_color)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except OSError:
        font = ImageFont.load_default()
    text = title[:10]
    draw.text((32, 58), text, fill="white", font=font)
    img.save(path)


def ensure_assets():
    asset_map = {
        "student.png": ("#1d4ed8", "#93c5fd", "ERP"),
        "face.png": ("#166534", "#86efac", "Face"),
        "attendance.png": ("#7c2d12", "#fdba74", "QR"),
        "trainer.png": ("#4f46e5", "#c7d2fe", "Course"),
        "ai.png": ("#0f766e", "#99f6e4", "AI"),
        "certificate.png": ("#a16207", "#fef08a", "Cert"),
        "jobs.png": ("#9d174d", "#f9a8d4", "Jobs"),
        "analytics.png": ("#1f2937", "#94a3b8", "Stats"),
    }
    for file_name, (bg, accent, title) in asset_map.items():
        path = os.path.join(ASSET_DIR, file_name)
        if not os.path.exists(path):
            generate_placeholder_icon(path, bg, accent, title)
    return asset_map


class face_recognition_system:
    def __init__(self, root):
        self.root = root
        self.root.geometry("1500x860+20+20")
        self.root.title("CoopSync AI - Cooperative ERP")
        self.root.configure(bg="#0f172a")

        self.asset_map = ensure_assets()

        top_bar = Frame(self.root, bg="#0b1120", height=110)
        top_bar.pack(fill=X)

        title = Label(
            top_bar,
            text="CoopSync AI",
            font=("Segoe UI", 32, "bold"),
            bg="#0b1120",
            fg="#f8fafc"
        )
        title.place(x=40, y=20)

        subtitle = Label(
            top_bar,
            text="AI-Enabled Cooperative ERP & Employment Ecosystem",
            font=("Segoe UI", 12),
            bg="#0b1120",
            fg="#cbd5e1"
        )
        subtitle.place(x=42, y=68)

        status = Label(
            top_bar,
            text="SIH 2026 • Smart Education / Cooperative Digital Transformation",
            font=("Segoe UI", 10, "bold"),
            bg="#0f766e",
            fg="white",
            padx=12,
            pady=6,
            relief=FLAT
        )
        status.place(x=1180, y=30)

        content = Frame(self.root, bg="#e2e8f0")
        content.pack(fill=BOTH, expand=True, padx=25, pady=20)

        dashboard_header = Frame(content, bg="#f8fafc", bd=1, relief=RIDGE)
        dashboard_header.pack(fill=X, padx=20, pady=(20, 12))

        Label(
            dashboard_header,
            text="ERP Dashboard",
            font=("Segoe UI", 22, "bold"),
            bg="#f8fafc",
            fg="#111827"
        ).pack(anchor=W, padx=18, pady=14)

        cards = [
            ("Student ERP", self.open_student_details, "student.png"),
            ("Face Recognition", self.open_face_detector, "face.png"),
            ("QR Attendance", self.open_attendance, "attendance.png"),
            ("Trainer Dashboard", self.open_train_data, "trainer.png"),
            ("AI Chatbot", self.open_placeholder, "ai.png"),
            ("Certificates", self.open_placeholder, "certificate.png"),
            ("Employment Portal", self.open_placeholder, "jobs.png"),
            ("Analytics", self.open_placeholder, "analytics.png"),
        ]

        row_index = 0
        col_index = 0
        for title_text, command, image_name in cards:
            self.create_dashboard_card(content, title_text, command, image_name, row_index, col_index)
            col_index += 1
            if col_index == 4:
                col_index = 0
                row_index += 1

        footer = Frame(content, bg="#f8fafc", bd=1, relief=RIDGE)
        footer.pack(fill=X, padx=20, pady=(15, 20))

        info_text = (
            "Core modules: Student records, face-based attendance, QR fallback, training, AI assistance, and job matching. "
            "The project reuses your existing OpenCV recognition core and expands it into an SIH 2026 ERP prototype."
        )
        Label(
            footer,
            text=info_text,
            font=("Segoe UI", 11),
            wraplength=1200,
            justify=LEFT,
            bg="#f8fafc",
            fg="#374151"
        ).pack(anchor=W, padx=18, pady=18)

    def create_dashboard_card(self, parent, title_text, command, image_name, row_index, col_index):
        card = Frame(parent, bg="#ffffff", bd=1, relief=RIDGE, padx=10, pady=10)
        card.place(x=40 + col_index * 330, y=150 + row_index * 210, width=270, height=170)

        img_path = os.path.join(ASSET_DIR, image_name)
        img = Image.open(img_path)
        img = img.resize((180, 90), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(img)

        btn_image = Button(card, image=photo, command=command, bd=0, bg="white", cursor="hand2")
        btn_image.image = photo
        btn_image.pack(pady=(5, 8))

        btn_label = Button(
            card,
            text=title_text,
            command=command,
            font=("Segoe UI", 12, "bold"),
            bg="#1f2937",
            fg="white",
            pady=6,
            cursor="hand2",
            width=20,
            relief=FLAT
        )
        btn_label.pack()

    def open_student_details(self):
        win = Toplevel(self.root)
        Student(win)

    def open_face_detector(self):
        win = Toplevel(self.root)
        Face_Detector(win)

    def open_attendance(self):
        win = Toplevel(self.root)
        Attendance(win)

    def open_train_data(self):
        win = Toplevel(self.root)
        Train(win)

    def open_placeholder(self):
        self.open_new_window("This module is ready for extension in the SIH ERP flow.")

    def open_new_window(self, message):
        new_window = Toplevel(self.root)
        new_window.title("Module")
        new_window.geometry("520x220")
        new_window.configure(bg="#f8fafc")
        Label(
            new_window,
            text=message,
            font=("Segoe UI", 16, "bold"),
            bg="#f8fafc",
            fg="#1f2937",
            wraplength=420,
            justify=CENTER
        ).pack(expand=True)


if __name__ == "__main__":
    root = Tk()
    face_recognition_system(root)
    root.mainloop()

