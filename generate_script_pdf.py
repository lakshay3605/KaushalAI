from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os

os.makedirs("d:/SIH26087/docs", exist_ok=True)
doc = SimpleDocTemplate("d:/SIH26087/docs/KaushalAI_Demo_Script.pdf", pagesize=letter)
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Heading1"],
    alignment=TA_CENTER,
    fontSize=16,
    spaceAfter=14
)

visual_style = ParagraphStyle(
    "VisualStyle",
    parent=styles["Normal"],
    textColor="green",
    fontName="Helvetica-Oblique",
    fontSize=11,
    spaceAfter=6
)

voice_style = ParagraphStyle(
    "VoiceStyle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=11,
    spaceAfter=12
)

story = []
story.append(Paragraph("<b>KaushalAI: Official SIH Demo Script (90-100s)</b>", title_style))
story.append(Spacer(1, 10))

script = [
    ("[Visual: Start on the KaushalAI Landing Page]", "Voiceover: Welcome to KaushalAI, the unified digital ecosystem designed to transform capacity building for cooperatives across India. Our mission is simple: to make high-quality cooperative training accessible, verifiable, and directly linked to employment."),
    ("[Visual: Click 'Login' and select the 'Trainee' role]", "Voiceover: Let's start with the Trainee experience. Through our multilingual Learning Management System, trainees can seamlessly register for online programmes. The dashboard tracks their progress in real-time, delivering interactive e-learning modules exactly when they need them."),
    ("[Visual: Scroll down to the AI Career Guidance Chatbot on the Trainee Dashboard, Click 'What am I lacking']", "Voiceover: But we don't just stop at training. Our built-in AI Career Counselor analyzes the trainee's skill gaps and provides personalized roadmaps to make them job-ready."),
    ("[Visual: Switch to 'Kiosk Worker' Role -> Click Camera Check-In to show face scan]", "Voiceover: For physical training centres, we've engineered a Smart Kiosk Operator portal. Even in areas with zero internet connectivity, this edge-architecture handles digital attendance via Face Recognition and QR codes, seamlessly syncing data back to the server once online."),
    ("[Visual: Switch to 'Recruiter' Role -> Candidate Matching]", "Voiceover: Once a trainee completes a module, they receive a digitally verifiable certificate. Employers and recruiters can then access their dedicated dashboard to find verified, skill-matched candidates instantly, bridging the gap between education and employment."),
    ("[Visual: Switch to 'Admin' Role -> Add a new Programme and go to Institutes, Hostels & Logistics tab]", "Voiceover: Finally, for the NCCT and Ministry administrators, our Centralized ERP provides a bird's-eye view of the entire nation. From monitoring live attendance to managing timetables, institute capacities, and hostel logistics, everything is tracked in one secure database."),
    ("[Visual: Zoom out / pan over the Admin charts]", "Voiceover: KaushalAI isn't just a portal; it's an end-to-end digital infrastructure ready to empower the cooperative sector of tomorrow. Thank you.")
]

for vis, voice in script:
    story.append(Paragraph(vis, visual_style))
    story.append(Paragraph(f"<b>{voice[:10]}</b>{voice[10:]}", voice_style))

doc.build(story)
print("PDF generated successfully")
