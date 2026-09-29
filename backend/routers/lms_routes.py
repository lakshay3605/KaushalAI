from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import datetime
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import (
    Course, Module, Lesson, LessonProgress, Quiz, QuizQuestion, QuizAttempt,
    Certificate, User, UserRole, TraineeSkill, Skill
)
from backend.auth import get_current_user
from backend.crypto import sign_credential, get_public_key_pem
from backend.config import BASE_URL

router = APIRouter(prefix="/api/lms", tags=["Learning Management System"])

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, int] # question_id (str) -> selected option index (int)

@router.get("/courses")
def list_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    results = []

    # Get completed lessons for this trainee
    completed_lesson_ids = set(
        lp.lesson_id for lp in db.query(LessonProgress).filter(
            LessonProgress.trainee_id == current_user.id,
            LessonProgress.completed == True
        ).all()
    )

    for c in courses:
        total_lessons = sum(len(m.lessons) for m in c.modules)
        course_lesson_ids = [l.id for m in c.modules for l in m.lessons]
        completed_in_course = sum(1 for lid in course_lesson_ids if lid in completed_lesson_ids)

        progress_pct = round((completed_in_course / total_lessons * 100), 1) if total_lessons > 0 else 0

        # Check if certified
        cert = db.query(Certificate).filter(
            Certificate.trainee_id == current_user.id,
            Certificate.course_id == c.id
        ).first()

        results.append({
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "thumbnail": c.thumbnail,
            "category": c.category,
            "total_lessons": total_lessons,
            "completed_lessons": completed_in_course,
            "progress_percentage": progress_pct,
            "has_certificate": cert is not None,
            "certificate_id": cert.certificate_id if cert else None
        })
    return results

@router.get("/courses/{course_id}")
def get_course_detail(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    completed_lesson_ids = set(
        lp.lesson_id for lp in db.query(LessonProgress).filter(
            LessonProgress.trainee_id == current_user.id,
            LessonProgress.completed == True
        ).all()
    )

    modules_data = []
    for m in course.modules:
        lessons_data = []
        for l in m.lessons:
            lessons_data.append({
                "id": l.id,
                "title": l.title,
                "order": l.order,
                "duration_minutes": l.duration_minutes,
                "completed": l.id in completed_lesson_ids,
                "has_audio": bool(l.audio_url)
            })
        modules_data.append({
            "id": m.id,
            "title": m.title,
            "order": m.order,
            "lessons": lessons_data
        })

    # Check quiz
    quiz = db.query(Quiz).filter(Quiz.course_id == course.id).first()
    last_attempt = None
    if quiz:
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.trainee_id == current_user.id
        ).order_by(QuizAttempt.attempted_at.desc()).first()
        if attempt:
            last_attempt = {
                "score": attempt.score,
                "passed": attempt.passed,
                "attempted_at": attempt.attempted_at.isoformat()
            }

    cert = db.query(Certificate).filter(
        Certificate.trainee_id == current_user.id,
        Certificate.course_id == course.id
    ).first()

    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "thumbnail": course.thumbnail,
        "category": course.category,
        "modules": modules_data,
        "quiz_id": quiz.id if quiz else None,
        "last_quiz_attempt": last_attempt,
        "certificate_id": cert.certificate_id if cert else None
    }

@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.query(LessonProgress).filter(
        LessonProgress.trainee_id == current_user.id,
        LessonProgress.lesson_id == lesson.id
    ).first()

    return {
        "id": lesson.id,
        "title": lesson.title,
        "order": lesson.order,
        "duration_minutes": lesson.duration_minutes,
        "content_text": lesson.content_text,
        "summary_hi": lesson.summary_hi,
        "audio_url": lesson.audio_url,
        "completed": progress.completed if progress else False,
        "module_id": lesson.module_id,
        "course_id": lesson.module.course_id if lesson.module else None
    }

