"""
Inject diagram figure calls into generate_report.py chapters 4 and 5.
"""

with open('generate_report.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Chapter 4: Use Case Diagram
    (
        '    heading3(doc, "4.1.1 Use Case Diagram (Textual Representation)")\n    body(doc,',
        '    heading3(doc, "4.1.1 Use Case Diagram")\n'
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig4_1_use_case.png"),\n'
        '               "Figure 4.1: Factored Use Case Diagram of CoopSync AI")\n'
        '    body(doc,'
    ),
    # Chapter 5: Class diagram after table
    (
        '    add_table_with_data(doc, ["Class", "Key Attributes", "Key Methods", "Relationships"],',
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_1_class_diagram.png"),\n'
        '               "Figure 5.1: Class Architecture Diagram")\n'
        '    add_table_with_data(doc, ["Class", "Key Attributes", "Key Methods", "Relationships"],'
    ),
    # Chapter 5: Sequence diagram after seq1
    (
        '    code_block(doc, seq1)\n\n    heading3(doc, "5.2.2 Student Enrollment',
        '    code_block(doc, seq1)\n'
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_2_sequence_diagram.png"),\n'
        '               "Figure 5.2: Sequence Diagram - Biometric Attendance Flow")\n\n'
        '    heading3(doc, "5.2.2 Student Enrollment'
    ),
    # Chapter 5: Activity diagram after act1
    (
        '    code_block(doc, act1)\n\n    heading2(doc, "5.4 Data Flow',
        '    code_block(doc, act1)\n'
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_3_activity_diagram.png"),\n'
        '               "Figure 5.3: Activity Diagram - Background Model Retraining Pipeline")\n\n'
        '    heading2(doc, "5.4 Data Flow'
    ),
    # Chapter 5: DFD after dfd1
    (
        '    code_block(doc, dfd1)\n\n    heading2(doc, "5.5 Database Design")',
        '    code_block(doc, dfd1)\n'
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_4_dfd.png"),\n'
        '               "Figure 5.4: Level-1 Data Flow Diagram (DFD)")\n\n'
        '    heading2(doc, "5.5 Database Design")'
    ),
    # Chapter 5: ER diagram after er_text
    (
        '    code_block(doc, er_text)\n\n    heading2(doc, "5.6 Project Timeline")',
        '    code_block(doc, er_text)\n'
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_5_er_diagram.png"),\n'
        '               "Figure 5.5: Entity-Relationship (E-R) Diagram")\n\n'
        '    heading2(doc, "5.6 Project Timeline")'
    ),
    # Chapter 5: Gantt+PERT figure before timeline table
    (
        '    add_table_with_data(doc, ["Timeline", "Phase", "Activities"], timeline_rows,',
        '    add_figure(doc, os.path.join(FIGURES_DIR, "fig5_6_gantt_pert.png"),\n'
        '               "Figure 5.6: Gantt Chart and PERT Network Diagram")\n'
        '    add_table_with_data(doc, ["Timeline", "Phase", "Activities"], timeline_rows,'
    ),
]

success = []
for old, new in replacements:
    if old in content:
        content = content.replace(old, new, 1)
        success.append('DONE')
    else:
        success.append('NOT FOUND')

for i, ((old, _), status) in enumerate(zip(replacements, success)):
    print(f'  [{status}] Replacement {i+1}: {old[:60]!r}...')

with open('generate_report.py', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nAll done. Total lines: {content.count(chr(10))}')
