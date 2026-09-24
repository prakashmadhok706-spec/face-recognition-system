**Face Recognition System Flowchart**

Below is a Mermaid flowchart that maps the main data and control flow of this project.

```mermaid
flowchart TB
  Start([Start: run `main.py` GUI]) --> Main[Main Window (`main.py`) - Buttons]

  Main --> StudentBtn["Student Details\n(`student.py`)"]
  StudentBtn --> SaveCSV[[`students.csv` (store student records)]]
  StudentBtn --> Capture["Take Photo -> `dataset/<student_id>/`"]

  Main --> TrainBtn["Train Data\n(`train.py`)"]
  TrainBtn --> Scan["Scan `dataset/` folders"]
  Scan --> Capture
  TrainBtn --> TrainModel["Train LBPH model"]
  TrainModel --> ModelOut[[`data/classifier.xml`]]
  TrainModel --> LabelsOut[[`data/labels.csv`]]

  Main --> DetectBtn["Face Detector\n(`facedetector.py`)"]
  DetectBtn --> LoadModel["Load `data/classifier.xml` & `data/labels.csv`"]
  LoadModel --> Camera["Open camera, detect faces, predict IDs"]
  Camera -->|Recognized & stable| MarkAttendanceFn["mark_attendance(student_id, name)\n(from `attendence.py`) "]
  MarkAttendanceFn --> AttendanceCSV[[`attendance.csv`]]

  Main --> AttendanceUI["Attendance Viewer\n(`attendence.py`)"]
  AttendanceUI --> AttendanceCSV

  Main --> Other["Help / Photos / Exit (UI placeholders)"]

  classDef file fill:#f9f,stroke:#333,stroke-width:1px;
  class SaveCSV,ModelOut,LabelsOut,AttendanceCSV file;
```

Short explanation:
- `main.py` builds the GUI and routes to modules via buttons.
- `student.py` lets you add/update student records in `students.csv` and capture face images into `dataset/<id>/` folders.
- `train.py` scans `dataset/`, prepares faces and labels, trains an LBPH recognizer, and writes `data/classifier.xml` and `data/labels.csv`.
- `facedetector.py` loads the model and labels, opens the webcam, recognizes faces, and calls `mark_attendance(...)` which appends to `attendance.csv` (avoiding duplicate marks for the same day).
- `attendence.py` (Attendance UI) reads `attendance.csv` and provides filters/search for records.

How to view or export the diagram:
- In VS Code: open `FLOWCHART.md` and use a Markdown preview extension that supports Mermaid (or install `Markdown Preview Mermaid Support`).
- Export to PNG/SVG with `mmdc` (Mermaid CLI):

```powershell
npm install -g @mermaid-js/mermaid-cli
mmdc -i FLOWCHART.md -o flowchart.png
```

If you'd like, I can also export a PNG/SVG here or embed a rendered image in the repo. Tell me which format you prefer.