@router.post("/lessons/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.query(LessonProgress).filter(
        LessonProgress.trainee_id == current_user.id,
        LessonProgress.lesson_id == lesson.id
    ).first()

    if not progress:
        progress = LessonProgress(
            trainee_id=current_user.id,
            lesson_id=lesson.id,
            completed=True,
            completed_at=datetime.datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.completed = True
        progress.completed_at = datetime.datetime.utcnow()

    db.commit()
    return {"message": "Lesson marked completed", "lesson_id": lesson.id, "status": "COMPLETED"}

@router.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_data = []
    for q in quiz.questions:
        options = json.loads(q.options_json)
        questions_data.append({
            "id": q.id,
            "question_text": q.question_text,
            "options": options
        })

    return {
        "id": quiz.id,
        "title": quiz.title,
        "passing_score": quiz.passing_score,
        "total_questions": len(quiz.questions),
        "questions": questions_data
    }

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    correct_count = 0
    feedback = []
    for q in questions:
        selected = payload.answers.get(str(q.id))
        is_correct = (selected == q.correct_answer_index)
        if is_correct:
            correct_count += 1
        feedback.append({
            "question_id": q.id,
            "is_correct": is_correct,
            "correct_answer": q.correct_answer_index,
            "explanation": q.explanation
        })

    score_pct = round((correct_count / len(questions)) * 100.0, 1)
    passed = score_pct >= quiz.passing_score

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        trainee_id=current_user.id,
        score=score_pct,
        passed=passed,
        answers_json=json.dumps(payload.answers),
        attempted_at=datetime.datetime.utcnow()
    )
    db.add(attempt)

    # If passed and no certificate exists yet, automatically generate tamper-proof Ed25519 Certificate!
    certificate_id = None
    if passed:
        existing_cert = db.query(Certificate).filter(
            Certificate.trainee_id == current_user.id,
            Certificate.course_id == quiz.course_id
        ).first()

        if not existing_cert:
            cert_code = f"CERT-NCCT-2026-{current_user.full_name[:3].upper()}{current_user.id:03d}"
            cert_payload = {
                "cert_id": cert_code,
                "trainee_name": current_user.full_name,
                "trainee_id": current_user.id,
                "course_title": quiz.course.title if quiz.course else "PACS Training Course",
                "grade": "A+" if score_pct >= 90 else "A",
                "score": score_pct,
                "issued_by": "National Council for Cooperative Training (NCCT)",
                "issue_date": datetime.datetime.utcnow().strftime("%Y-%m-%d")
            }
            sig = sign_credential(cert_payload)
            pub_pem = get_public_key_pem()

            new_cert = Certificate(
                certificate_id=cert_code,
                trainee_id=current_user.id,
                course_id=quiz.course_id,
                issue_date=datetime.datetime.utcnow(),
                grade="A+" if score_pct >= 90 else "A",
                score=score_pct,
                ed25519_signature=sig,
                public_key_pem=pub_pem,
                verification_url=f"{BASE_URL}/api/certificates/verify/{cert_code}",
                metadata_json=json.dumps(cert_payload)
            )
            db.add(new_cert)

            # Award verified skills to trainee
            for s_name in ["PACS Accounting", "Day-Book Closing", "NABARD Compliance"]:
                skill_obj = db.query(Skill).filter(Skill.name == s_name).first()
                if skill_obj:
                    ts = db.query(TraineeSkill).filter(
                        TraineeSkill.trainee_id == current_user.id,
                        TraineeSkill.skill_id == skill_obj.id
                    ).first()
                    if not ts:
                        db.add(TraineeSkill(
                            trainee_id=current_user.id,
                            skill_id=skill_obj.id,
                            proficiency_level=5 if score_pct >= 90 else 4,
                            verified=True,
                            verified_by_cert_id=cert_code
                        ))

            certificate_id = cert_code
        else:
            certificate_id = existing_cert.certificate_id

    db.commit()

    return {
        "score": score_pct,
        "passed": passed,
        "passing_threshold": quiz.passing_score,
        "correct_answers": correct_count,
        "total_questions": len(questions),
        "feedback": feedback,
        "certificate_awarded": passed,
        "certificate_id": certificate_id
    }
