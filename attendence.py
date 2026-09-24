from tkinter import *
from tkinter import ttk, messagebox
import csv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ATTENDANCE_FILE = os.path.join(BASE_DIR, "attendance.csv")


class Attendance:
    def __init__(self, root):
        self.root = root
        self.root.geometry("1000x600+200+100")
        self.root.title("Attendance Records")

        # ---------- TITLE ----------
        title = Label(
            self.root,
            text="ATTENDANCE RECORDS",
            font=("times new roman", 25, "bold"),
            bg="navy",
            fg="white"
        )
        title.pack(fill=X)

        # ---------- FILTER FRAME ----------
        filter_frame = Frame(self.root, bg="white", bd=2, relief=RIDGE)
        filter_frame.pack(fill=X, padx=10, pady=10)

        Label(filter_frame, text="Student ID:", bg="white",
              font=("times new roman", 12, "bold")).grid(row=0, column=0, padx=10, pady=5)

        self.var_id = StringVar()
        Entry(filter_frame, textvariable=self.var_id, width=15)\
            .grid(row=0, column=1, padx=5)

        Label(filter_frame, text="Date (YYYY-MM-DD):", bg="white",
              font=("times new roman", 12, "bold")).grid(row=0, column=2, padx=10)

        self.var_date = StringVar()
        Entry(filter_frame, textvariable=self.var_date, width=15)\
            .grid(row=0, column=3, padx=5)

        Button(filter_frame, text="Search", width=12,
               command=self.search_attendance, bg="green", fg="white")\
            .grid(row=0, column=4, padx=10)

        Button(filter_frame, text="Show All", width=12,
               command=self.load_data, bg="blue", fg="white")\
            .grid(row=0, column=5, padx=5)

        # ---------- TABLE FRAME ----------
        table_frame = Frame(self.root, bd=2, relief=RIDGE)
        table_frame.pack(fill=BOTH, expand=True, padx=10, pady=10)

        scroll_y = ttk.Scrollbar(table_frame, orient=VERTICAL)

        self.attendance_table = ttk.Treeview(
            table_frame,
            columns=("id", "name", "date", "time"),
            show="headings",
            yscrollcommand=scroll_y.set
        )

        scroll_y.config(command=self.attendance_table.yview)
        scroll_y.pack(side=RIGHT, fill=Y)

        self.attendance_table.heading("id", text="ID")
        self.attendance_table.heading("name", text="Name")
        self.attendance_table.heading("date", text="Date")
        self.attendance_table.heading("time", text="Time")

        self.attendance_table.column("id", width=100, anchor=CENTER)
        self.attendance_table.column("name", width=250)
        self.attendance_table.column("date", width=150, anchor=CENTER)
        self.attendance_table.column("time", width=150, anchor=CENTER)

        self.attendance_table.pack(fill=BOTH, expand=True)

        self.load_data()

    # ---------- LOAD ALL ----------
    def load_data(self):
        self.attendance_table.delete(*self.attendance_table.get_children())

        if not os.path.exists(ATTENDANCE_FILE):
            messagebox.showinfo("Info", "No attendance records found.")
            return

        with open(ATTENDANCE_FILE, "r", newline="") as f:
            reader = csv.reader(f)
            next(reader, None)  # skip header
            for row in reader:
                self.attendance_table.insert("", END, values=row)

    # ---------- SEARCH ----------
    def search_attendance(self):
        sid = self.var_id.get().strip()
        date = self.var_date.get().strip()

        self.attendance_table.delete(*self.attendance_table.get_children())

        if not os.path.exists(ATTENDANCE_FILE):
            messagebox.showerror("Error", "Attendance file not found.")
            return

        with open(ATTENDANCE_FILE, "r", newline="") as f:
            reader = csv.reader(f)
            next(reader, None)

            for row in reader:
                if sid and row[0] != sid:
                    continue
                if date and row[2] != date:
                    continue
                self.attendance_table.insert("", END, values=row)
