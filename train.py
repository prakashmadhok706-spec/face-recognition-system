from tkinter import *
from tkinter import ttk
from tkinter import messagebox
import csv
import os
import sys
import cv2
import numpy as np

# ================= IMPORTANT =================
# Base directory of this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ============================================


class Train:
    def __init__(self, root):
        self.root = root
        self.root.geometry("1530x790+0+0")
        self.root.title("Student Management System")

        # ===== PATHS & CONFIG =====
        self.DATASET_DIR = os.path.join(BASE_DIR, "dataset")
        self.FALLBACK_DIR = os.path.join(BASE_DIR, "student_photos")
        self.DATA_DIR = os.path.join(BASE_DIR, "data")
        self.STUDENTS_CSV = os.path.join(BASE_DIR, "students.csv")

        self.MODEL_OUT = os.path.join(self.DATA_DIR, "classifier.xml")
        self.LABELS_OUT = os.path.join(self.DATA_DIR, "labels.csv")
        self.IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp"}

        # Ensure folders exist
        os.makedirs(self.DATASET_DIR, exist_ok=True)
        os.makedirs(self.DATA_DIR, exist_ok=True)

        # Runtime data
        self.sources = []        # [(sid, img_path)]
        self.per_id_count = {}   # sid -> count
        self.id_to_name = {}     # sid -> name

        # ===== TITLE =====
        title_lbl = Label(
            self.root,
            text="Student Management System",
            font=("times new roman", 30, "bold"),
            bg="navy",
            fg="white"
        )
        title_lbl.place(x=0, y=0, width=1530, height=50)

        main_frame = Frame(self.root, bd=2, bg="white")
        main_frame.place(x=20, y=70, width=1480, height=700)

        # ===== CONTROLS =====
        ctrl = Frame(main_frame, bg="white")
        ctrl.pack(fill="x", padx=10, pady=10)

        Label(ctrl, text="Train Data",
              font=("times new roman", 20, "bold"),
              bg="white").pack(side="left")

        Button(ctrl, text="Scan Dataset", width=16,
               command=self.scan_dataset,
               bg="#0b5ed7", fg="white").pack(side="left", padx=6)

        Button(ctrl, text="Train Model", width=16,
               command=self.train_model,
               bg="#198754", fg="white").pack(side="left", padx=6)

        Button(ctrl, text="Open Dataset Folder", width=20,
               command=self.open_dataset,
               bg="#6c757d", fg="white").pack(side="left", padx=6)

        Button(ctrl, text="Open Output Folder", width=18,
               command=self.open_output,
               bg="#6c757d", fg="white").pack(side="left", padx=6)

        # ===== PROGRESS =====
        prog_wrap = Frame(main_frame, bg="white")
        prog_wrap.pack(fill="x", padx=10, pady=(0, 10))

        self.progress = ttk.Progressbar(
            prog_wrap, orient=HORIZONTAL,
            length=500, mode="determinate"
        )
        self.progress.pack(side="left", padx=6)

        self.status_var = StringVar(value="Status: Idle")
        Label(prog_wrap, textvariable=self.status_var,
              font=("times new roman", 12),
              bg="white").pack(side="left", padx=10)

        # ===== TABLE =====
        table_frame = Frame(main_frame, bd=2, relief=RIDGE, bg="white")
        table_frame.pack(fill="both", expand=True, padx=10, pady=10)

        self.tree = ttk.Treeview(
            table_frame,
            columns=("id", "name", "images"),
            show="headings"
        )

        self.tree.heading("id", text="ID")
        self.tree.heading("name", text="Name")
        self.tree.heading("images", text="Images")

        self.tree.column("id", width=120, anchor="center")
        self.tree.column("name", width=260, anchor="w")
        self.tree.column("images", width=120, anchor="center")

        scroll_y = ttk.Scrollbar(
            table_frame, orient=VERTICAL,
            command=self.tree.yview
        )
        self.tree.configure(yscrollcommand=scroll_y.set)

        self.tree.pack(side="left", fill="both", expand=True)
        scroll_y.pack(side="right", fill="y")

        # Initial scan
        self.scan_dataset()

    # ================= DATASET SCAN =================
    def scan_dataset(self):
        self.sources.clear()
        self.per_id_count.clear()

        # Load student names
        self.id_to_name = self._load_students_map()

        # Scan dataset/<ID> folders
        for folder in sorted(os.listdir(self.DATASET_DIR)):
            folder_path = os.path.join(self.DATASET_DIR, folder)
            if not os.path.isdir(folder_path):
                continue

            sid = self._parse_id_from_folder(folder)
            if sid is None:
                continue

            for fname in os.listdir(folder_path):
                if os.path.splitext(fname)[1].lower() in self.IMG_EXTS:
                    self.sources.append((sid, os.path.join(folder_path, fname)))
                    self.per_id_count[sid] = self.per_id_count.get(sid, 0) + 1

        # Clear table
        for row in self.tree.get_children():
            self.tree.delete(row)

        # Insert rows
        for sid in sorted(self.per_id_count):
            self.tree.insert(
                "",
                "end",
                values=(
                    sid,
                    self.id_to_name.get(sid, ""),
                    self.per_id_count[sid]
                )
            )

        self.status_var.set(
            f"Status: Found {len(self.per_id_count)} student(s), {len(self.sources)} image(s)"
        )

    # ================= TRAIN MODEL =================
    def train_model(self):
        if not hasattr(cv2, "face"):
            messagebox.showerror(
                "Error",
                "opencv-contrib-python not installed.\n\n"
                "Run:\n pip install opencv-contrib-python"
            )
            return

        if not self.sources:
            messagebox.showerror("Error", "No images found. Scan dataset first.")
            return

        faces = []
        labels = []

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        self.progress.configure(value=0, maximum=len(self.sources))
        processed = 0

        for sid, path in self.sources:
            img = cv2.imread(path)
            if img is None:
                processed += 1
                self._tick(processed)
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            rects = face_cascade.detectMultiScale(
                gray, 1.3, 5, minSize=(100, 100)
            )

            if len(rects) == 0:
                processed += 1
                self._tick(processed)
                continue

            x, y, w, h = max(rects, key=lambda r: r[2] * r[3])
            roi = gray[y:y+h, x:x+w]

            if roi.size == 0:
                processed += 1
                self._tick(processed)
                continue

            roi = cv2.resize(roi, (200, 200))

            faces.append(roi)
            labels.append(int(sid))

            processed += 1
            self._tick(processed)

        if not faces:
            messagebox.showerror("Error", "No valid face images found.")
            return

        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.train(faces, np.array(labels, dtype=np.int32))

        recognizer.write(self.MODEL_OUT)

        # Save labels (NO HEADER)
        with open(self.LABELS_OUT, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for sid in sorted(set(labels)):
                writer.writerow([sid, self.id_to_name.get(sid, "")])

        messagebox.showinfo("Success", "Training completed successfully")

    # ================= HELPERS =================
    def _tick(self, value):
        self.progress.configure(value=value)
        self.root.update_idletasks()

    def open_dataset(self):
        os.startfile(self.DATASET_DIR)

    def open_output(self):
        os.makedirs(self.DATA_DIR, exist_ok=True)
        os.startfile(self.DATA_DIR)

    def _load_students_map(self):
        mapping = {}
        if not os.path.exists(self.STUDENTS_CSV):
            return mapping

        with open(self.STUDENTS_CSV, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2 and row[0].isdigit():
                    mapping[int(row[0])] = row[1].strip()
        return mapping

    def _parse_id_from_folder(self, name):
        if name.isdigit():
            return int(name)
        for sep in ("_", "-", " "):
            left = name.split(sep)[0]
            if left.isdigit():
                return int(left)
        return None


if __name__ == "__main__":
    root = Tk()
    obj = Train(root)
    root.mainloop()
