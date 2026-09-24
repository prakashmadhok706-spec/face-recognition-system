import cv2
import numpy as np
import os
import csv
from tkinter import *
from tkinter import messagebox
from datetime import datetime

# ================= BASE DIR =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ATTENDANCE_FILE = os.path.join(BASE_DIR, "attendance.csv")
# ===========================================


def mark_attendance(student_id, name):
    today = datetime.now().strftime("%Y-%m-%d")
    time_now = datetime.now().strftime("%H:%M:%S")

    # Create file if not exists
    if not os.path.exists(ATTENDANCE_FILE):
        with open(ATTENDANCE_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "Name", "Date", "Time"])

    # Avoid duplicate attendance for same day
    with open(ATTENDANCE_FILE, "r", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) > 0 and row[0] == str(student_id) and row[2] == today:
                return  # already marked

    # Mark attendance
    with open(ATTENDANCE_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([student_id, name, today, time_now])


class Face_Detector:
    def __init__(self, root):
        self.root = root
        self.root.geometry("500x400+400+200")
        self.root.title("Face Recognition")

        # ---------- STABILITY SETTINGS ----------
        self.last_ids = []
        self.REQUIRED_FRAMES = 7
        self.CONF_THRESHOLD = 55
        # --------------------------------------

        title_lbl = Label(
            self.root,
            text="Face Recognition System",
            font=("times new roman", 22, "bold"),
            bg="navy",
            fg="white"
        )
        title_lbl.pack(fill=X)

        btn_recognize = Button(
            self.root,
            text="Start Face Recognition",
            font=("times new roman", 18, "bold"),
            bg="green",
            fg="white",
            cursor="hand2",
            command=self.face_recognition
        )
        btn_recognize.pack(pady=100)

    # ================= FACE RECOGNITION =================
    def face_recognition(self):

        model_path = os.path.join(BASE_DIR, "data", "classifier.xml")
        labels_path = os.path.join(BASE_DIR, "data", "labels.csv")

        if not os.path.exists(model_path):
            messagebox.showerror("Error", "Please train data first!")
            return

        face_classifier = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        clf = cv2.face.LBPHFaceRecognizer_create()
        clf.read(model_path)

        # Load labels
        labels = {}
        with open(labels_path, "r", newline="", encoding="utf-8") as f:
            for row in csv.reader(f):
                if row and row[0].isdigit():
                    labels[int(row[0])] = row[1]

        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            messagebox.showerror("Error", "Camera not accessible")
            return

        marked_ids = set()  # avoid repeated marking in same session

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_classifier.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces:
                face_roi = gray[y:y+h, x:x+w]
                if face_roi.size == 0:
                    continue

                face_roi = cv2.resize(face_roi, (200, 200))
                face_roi = cv2.equalizeHist(face_roi)

                id_, confidence = clf.predict(face_roi)

                if confidence <= self.CONF_THRESHOLD:
                    self.last_ids.append(id_)
                    if len(self.last_ids) > self.REQUIRED_FRAMES:
                        self.last_ids.pop(0)

                    if self.last_ids.count(id_) == self.REQUIRED_FRAMES:
                        name = labels.get(id_, "Unknown")

                        if name != "Unknown" and id_ not in marked_ids:
                            mark_attendance(id_, name)
                            marked_ids.add(id_)

                        text = f"{name}"
                        color = (0, 255, 0)
                    else:
                        text = "Detecting..."
                        color = (0, 255, 255)
                else:
                    self.last_ids.clear()
                    text = "Unknown"
                    color = (0, 0, 255)

                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                cv2.putText(
                    frame, text, (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2
                )

            cv2.imshow("Face Recognition - Press ENTER to Exit", frame)

            if cv2.waitKey(1) == 13:
                break

        cap.release()
        cv2.destroyAllWindows()


# ================= MAIN =================
if __name__ == "__main__":
    root = Tk()
    Face_Detector(root)
    root.mainloop()
