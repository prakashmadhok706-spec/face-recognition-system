"""
Helper script: Insert TOC, List of Tables, List of Figures functions into generate_report.py
"""
import sys, io

TOC_FUNCTIONS = r"""# --- TABLE OF CONTENTS ---

def add_table_of_contents(doc):
    add_page_break(doc)
    heading1(doc, 'TABLE OF CONTENTS')
    separator_line(doc)
    doc.add_paragraph()

    toc_entries = [
        ('CERTIFICATE',                                    'i'),
        ('ACKNOWLEDGEMENT',                                'ii'),
        ('DECLARATION',                                    'iii'),
        ('ABSTRACT',                                       'iv'),
        ('TABLE OF CONTENTS',                              'v'),
        ('LIST OF TABLES',                                 'vi'),
        ('LIST OF FIGURES',                                'vii'),
        ('LIST OF ABBREVIATIONS',                          'viii'),
        ('CHAPTER 1: INTRODUCTION',                        '1'),
        ('1.1 Problem Definition',                         '1'),
        ('1.2 Background About the Project Idea',          '2'),
        ('1.3 Objectives of the Proposed System',          '3'),
        ('1.4 Feasibility Study, Need and Significance',   '4'),
        ('1.5 Novelty of the Project',                     '5'),
        ('1.6 Technical Specification',                    '6'),
        ('CHAPTER 2: LITERATURE REVIEW',                   '8'),
        ('2.1 Existing Systems and Related Work',          '8'),
        ('2.2 Limitations of Existing Systems',            '10'),
        ('CHAPTER 3: PROPOSED SYSTEM',                     '11'),
        ('3.1 System Architecture',                        '11'),
        ('3.2 System Modules',                             '12'),
        ('3.3 Key Algorithms',                             '13'),
        ('3.4 Advantages Over Existing System',            '14'),
        ('CHAPTER 4: SOFTWARE REQUIREMENT ANALYSIS',       '15'),
        ('4.1 Functional Requirements',                    '15'),
        ('4.1.1 Use Case Diagram',                         '15'),
        ('4.1.2 Use Case Descriptions',                    '16'),
        ('4.2 Non-Functional Requirements',                '17'),
        ('4.3 Major Modules and Their Functionalities',    '18'),
        ('CHAPTER 5: SYSTEM ANALYSIS & DESIGN',            '19'),
        ('5.1 Class Design',                               '19'),
        ('5.2 Sequence Diagrams',                          '20'),
        ('5.3 Activity Diagrams',                          '21'),
        ('5.4 Data Flow Diagrams',                         '22'),
        ('5.5 Database Design',                            '23'),
        ('5.5.1 E-R Diagrams',                             '23'),
        ('5.6 Gantt Chart and PERT Chart',                 '24'),
        ('CHAPTER 6: IMPLEMENTATION / CORE MODULE',        '25'),
        ('6.1 Database Tables and Fields',                 '25'),
        ('6.2 Algorithms and Approaches',                  '27'),
        ('6.3 Implementation of Modules',                  '28'),
        ('CHAPTER 7: RESULTS / OUTPUTS & TESTING',         '30'),
        ('7.1 User Interfaces and Output Screens',         '30'),
        ('7.2 Layouts of Web Pages and Screens',           '32'),
        ('7.3 Design and Test Steps / Criteria',           '33'),
        ('7.4 Testing Process',                            '34'),
        ('CHAPTER 8: CONCLUSIONS / RECOMMENDATIONS',       '36'),
        ('8.1 Objectives Achieved',                        '36'),
        ('8.2 Limitations',                                '37'),
        ('8.3 Future Enhancements',                        '38'),
        ('8.4 Lessons Learned',                            '38'),
        ('CHAPTER 9: REFERENCES',                          '39'),
        ('CHAPTER 10: PLAGIARISM REPORT',                  '41'),
        ('CHAPTER 11: RESEARCH PAPER PUBLICATION',         '42'),
        ('CHAPTER 12: APPENDICES',                         '43'),
        ('12.1 Software / Simulator Details',              '43'),
        ('12.2 Steps to Execute / Run the Project',        '44'),
        ('12.3 Coding (Key Source Code Excerpts)',         '45'),
    ]

    table = doc.add_table(rows=len(toc_entries), cols=2)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, (title, page_no) in enumerate(toc_entries):
        row = table.rows[i]
        c0 = row.cells[0]
        p0 = c0.paragraphs[0]
        p0.clear()
        run0 = p0.add_run(title)
        is_chapter = title.startswith('CHAPTER') or title in [
            'CERTIFICATE','ACKNOWLEDGEMENT','DECLARATION','ABSTRACT',
            'TABLE OF CONTENTS','LIST OF TABLES','LIST OF FIGURES','LIST OF ABBREVIATIONS']
        run0.bold = is_chapter
        run0.font.size = Pt(12)
        run0.font.name = 'Times New Roman'
        if not is_chapter:
            p0.paragraph_format.left_indent = Cm(0.6)

        c1 = row.cells[1]
        p1 = c1.paragraphs[0]
        p1.clear()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run1 = p1.add_run(page_no)
        run1.bold = is_chapter
        run1.font.size = Pt(12)
        run1.font.name = 'Times New Roman'

    doc.add_paragraph()


def add_list_of_tables(doc):
    add_page_break(doc)
    heading1(doc, 'LIST OF TABLES')
    separator_line(doc)
    doc.add_paragraph()

    tables_list = [
        ('Table 1.1',  'Hardware Requirements',                        '6'),
        ('Table 1.2',  'Software Requirements',                        '7'),
        ('Table 2.1',  'Comparative Analysis of Existing Systems',     '10'),
        ('Table 4.1',  'Use Case Descriptions',                        '16'),
        ('Table 4.2',  'Non-Functional Requirements',                  '17'),
        ('Table 4.3',  'Major Modules and Functionalities',            '18'),
        ('Table 5.1',  'Class Design Summary',                         '19'),
        ('Table 5.2',  'Project Gantt / PERT Timeline',                '24'),
        ('Table 6.1',  'Database Table Schemas and Fields',            '25'),
        ('Table 6.2',  'Core Recognition Algorithms',                  '27'),
        ('Table 6.3',  'REST API Endpoints',                           '28'),
        ('Table 7.2',  'Web Page Layouts Summary',                     '32'),
        ('Table 7.3',  'Design Criteria and Test Conditions',          '33'),
        ('Table 7.4',  'Integration Test Case Results',                '34'),
        ('Table 11.1', 'Research Publication Status',                  '42'),
        ('Table 12.1', 'Software / Tools Details',                     '43'),
    ]

    t = doc.add_table(rows=len(tables_list), cols=3)
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (num, caption, pg) in enumerate(tables_list):
        row = t.rows[i]
        for j, val in enumerate([num, caption, pg]):
            p = row.cells[j].paragraphs[0]
            p.clear()
            run = p.add_run(val)
            run.font.size = Pt(12)
            run.font.name = 'Times New Roman'
            if j == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph()


def add_list_of_figures(doc):
    add_page_break(doc)
    heading1(doc, 'LIST OF FIGURES')
    separator_line(doc)
    doc.add_paragraph()

    figs_list = [
        ('Figure 4.1',  'Factored Use Case Diagram of CoopSync AI',                              '15'),
        ('Figure 5.1',  'Class Architecture Diagram',                                             '19'),
        ('Figure 5.2',  'Sequence Diagram: Biometric Attendance Flow',                            '20'),
        ('Figure 5.3',  'Activity Diagram: Background Model Retraining',                         '21'),
        ('Figure 5.4',  'Level-1 Data Flow Diagram (DFD)',                                        '22'),
        ('Figure 5.5',  'Entity-Relationship (E-R) Diagram',                                      '23'),
        ('Figure 5.6',  'Gantt Chart and PERT Network Diagram',                                   '24'),
        ('Figure 7.1',  'Landing Page: Public-facing CoopSync AI Dashboard',                     '30'),
        ('Figure 7.2',  'Face Attendance Scanner with Biometric Recognition UI',                  '30'),
        ('Figure 7.3',  'Student Registration and Web Face Enrollment Modal',                     '31'),
        ('Figure 7.4',  'Student ERP View with Attendance Ring and Skills Cloud',                 '31'),
        ('Figure 7.5',  'Analytics Dashboard with KPI Cards and Chart.js Graphs',                '31'),
        ('Figure 7.6',  'Digital Certificates View with QR Code Verification',                   '31'),
        ('Figure 7.7',  'Cooperative Employment Portal with AI Skill Match Badges',               '32'),
        ('Figure 7.8',  'CoopSync AI Web Application Layout Blueprint (Biometric Scanner View)', '32'),
    ]

    t = doc.add_table(rows=len(figs_list), cols=3)
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (num, caption, pg) in enumerate(figs_list):
        row = t.rows[i]
        for j, val in enumerate([num, caption, pg]):
            p = row.cells[j].paragraphs[0]
            p.clear()
            run = p.add_run(val)
            run.font.size = Pt(12)
            run.font.name = 'Times New Roman'
            if j == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph()


"""

with open('generate_report.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find add_abbreviations and insert before it
idx = content.find('def add_abbreviations(doc):')
if idx >= 0:
    content = content[:idx] + TOC_FUNCTIONS + content[idx:]
    with open('generate_report.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: TOC, List of Tables, List of Figures functions inserted.')
    print('Total lines:', content.count('\n'))
else:
    print('ERROR: Could not find add_abbreviations insertion point!')
