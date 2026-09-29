import json
import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import (
    User, UserRole, Institute, Programme, Batch, Enrollment, Timetable,
    Course, Module, Lesson, LessonProgress, Quiz, QuizQuestion, QuizAttempt,
    Certificate, Skill, TraineeSkill, Job, JobApplication, Device, AttendanceRecord
)
from backend.auth import hash_password
from backend.crypto import sign_credential, get_public_key_pem
from backend.matcher import ExplainableCandidateMatcher

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "ramesh@sahakarsetu.gov.in").first():
            print("Database already contains seed data.")
            return

        print("Seeding Sahakar Setu database with realistic SIH demo data...")

        # 1. Institutions
        inst1 = Institute(
            name="PACS Training Centre – Rampur",
            code="PTC-RAMPUR-01",
            city="Rampur",
            state="Uttar Pradesh",
            contact_email="director@ptcrampur.gov.in"
        )
        inst2 = Institute(
            name="Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)",
            code="VAMNICOM-PUNE",
            city="Pune",
            state="Maharashtra",
            contact_email="info@vamnicom.gov.in"
        )
        db.add_all([inst1, inst2])
        db.flush()

        # 2. Hardware Devices
        kiosk1 = Device(
            device_id="KIOSK-001",
            name="Rampur Doorway Biometric Kiosk #1",
            institute_id=inst1.id,
            device_type="KIOSK",
            location_room="Lecture Hall A Entrance",
            status="ONLINE"
        )
        kiosk2 = Device(
            device_id="TAB-EDGE-02",
            name="Field Attendance Rugged Tablet",
            institute_id=inst1.id,
            device_type="TABLET",
            location_room="Mobile Unit Rampur",
            status="ONLINE"
        )
        db.add_all([kiosk1, kiosk2])
        db.flush()

        # 3. Users with various roles
        ramesh = User(
            email="ramesh@sahakarsetu.gov.in",
            hashed_password=hash_password("password123"),
            full_name="Ramesh Kumar",
            role=UserRole.TRAINEE,
            phone="+91 98765 43210",
            location="Rampur, Uttar Pradesh",
            institute_id=inst1.id,
            pacs_name="PACS Rampur Primary Credit Society"
        )

        trainer_priya = User(
            email="trainer@sahakarsetu.gov.in",
            hashed_password=hash_password("password123"),
            full_name="Dr. Priya Sharma",
            role=UserRole.TRAINER,
            phone="+91 98111 22334",
            location="Rampur, Uttar Pradesh",
            institute_id=inst1.id,
            pacs_name="NCCT Senior Faculty"
        )

        admin_rajesh = User(
            email="admin@rampur.ncct.gov.in",
            hashed_password=hash_password("password123"),
            full_name="Rajesh Verma",
            role=UserRole.INSTITUTE_ADMIN,
            phone="+91 94123 56789",
            location="Rampur, Uttar Pradesh",
            institute_id=inst1.id,
            pacs_name="Director, PTC Rampur"
        )

        recruiter_amit = User(
            email="recruiter@rampurpacs.coop",
            hashed_password=hash_password("password123"),
            full_name="Amit Patel",
            role=UserRole.RECRUITER,
            phone="+91 99234 88776",
            location="Rampur, Uttar Pradesh",
            institute_id=inst1.id,
            pacs_name="Rampur Primary Agricultural Credit Society"
        )

        super_admin = User(
            email="superadmin@sahakarsetu.gov.in",
            hashed_password=hash_password("password123"),
            full_name="National Super Admin",
            role=UserRole.SUPER_ADMIN,
            phone="+91 91111 00000",
            location="New Delhi",
            institute_id=inst2.id,
            pacs_name="Ministry of Cooperation, GoI"
        )

        # Additional trainee for comparison
        suresh = User(
            email="suresh.patel@sahakarsetu.gov.in",
            hashed_password=hash_password("password123"),
            full_name="Suresh Patel",
            role=UserRole.TRAINEE,
            phone="+91 97654 32109",
            location="Moradabad, Uttar Pradesh",
            institute_id=inst1.id,
            pacs_name="PACS Moradabad Rural"
        )

        db.add_all([ramesh, trainer_priya, admin_rajesh, recruiter_amit, super_admin, suresh])
        db.flush()

        # 4. Programme & Batch
        prog = Programme(
            institute_id=inst1.id,
            title="PACS Digitalization & Cooperative Management",
            code="NCCT-PDCM-2026",
            description="Comprehensive certification for operating computerized PACS, NABARD accounting, Day-Book balancing, and member credit disbursal.",
            duration_weeks=6,
            is_active=True
        )
        db.add(prog)
        db.flush()

        batch = Batch(
            programme_id=prog.id,
            name="Batch 2026-A1 (Rampur Rural Cohort)",
            start_date=datetime.datetime.utcnow() - datetime.timedelta(days=30),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=12),
            max_capacity=35,
            trainer_id=trainer_priya.id,
            status="IN_PROGRESS"
        )
        db.add(batch)
        db.flush()

        # Enrollments
        enroll_ramesh = Enrollment(
            trainee_id=ramesh.id,
            batch_id=batch.id,
            status="ACTIVE",
            enrolled_at=datetime.datetime.utcnow() - datetime.timedelta(days=28)
        )
        enroll_suresh = Enrollment(
            trainee_id=suresh.id,
            batch_id=batch.id,
            status="ACTIVE",
            enrolled_at=datetime.datetime.utcnow() - datetime.timedelta(days=25)
        )
        db.add_all([enroll_ramesh, enroll_suresh])
        db.flush()

        # Timetables
        tt1 = Timetable(
            batch_id=batch.id,
            day_of_week="Monday",
            start_time="09:30 AM",
            end_time="12:30 PM",
            subject="PACS Double-Entry Bookkeeping & General Ledger",
            room="Smart Computer Lab 1"
        )
        tt2 = Timetable(
            batch_id=batch.id,
            day_of_week="Wednesday",
            start_time="10:00 AM",
            end_time="01:00 PM",
            subject="National PACS ERP Voucher Entry & Reconciliation",
            room="Digital Sandbox 2"
        )
        tt3 = Timetable(
            batch_id=batch.id,
            day_of_week="Friday",
            start_time="02:00 PM",
            end_time="05:00 PM",
            subject="KCC Loan Processing & Interest Subvention Rules",
            room="Seminar Hall 1"
        )
        db.add_all([tt1, tt2, tt3])

        # 5. Course, Modules & Lessons
        course = Course(
            programme_id=prog.id,
            title="PACS Accounting & ERP Operations Masterclass",
            code="CRS-PACS-101",
            description="Master the 22 core accounting and loan modules of computerized PACS with daily Day-Book closing practicals.",
            thumbnail="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
            total_lessons=4,
            category="PACS Accounting & ERP"
        )
        db.add(course)
        db.flush()

        mod1 = Module(course_id=course.id, title="Module 1: Principles of Cooperative Bookkeeping", order=1)
        mod2 = Module(course_id=course.id, title="Module 2: Day-Book Balancing & General Ledger Posting", order=2)
        db.add_all([mod1, mod2])
        db.flush()

        l1 = Lesson(
            module_id=mod1.id,
            title="Overview of Model Byelaws & PACS Double-Entry System",
            order=1,
            duration_minutes=20,
            content_text=(
                "Under the Model Byelaws 2023, PACS operate as multi-purpose cooperative societies. "
                "Every financial transaction must follow double-entry principles: Debit what comes in, Credit what goes out. "
                "The core financial books maintained are: 1) Cash Book, 2) Day-Book, 3) General Ledger, 4) Loan Ledger, and 5) Share Register."
            ),
            summary_hi="मॉडल उप-नियम 2023 के तहत पैक्स बहुउद्देश्यीय सहकारी संस्था के रूप में कार्य करते हैं। प्रत्येक वित्तीय लेन-देन दोहरी प्रविष्टि प्रणाली का पालन करता है।",
            audio_url="https://actions.google.com/sounds/v1/ambiences/office_working.ogg"
        )
        l2 = Lesson(
            module_id=mod1.id,
            title="Kisan Credit Card (KCC) Processing & Subvention Claims",
            order=2,
            duration_minutes=25,
            content_text=(
                "KCC loans are granted up to ₹3,00,000 for seasonal crop production. "
                "The base interest is 7%. When farmers repay promptly within 365 days, a 3% prompt repayment incentive applies, "
                "yielding an effective 4% interest rate. Operators must upload repayment scrolls directly to DCCB gateway."
            ),
            summary_hi="किसान क्रेडिट कार्ड ऋण ₹3,00,000 तक 7% ब्याज पर उपलब्ध है। समय पर भुगतान पर 3% अतिरिक्त छूट मिलती है।",
            audio_url="https://actions.google.com/sounds/v1/ambiences/keyboard_typing.ogg"
        )
        l3 = Lesson(
            module_id=mod2.id,
            title="Step-by-Step Day-Book Closing & Cash Balancing",
            order=1,
            duration_minutes=30,
            content_text=(
                "The daily Day-Book closing protocol requires: (1) Totaling all receipt vouchers, (2) Totaling all payment vouchers, "
                "(3) Verifying physical cash in vault matches closing cash balance, (4) Dual verification by Secretary and Cashier, "
                "and (5) Generating the daily EOD summary report for the DCCB auditor."
            ),
            summary_hi="दैनिक डे-बुक बंद करने की प्रक्रिया: सभी रसीद व भुगतान वाउचर का योग, भौतिक नकद मिलान, और सचिव-कैशियर का संयुक्त हस्ताक्षर।",
            audio_url="https://actions.google.com/sounds/v1/ambiences/office_working.ogg"
        )
        l4 = Lesson(
            module_id=mod2.id,
            title="NABARD Statutory Audit Preparation & Ledger Balancing",
            order=2,
            duration_minutes=25,
            content_text=(
                "Annual statutory audit requires trial balance preparation where total debit balances equal credit balances. "
                "Depreciation on godowns and fertilizer storage assets must be computed per NABARD guidelines. "
                "Overdue loan provisioning must be categorized into Sub-Standard, Doubtful, and Loss assets."
            ),
            summary_hi="नाबार्ड सांविधिक लेखापरीक्षा: ट्रायल बैलेंस तैयार करना और अतिदेय ऋणों का सही वर्गीकरण सुनिश्चित करना।",
            audio_url="https://actions.google.com/sounds/v1/ambiences/keyboard_typing.ogg"
        )
        db.add_all([l1, l2, l3, l4])
        db.flush()

        # Mark lessons completed for Ramesh
        lp1 = LessonProgress(trainee_id=ramesh.id, lesson_id=l1.id, completed=True, completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=5))
        lp2 = LessonProgress(trainee_id=ramesh.id, lesson_id=l2.id, completed=True, completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=4))
        lp3 = LessonProgress(trainee_id=ramesh.id, lesson_id=l3.id, completed=True, completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=3))
        lp4 = LessonProgress(trainee_id=ramesh.id, lesson_id=l4.id, completed=True, completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1))
        db.add_all([lp1, lp2, lp3, lp4])

        # 6. Quiz & Questions
        quiz = Quiz(
            course_id=course.id,
            title="PACS Accounting Certification Assessment 2026",
            passing_score=70
        )
        db.add(quiz)
        db.flush()

        q1 = QuizQuestion(
            quiz_id=quiz.id,
            question_text="What is the net effective interest rate for prompt repayment of KCC loans up to ₹3,00,000 under the Modified Interest Subvention Scheme?",
            options_json=json.dumps(["7% p.a.", "4% p.a.", "3% p.a.", "5.5% p.a."]),
            correct_answer_index=1,
            explanation="Base subvented rate is 7% minus 3% prompt repayment incentive = 4% net interest."
        )
        q2 = QuizQuestion(
            quiz_id=quiz.id,
            question_text="Which book of prime entry is closed daily and physically reconciled with cash in hand in a PACS?",
            options_json=json.dumps(["General Ledger", "Day-Book (Cash Book)", "Share Register", "Audit Balance Sheet"]),
            correct_answer_index=1,
            explanation="The Day-Book (Cash Book) is reconciled daily with physical vault count and dual sign-off."
        )
        q3 = QuizQuestion(
            quiz_id=quiz.id,
            question_text="Under the National Computerization Project, how many PACS are being digitized across India?",
            options_json=json.dumps(["25,000 PACS", "50,000 PACS", "79,630 PACS", "1,20,000 PACS"]),
            correct_answer_index=2,
            explanation="The Centrally Sponsored Scheme covers 79,630 functional PACS with ₹2,925.39 Cr funding."
        )
        db.add_all([q1, q2, q3])
        db.flush()

        # Ramesh's Quiz Attempt (Passed with 100%)
        qa = QuizAttempt(
            quiz_id=quiz.id,
            trainee_id=ramesh.id,
            score=100.0,
            passed=True,
            answers_json=json.dumps({"0": 1, "1": 1, "2": 2}),
            attempted_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        db.add(qa)
        db.flush()

        # 7. Cryptographic Ed25519 Certificate for Ramesh Kumar
        cert_payload = {
            "cert_id": "CERT-NCCT-2026-RAMESH01",
            "trainee_name": "Ramesh Kumar",
            "trainee_id": ramesh.id,
            "course_title": "PACS Accounting & ERP Operations Masterclass",
            "institute": "PACS Training Centre – Rampur",
            "grade": "A+",
            "score": 100.0,
            "issued_by": "National Council for Cooperative Training (NCCT)",
            "issue_date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
        }
        sig = sign_credential(cert_payload)
        pub_pem = get_public_key_pem()

        cert = Certificate(
            certificate_id="CERT-NCCT-2026-RAMESH01",
            trainee_id=ramesh.id,
            course_id=course.id,
            issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=1),
            issuer_name="National Council for Cooperative Training (NCCT)",
            grade="A+",
            score=100.0,
            ed25519_signature=sig,
            public_key_pem=pub_pem,
            verification_url="http://localhost:8000/api/certificates/verify/CERT-NCCT-2026-RAMESH01",
            metadata_json=json.dumps(cert_payload)
        )
        db.add(cert)
        db.flush()

        # 8. Skills
        s1 = Skill(name="PACS Accounting", category="Accounting")
        s2 = Skill(name="Day-Book Closing", category="Operations")
        s3 = Skill(name="NABARD Compliance", category="Statutory")
        s4 = Skill(name="KCC Loan Disbursal", category="Credit")
        s5 = Skill(name="Member KYC Verification", category="Compliance")
        db.add_all([s1, s2, s3, s4, s5])
        db.flush()

        # Trainee Skills for Ramesh
        ts1 = TraineeSkill(trainee_id=ramesh.id, skill_id=s1.id, proficiency_level=5, verified=True, verified_by_cert_id=cert.certificate_id)
        ts2 = TraineeSkill(trainee_id=ramesh.id, skill_id=s2.id, proficiency_level=5, verified=True, verified_by_cert_id=cert.certificate_id)
        ts3 = TraineeSkill(trainee_id=ramesh.id, skill_id=s3.id, proficiency_level=4, verified=True, verified_by_cert_id=cert.certificate_id)
        ts4 = TraineeSkill(trainee_id=ramesh.id, skill_id=s4.id, proficiency_level=4, verified=True, verified_by_cert_id=cert.certificate_id)
        db.add_all([ts1, ts2, ts3, ts4])

        # 9. Attendance Events (Simulating edge biometric kiosk events)
        att1 = AttendanceRecord(
            event_id="EVT-RAMPUR-9001",
            device_id=kiosk1.device_id,
            trainee_id=ramesh.id,
            batch_id=batch.id,
            method="FACE",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=3, hours=4),
            location="Lecture Hall A Entrance",
            signature="a89f92b7c61d43e2",
            sync_status="SYNCED",
            verified=True
        )
        att2 = AttendanceRecord(
            event_id="EVT-RAMPUR-9002",
            device_id=kiosk1.device_id,
            trainee_id=ramesh.id,
            batch_id=batch.id,
            method="NFC",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=2, hours=3),
            location="Lecture Hall A Entrance",
            signature="c72e1189a054db90",
            sync_status="SYNCED",
            verified=True
        )
        att3 = AttendanceRecord(
            event_id="EVT-RAMPUR-9003",
            device_id=kiosk1.device_id,
            trainee_id=ramesh.id,
            batch_id=batch.id,
            method="QR",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=2),
            location="Lecture Hall A Entrance",
            signature="b447dc9319fa8211",
            sync_status="SYNCED",
            verified=True
        )
        db.add_all([att1, att2, att3])

        # 10. Cooperative Job Postings
        job1 = Job(
            employer_id=recruiter_amit.id,
            pacs_name="Rampur Primary Agricultural Credit Society",
            title="PACS Chief Accountant & ERP Operator",
            location="Rampur, Uttar Pradesh",
            salary_range="₹25,000 - ₹35,000 / month",
            description="Manage daily Day-Book closing, KCC loan reconciliation, and annual audit filing on the National PACS ERP.",
            required_skills_json=json.dumps(["PACS Accounting", "Day-Book Closing", "NABARD Compliance", "KCC Loan Disbursal"]),
            min_experience_years=0.5,
            status="OPEN"
        )
        job2 = Job(
            employer_id=recruiter_amit.id,
            pacs_name="Moradabad District Cooperative Bank",
            title="Cooperative Society Field Officer",
            location="Moradabad, Uttar Pradesh",
            salary_range="₹22,000 - ₹28,000 / month",
            description="Supervise 12 PACS credit disbursals, verify member collateral, and conduct quarterly godown inventory checks.",
            required_skills_json=json.dumps(["KCC Loan Disbursal", "Member KYC Verification", "Warehouse Inventory"]),
            min_experience_years=1.0,
            status="OPEN"
        )
        db.add_all([job1, job2])
        db.flush()

        # Ramesh's Job Application for Job 1
        match_details = ExplainableCandidateMatcher.calculate_match(
            candidate_skills=["PACS Accounting", "Day-Book Closing", "NABARD Compliance", "KCC Loan Disbursal"],
            required_skills=["PACS Accounting", "Day-Book Closing", "NABARD Compliance", "KCC Loan Disbursal"],
            has_certificate=True,
            candidate_location="Rampur, Uttar Pradesh",
            job_location="Rampur, Uttar Pradesh",
            candidate_experience_years=1.0,
            required_experience_years=0.5
        )

        app1 = JobApplication(
            job_id=job1.id,
            trainee_id=ramesh.id,
            status="SHORTLISTED",
            match_score_json=json.dumps(match_details),
            applied_at=datetime.datetime.utcnow() - datetime.timedelta(hours=18)
        )
        db.add(app1)

        db.commit()
        print("Successfully seeded Sahakar Setu database with complete realistic demo data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
