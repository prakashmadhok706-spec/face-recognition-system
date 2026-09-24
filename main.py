from tkinter import *
from PIL import Image, ImageTk
import os
from student import Student
from train import Train
from facedetector import Face_Detector
from attendence import Attendance



class face_recognition_system:
    def __init__(self, root):
        self.root = root
        self.root.geometry("1530x790+0+0")
        self.root.title("Face Recognition System")

        # IMAGE 1   
        img1 = Image.open(r"C:\Users\PRAKASH\OneDrive\Desktop\project images\image1.JPEG")
        img1 = img1.resize((500,130), Image.Resampling.LANCZOS)
        self.photoimg1 = ImageTk.PhotoImage(img1)
        Label(self.root, image=self.photoimg1).place(x=0, y=0, width=500, height=130)

        # IMAGE 2
        img2 = Image.open(r"C:\Users\PRAKASH\OneDrive\Desktop\project images\image3.WEBP")
        img2 = img2.resize((500,130), Image.Resampling.LANCZOS)
        self.photoimg2 = ImageTk.PhotoImage(img2)
        Label(self.root, image=self.photoimg2).place(x=500, y=0, width=500, height=130)

        # IMAGE 3
        img3 = Image.open(r"C:\Users\PRAKASH\OneDrive\Desktop\project images\image2.JPG")
        img3 = img3.resize((500,130), Image.Resampling.LANCZOS)
        self.photoimg3 = ImageTk.PhotoImage(img3)
        Label(self.root, image=self.photoimg3).place(x=1000, y=0, width=550, height=130)

        # BACKGROUND IMAGE
        img4 = Image.open(r"C:\Users\PRAKASH\OneDrive\Desktop\project images\image4.JPG")
        img4 = img4.resize((1530,710), Image.Resampling.LANCZOS)
        self.photoimg4 = ImageTk.PhotoImage(img4)
        bg_img = Label(self.root, image=self.photoimg4)
        bg_img.place(x=0, y=130, width=1530, height=710)

        # TITLE LABEL
        title_lbl = Label(bg_img, text="FACE RECOGNITION SYSTEM SOFTWARE",
                          font=("times new roman", 35, "bold"), bg="white", fg="blue")
        title_lbl.place(x=0, y=0, width=1530, height=45)

        # --- FIRST ROW BUTTONS ---
        x_positions_row1 = [265, 515, 765, 1015] 
        y_row1 = 100
        self.create_button(bg_img, x_positions_row1[0], y_row1,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image5.PNG","Student Details", self.open_student_details)
        self.create_button(bg_img, x_positions_row1[1], y_row1,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image6.JPG","Face Detector", self.open_face_detector)
        self.create_button(bg_img, x_positions_row1[2], y_row1,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image7.WEBP","Attendance", self.open_attendance)
        self.create_button(bg_img, x_positions_row1[3], y_row1,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image8.PNG","Help Desk", self.open_helpdesk)

        # --- SECOND ROW BUTTONS ---
        x_positions_row2 = [265, 515, 765, 1015]  
        y_row2 = 300
        self.create_button(bg_img, x_positions_row2[0], y_row2,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image9.JPG","Train Data", self.open_train_data)
        self.create_button(bg_img, x_positions_row2[1], y_row2,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image10.WEBP", "Photos", self.open_photos)
        self.create_button(bg_img, x_positions_row2[2], y_row2,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image11.JPEG","Developer", self.open_developer)
        self.create_button(bg_img, x_positions_row2[3], y_row2,"C:\\Users\\PRAKASH\\OneDrive\\Desktop\\project images\\image12.WEBP","Exit", self.exit_program)

    # Generic function to create a button with image and text
    def create_button(self, parent, x, y, image_path, text, command):
        if not os.path.exists(image_path):
            image_path = r"C:\Users\PRAKASH\OneDrive\Desktop\project images\image2.JPG"  # fallback image

        img = Image.open(image_path)
        img = img.resize((150,150), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(img)

        btn_img = Button(parent, image=photo, cursor="hand2", command=command)
        btn_img.image = photo  # keep reference
        btn_img.place(x=x, y=y, width=150, height=150)

        btn_text = Button(parent, text=text, cursor="hand2",
                          font=("times new roman", 15, "bold"),
                          bg="darkblue", fg="white", command=command)
        btn_text.place(x=x, y=y+150, width=150, height=40)

    # Placeholder functions
    # OPEN STUDENT DETAILS PAGE
    def open_student_details(self):
        self.new_window = Toplevel(self.root)
        self.app = Student(self.new_window)

    def open_face_detector(self):
        self.new_window = Toplevel(self.root)
        self.app = Face_Detector(self.new_window)


    def open_attendance(self):
        self.new_window = Toplevel(self.root)
        self.app = Attendance(self.new_window)


    def open_helpdesk(self):
        self.open_new_window("Help Desk Module Coming Soon")

    def open_train_data(self):
    # Open the Train window as a child window
        self.new_window = Toplevel(self.root)
        self.app = Train(self.new_window)  # import Train from train.py


    def open_photos(self):
        self.open_new_window("Photos Module Coming Soon")

    def open_developer(self):
        self.open_new_window("Developer Info Module Coming Soon")

    def exit_program(self):
        self.root.destroy()  # closes the application

    def open_new_window(self, message):
        new_window = Toplevel(self.root)
        new_window.title("Module")
        new_window.geometry("600x400")
        Label(new_window, text=message, font=("times new roman", 20, "bold")).pack(pady=50)


if __name__ == "__main__":
    root = Tk()
    obj = face_recognition_system(root)
    root.mainloop()
