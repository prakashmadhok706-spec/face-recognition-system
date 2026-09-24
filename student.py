from tkinter import *
from tkinter import ttk
from tkinter import messagebox
import csv
import os
import cv2

# ================= BASE DIR =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ===========================================


class Student:
    def __init__(self, root):
        self.root = root
        self.root.geometry("1530x790+0+0")
        self.root.title("Student Management System")

        # ---------- FIXED PATHS (UI SAME) ----------
        self.DATASET_DIR = os.path.join(BASE_DIR, "dataset")
        self.csv_file = os.path.join(BASE_DIR, "students.csv")

        os.makedirs(self.DATASET_DIR, exist_ok=True)

        # ---------- TITLE ----------
        title_lbl = Label(self.root, text="Student Management System",
                          font=("times new roman", 30, "bold"),
                          bg="navy", fg="white")
        title_lbl.place(x=0, y=0, width=1530, height=50)

        # ---------- MAIN FRAME ----------
        main_frame = Frame(self.root, bd=2, bg="white")
        main_frame.place(x=20, y=70, width=1480, height=700)

        # ---------- LEFT FRAME ----------
        left_frame = LabelFrame(main_frame, bd=2, bg="white", relief=RIDGE,
                                text="Student Details", font=("times new roman", 14, "bold"))
        left_frame.place(x=10, y=10, width=720, height=680)

        # ---------- STUDENT INFO ----------
        info_frame = LabelFrame(left_frame, bd=2, bg="white", relief=RIDGE,
                                text="Student Information", font=("times new roman", 12, "bold"))
        info_frame.place(x=10, y=10, width=690, height=140)

        # ---------- VARIABLES ----------
        self.var_id = StringVar()
        self.var_name = StringVar()
        self.var_roll = StringVar()
        self.var_gender = StringVar(value="Select Gender")
        self.var_dept = StringVar(value="Select Department")
        self.var_year = StringVar(value="Select Year")
        self.var_course = StringVar(value="Select Course")
        self.var_sem = StringVar(value="Select Semester")

        # ---------- LABELS & ENTRIES ----------
        Label(info_frame, text="ID:", font=("times new roman", 12, "bold"), bg="white")\
            .grid(row=0, column=0, padx=10, pady=10, sticky=W)
        ttk.Entry(info_frame, textvariable=self.var_id)\
            .grid(row=0, column=1, padx=10, pady=10, sticky=W)

        Label(info_frame, text="Name:", font=("times new roman", 12, "bold"), bg="white")\
            .grid(row=0, column=2, padx=30, pady=10, sticky=W)
        ttk.Entry(info_frame, textvariable=self.var_name)\
            .grid(row=0, column=3, padx=10, pady=10, sticky=W)

        Label(info_frame, text="Roll No:", font=("times new roman", 12, "bold"), bg="white")\
            .grid(row=1, column=0, padx=10, pady=10, sticky=W)
        ttk.Entry(info_frame, textvariable=self.var_roll)\
            .grid(row=1, column=1, padx=10, pady=10, sticky=W)

        Label(info_frame, text="Gender:", font=("times new roman", 12, "bold"), bg="white")\
            .grid(row=1, column=2, padx=30, pady=10, sticky=W)
        ttk.Combobox(info_frame, textvariable=self.var_gender, state="readonly",
                     values=("Select Gender", "Male", "Female", "Other"))\
            .grid(row=1, column=3, padx=10, pady=10, sticky=W)

        # ---------- COURSE INFO ----------
        course_frame = LabelFrame(left_frame, bd=2, bg="white", relief=RIDGE,
                                  text="Current Course Info", font=("times new roman", 12, "bold"))
        course_frame.place(x=10, y=160, width=690, height=180)

        ttk.Combobox(course_frame, textvariable=self.var_dept, state="readonly",
                     values=("Select Department", "CSE", "AIML", "Electrical", "Mechanical"))\
            .grid(row=0, column=1, padx=10, pady=10, sticky=W)
        Label(course_frame, text="Department:", bg="white").grid(row=0, column=0, padx=10, pady=10)

        ttk.Combobox(course_frame, textvariable=self.var_year, state="readonly",
                     values=("Select Year", "1st Year", "2nd Year", "3rd Year", "4th Year"))\
            .grid(row=1, column=1, padx=10, pady=10, sticky=W)
        Label(course_frame, text="Year:", bg="white").grid(row=1, column=0, padx=10, pady=10)

        ttk.Combobox(course_frame, textvariable=self.var_course, state="readonly",
                     values=("Select Course", "B.Tech", "M.Tech", "BCA", "MCA", "Diploma"))\
            .grid(row=0, column=3, padx=10, pady=10, sticky=W)
        Label(course_frame, text="Course:", bg="white").grid(row=0, column=2, padx=50, pady=10)

        ttk.Combobox(course_frame, textvariable=self.var_sem, state="readonly",
                     values=("Select Semester","Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"))\
            .grid(row=1, column=3, padx=10, pady=10, sticky=W)
        Label(course_frame, text="Semester:", bg="white").grid(row=1, column=2, padx=50, pady=10)

        # ---------- BUTTON FRAME ----------
        btn_frame = Frame(left_frame, bd=2, relief=RIDGE, bg="white")
        btn_frame.place(x=10, y=350, width=690, height=300)

        Button(btn_frame, text="Save", width=18, command=self.save_data).grid(row=0, column=0, padx=10, pady=10)
        Button(btn_frame, text="Update", width=18, command=self.update_data).grid(row=0, column=1, padx=10, pady=10)
        Button(btn_frame, text="Delete", width=18, command=self.delete_data).grid(row=0, column=2, padx=10, pady=10)
        Button(btn_frame, text="Reset", width=18, command=self.reset_data).grid(row=1, column=0, padx=10, pady=10)
        Button(btn_frame, text="Take Photo", width=18, command=self.take_photo).grid(row=1, column=1, padx=10, pady=10)
        Button(btn_frame, text="Update Photo", width=18, command=self.take_photo).grid(row=1, column=2, padx=10, pady=10)

        # ---------- RIGHT FRAME (TABLE UNCHANGED) ----------
        right_frame = LabelFrame(main_frame, bd=2, bg="white", relief=RIDGE,
                                 text="Student Details Table", font=("times new roman", 14, "bold"))
        right_frame.place(x=740, y=10, width=720, height=680)

        table_frame = Frame(right_frame, bd=2, relief=RIDGE, bg="white")
        table_frame.place(x=10, y=10, width=690, height=640)

        scroll_y = ttk.Scrollbar(table_frame, orient=VERTICAL)
        scroll_y.pack(side=RIGHT, fill=Y)

        self.student_table = ttk.Treeview(
            table_frame,
            columns=("id","name","roll","gender","dept","year","course","sem"),
            yscrollcommand=scroll_y.set,
            show="headings"
        )
        scroll_y.config(command=self.student_table.yview)

        for col in ("id","name","roll","gender","dept","year","course","sem"):
            self.student_table.heading(col, text=col.title())
            self.student_table.column(col, width=90)

        self.student_table.pack(fill=BOTH, expand=1)
        self.student_table.bind("<ButtonRelease-1>", self.get_cursor)

        self.load_csv()

    # ================= CSV =================
    def load_csv(self):
        if os.path.exists(self.csv_file):
            with open(self.csv_file, 'r', newline='') as f:
                for row in csv.reader(f):
                    self.student_table.insert('', END, values=row)

    def save_data(self):
        values = [
            self.var_id.get(), self.var_name.get(), self.var_roll.get(),
            self.var_gender.get(), self.var_dept.get(), self.var_year.get(),
            self.var_course.get(), self.var_sem.get()
        ]
        self.student_table.insert('', END, values=values)
        with open(self.csv_file, 'a', newline='') as f:
            csv.writer(f).writerow(values)

    def get_cursor(self, event=""):
        row = self.student_table.item(self.student_table.focus())['values']
        if row:
            self.var_id.set(row[0])
            self.var_name.set(row[1])
            self.var_roll.set(row[2])
            self.var_gender.set(row[3])
            self.var_dept.set(row[4])
            self.var_year.set(row[5])
            self.var_course.set(row[6])
            self.var_sem.set(row[7])

    def update_data(self):
        self._rewrite_csv()

    def delete_data(self):
        selected = self.student_table.focus()
        if selected:
            self.student_table.delete(selected)
            self._rewrite_csv()

    def _rewrite_csv(self):
        rows = [self.student_table.item(i)['values']
                for i in self.student_table.get_children()]
        with open(self.csv_file, 'w', newline='') as f:
            csv.writer(f).writerows(rows)

    def reset_data(self):
        self.var_id.set("")
        self.var_name.set("")
        self.var_roll.set("")
        self.var_gender.set("Select Gender")
        self.var_dept.set("Select Department")
        self.var_year.set("Select Year")
        self.var_course.set("Select Course")
        self.var_sem.set("Select Semester")

    # ================= PHOTO CAPTURE (ONLY LOGIC FIX) =================
    def take_photo(self):
        sid = self.var_id.get().strip()
        if sid == "":
            messagebox.showerror("Error", "Enter Student ID first")
            return

        student_folder = os.path.join(self.DATASET_DIR, sid)
        os.makedirs(student_folder, exist_ok=True)

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        cap = cv2.VideoCapture(0)
        count = 0

        while count < 50:
            ret, frame = cap.read()
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces:
                face = gray[y:y+h, x:x+w]
                face = cv2.resize(face, (200, 200))
                count += 1
                cv2.imwrite(os.path.join(student_folder, f"{sid}_{count}.jpg"), face)
                cv2.rectangle(frame, (x,y), (x+w,y+h), (0,255,0), 2)

            cv2.imshow("Capturing Faces - ESC to exit", frame)
            if cv2.waitKey(1) == 27:
                break

        cap.release()
        cv2.destroyAllWindows()
        messagebox.showinfo("Done", f"{count} images saved for ID {sid}")


if __name__ == "__main__":
    root = Tk()
    Student(root)
    root.mainloop()
