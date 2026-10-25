import pypdf, os

reader = pypdf.PdfReader('Mini_Project_Report_FINAL.pdf')
print('Total pages:', len(reader.pages))
lines = ['# Final Page Inventory: Mini_Project_Report_FINAL.pdf\n',
         f'**Total Pages:** {len(reader.pages)}\n\n',
         '| Page | First Content | Chars | Elements |\n',
         '|---|---|---|---|\n']

for i, page in enumerate(reader.pages, 1):
    text = page.extract_text() or ''
    first = [l.strip() for l in text.split('\n') if l.strip()]
    heading = first[0] if first else '[BLANK]'
    if len(heading) > 50:
        heading = heading[:47] + '...'
    elems = []
    if 'TABLE OF CONTENTS' in text:
        elems.append('TOC')
    if 'LIST OF TABLES' in text:
        elems.append('ListTables')
    if 'LIST OF FIGURES' in text:
        elems.append('ListFigs')
    if 'CHAPTER' in text:
        elems.append('Chapter')
    if 'Table' in text and i > 3:
        elems.append('Table')
    if 'Figure' in text:
        elems.append('Figure')
    if heading == '[BLANK]':
        elems.append('BLANK!')
    elem_str = ' '.join(elems) if elems else 'Text'
    lines.append(f'| {i} | {heading} | {len(text)} | {elem_str} |\n')

with open('AUDIT/final_page_inventory.md', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Saved final page inventory.')
print('File size PDF:', os.path.getsize('Mini_Project_Report_FINAL.pdf'), 'bytes')
print('File size DOCX:', os.path.getsize('Mini_Project_Report_FINAL.docx'), 'bytes')
