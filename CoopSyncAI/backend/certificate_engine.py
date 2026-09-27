import os
import io
import qrcode
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from datetime import datetime

CERTIFICATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certificates")
os.makedirs(CERTIFICATES_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_borders()
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_borders(self):
        self.saveState()
        # Outer border
        self.setStrokeColor(colors.HexColor("#312e81"))
        self.setLineWidth(4)
        self.rect(20, 20, 752, 572)
        
        # Inner golden border
        self.setStrokeColor(colors.HexColor("#f59e0b"))
        self.setLineWidth(1.5)
        self.rect(26, 26, 740, 560)
        self.restoreState()

def generate_pdf_certificate(student_name: str, course_title: str, cert_id: str, grade="A+", issue_date=None):
    if not issue_date:
        issue_date = datetime.now().strftime("%B %d, %Y")
        
    pdf_filename = f"certificate_{cert_id}.pdf"
    pdf_path = os.path.join(CERTIFICATES_DIR, pdf_filename)
    
    # 1. Generate Verification QR code image
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    verify_url = f"https://coopsync.gov.in/verify/{cert_id}"
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#1e1b4b", back_color="#ffffff")
    
    qr_io = io.BytesIO()
    qr_img.save(qr_io, format="PNG")
    qr_io.seek(0)
    
    qr_temp_path = os.path.join(CERTIFICATES_DIR, f"qr_{cert_id}.png")
    with open(qr_temp_path, "wb") as f:
        f.write(qr_io.getvalue())

    # 2. Build Document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#1e1b4b"),
        alignment=1
    )
    
    sub_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4b5563"),
        alignment=1
    )
    
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#4338ca"),
        alignment=1
    )

    story = [
        Spacer(1, 15),
        Paragraph("COOPERATIVE SKILLS & CAPACITY BUILDING ECOSYSTEM", sub_style),
        Spacer(1, 4),
        Paragraph("CERTIFICATE OF EXCELLENCE & COMPLETION", title_style),
        Spacer(1, 15),
        Paragraph("This is proudly presented to certify that", sub_style),
        Spacer(1, 10),
        Paragraph(student_name.upper(), name_style),
        Spacer(1, 10),
        Paragraph(f"has successfully demonstrated mastery, regular attendance, and qualified for the curriculum in", sub_style),
        Spacer(1, 6),
        Paragraph(f"<b>{course_title}</b>", ParagraphStyle('CourseTitle', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor("#111827"), alignment=1)),
        Spacer(1, 15),
        Paragraph(f"Grade Achieved: <b>{grade}</b> | Verification ID: <b>{cert_id}</b> | Issued on: <b>{issue_date}</b>", sub_style),
        Spacer(1, 20),
    ]

    # Footer table with signatures & QR verification
    qr_img_obj = RLImage(qr_temp_path, width=1.1*inch, height=1.1*inch)
    
    footer_data = [
        [
            Paragraph("<b>Prof. R. K. Sharma</b><br/>Director, Cooperative Training", ParagraphStyle('Sign1', alignment=1, fontSize=10, textColor=colors.HexColor("#374151"))),
            qr_img_obj,
            Paragraph("<b>Dr. Anita Verma</b><br/>Dean of Academic & Skills ERP", ParagraphStyle('Sign2', alignment=1, fontSize=10, textColor=colors.HexColor("#374151")))
        ]
    ]
    
    footer_table = Table(footer_data, colWidths=[2.5*inch, 2*inch, 2.5*inch])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    story.append(footer_table)
    
    doc.build(story, canvasmaker=NumberedCanvas)
    
    # Cleanup temp qr
    if os.path.exists(qr_temp_path):
        try:
            os.remove(qr_temp_path)
        except:
            pass
            
    return pdf_path
