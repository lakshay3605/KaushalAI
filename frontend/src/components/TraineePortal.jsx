import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, CheckCircle2, Clock, UserCheck, 
  Sparkles, Briefcase, FileCheck, ArrowRight, Play, Check, 
  RotateCcw, ShieldCheck, MapPin, ChevronRight, HelpCircle, 
  Send, ExternalLink, Calendar, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../api';

export default function TraineePortal({ user, onOpenKiosk, onSelectCertificateForVerify }) {
  const [activeSubTab, setActiveSubTab] = useState('journey'); // journey, courses, attendance, certificates, ai, jobs
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('What are the official steps for Day-Book closing in a PACS?');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load trainee data
  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, certRes, attRes, enrollRes, jobsRes, appsRes] = await Promise.all([
        apiRequest('/lms/courses'),
        apiRequest('/certificates/my-certificates'),
        apiRequest('/attendance/my-history'),
        apiRequest('/erp/my-enrollments'),
        apiRequest('/jobs'),
        apiRequest('/jobs/my-applications')
      ]);

      setCourses(cRes || []);
      setCertificates(certRes || []);
      setAttendanceRecords(attRes || []);
      setEnrollments(enrollRes || []);
      setJobs(jobsRes || []);
      setMyApplications(appsRes || []);

      if (cRes && cRes.length > 0) {
        loadCourseDetail(cRes[0].id);
      }

      // Load timetable for first enrollment
      if (enrollRes && enrollRes.length > 0 && enrollRes[0].batch_id) {
        const tt = await apiRequest(`/erp/batches/${enrollRes[0].batch_id}/timetable`).catch(() => []);
        setTimetable(tt || []);
      }

      // Load skill gap analysis
      const sg = await apiRequest('/ai/skill-gap').catch(() => null);
      setSkillGap(sg);

    } catch (e) {
      console.error("Failed to load trainee data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadCourseDetail = async (courseId) => {
    try {
      const res = await apiRequest(`/lms/courses/${courseId}`);
      setSelectedCourse(res);
      if (res.modules && res.modules.length > 0 && res.modules[0].lessons.length > 0) {
        loadLessonDetail(res.modules[0].lessons[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLessonDetail = async (lessonId) => {
    try {
      const res = await apiRequest(`/lms/lessons/${lessonId}`);
      setSelectedLesson(res);
    } catch (e) {
      console.error(e);
    }
  };

  const markCurrentLessonComplete = async () => {
    if (!selectedLesson) return;
    try {
      await apiRequest(`/lms/lessons/${selectedLesson.id}/complete`, { method: 'POST' });
      setSelectedLesson({ ...selectedLesson, completed: true });
      loadData();
    } catch (e) {
      alert("Error marking lesson complete: " + e.message);
    }
  };

  const openQuiz = async (quizId) => {
    try {
      const res = await apiRequest(`/lms/quizzes/${quizId}`);
      setQuizData(res);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (e) {
      alert("Error loading quiz: " + e.message);
    }
  };

  const submitQuiz = async () => {
    if (!quizData) return;
    try {
      const res = await apiRequest(`/lms/quizzes/${quizData.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: quizAnswers })
      });
      setQuizResult(res);
      loadData();
    } catch (e) {
      alert("Error submitting quiz: " + e.message);
    }
  };

  const handleApplyJob = async (jobId) => {
    try {
      await apiRequest(`/jobs/${jobId}/apply`, { method: 'POST' });
      alert("Application submitted successfully with verified Ed25519 credentials!");
      loadData();
    } catch (e) {
      alert("Application failed: " + e.message);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    try {
      setIsAiLoading(true);
      const res = await apiRequest('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: aiQuestion })
      });
      setAiResponse(res);
    } catch (e) {
      alert("AI Assistant error: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Trainee Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8 border border-blue-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-extrabold text-2xl shrink-0">
              {user.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">{user.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 uppercase">
                  Candidate ID #{user.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-800 text-blue-200">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{user.pacs_name} • {user.location}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 bg-slate-900/60 border border-white/10 rounded-xl p-3 sm:p-4 text-xs font-mono">
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">ATTENDANCE</span>
              <span className="text-lg font-extrabold text-emerald-400">{attendanceRecords.length} Events</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">CERTIFICATES</span>
              <span className="text-lg font-extrabold text-amber-300">{certificates.length} Issued</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">APPLICATIONS</span>
              <span className="text-lg font-extrabold text-blue-300">{myApplications.length} PACS</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10 overflow-x-auto text-xs sm:text-sm font-semibold">
          {[
            { id: 'journey', label: '🚀 Vertical Flow', icon: ArrowRight },
            { id: 'courses', label: '📚 LMS & Lessons', icon: BookOpen },
            { id: 'attendance', label: '⚡ Smart Attendance', icon: UserCheck },
            { id: 'certificates', label: '🛡️ Ed25519 Credential', icon: Award },
            { id: 'ai', label: '✨ AI Career Assistant', icon: Sparkles },
            { id: 'jobs', label: '💼 PACS Job Exchange', icon: Briefcase }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
                  active 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: VERTICAL FLOW (Step 3 Spec) */}
      {activeSubTab === 'journey' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-900" />
              <span>Step 3: End-to-End Vertical Trainee Journey Checklist</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Track Ramesh Kumar's live progression through the end-to-end capacity building pipeline.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '1. Registration', detail: 'Ramesh Kumar (ID #1) onboarded at PTC Rampur', status: 'COMPLETED' },
                { step: '2. Programme Enrollment', detail: enrollments[0]?.programme_title || 'PACS Digitalization & Cooperative Management', status: 'COMPLETED' },
                { step: '3. Attendance (Edge Kiosk)', detail: `${attendanceRecords.length} biometric sessions verified via KIOSK-001`, status: attendanceRecords.length > 0 ? 'COMPLETED' : 'IN_PROGRESS' },
                { step: '4. LMS Course & Lessons', detail: `${courses[0]?.completed_lessons || 4} of 4 lessons completed`, status: 'COMPLETED' },
                { step: '5. Assessment & Quiz', detail: 'Passed PACS Accounting Assessment with 100%', status: 'COMPLETED' },
                { step: '6. Ed25519 Certificate', detail: certificates[0]?.certificate_id || 'CERT-NCCT-2026-RAMESH01', status: certificates.length > 0 ? 'COMPLETED' : 'PENDING' },
                { step: '7. AI Skill-Gap Analysis', detail: '4 Verified Skills, 80% PACS Chief Accountant readiness', status: 'COMPLETED' },
                { step: '8. 1-Click PACS Job Apply', detail: myApplications[0] ? `Applied to ${myApplications[0].job_title} (${myApplications[0].status})` : 'Ready to apply', status: myApplications.length > 0 ? 'COMPLETED' : 'READY' }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{item.step}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timetable & Programme Enrollment Widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Active Programme Timetable (Batch 2026-A1)</span>
              </h3>
              <div className="space-y-3">
                {timetable.map((tt, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-blue-950">{tt.subject}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tt.day_of_week} • Room: {tt.room}</div>
                    </div>
                    <div className="text-xs font-mono font-semibold bg-white border border-slate-300 px-2.5 py-1 rounded text-slate-700">
                      {tt.start_time} - {tt.end_time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase">QUICK ACTION</span>
                <h4 className="text-lg font-bold mt-1">Smart Doorway Kiosk</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Verify attendance for today's session via simulated INT8 Face Recognition, NFC card tap, or 2D QR scan.
                </p>
              </div>
              <button
                onClick={onOpenKiosk}
                className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Launch Kiosk Simulator</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LMS COURSES & LESSON PLAYER */}
      {activeSubTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Syllabus & Lesson Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-2">Curriculum Structure</h3>
              <p className="text-xs text-slate-500 mb-4">{selectedCourse?.title || 'PACS Course'}</p>

              {selectedCourse?.modules?.map((m) => (
                <div key={m.id} className="mb-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 font-mono">
                    {m.title}
                  </div>
                  <div className="space-y-1.5">
                    {m.lessons?.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => loadLessonDetail(l.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          selectedLesson?.id === l.id 
                            ? 'bg-blue-900 text-white font-bold shadow-sm' 
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {l.completed ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${selectedLesson?.id === l.id ? 'text-amber-400' : 'text-emerald-600'}`} />
                          ) : (
                            <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          )}
                          <span className="truncate">{l.title}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80 shrink-0">{l.duration_minutes}m</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Assessment Button */}
              {selectedCourse?.quiz_id && (
                <div className="pt-4 border-t border-slate-200 mt-4">
                  <button
                    onClick={() => openQuiz(selectedCourse.quiz_id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Take Official Assessment Quiz</span>
                  </button>
                  {selectedCourse?.last_quiz_attempt && (
                    <div className="mt-2 text-center text-[11px] font-mono text-emerald-700 font-bold">
                      ✓ Assessment Passed: {selectedCourse.last_quiz_attempt.score}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Lesson Content Player / Quiz Window */}
          <div className="lg:col-span-8">
            {quizData ? (
              /* Interactive Assessment Quiz View */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-600">CERTIFICATION ASSESSMENT</span>
                    <h3 className="text-lg font-black text-slate-900">{quizData.title}</h3>
                  </div>
                  <button
                    onClick={() => setQuizData(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded bg-slate-100"
                  >
                    Close Quiz
                  </button>
                </div>

                {quizResult ? (
                  /* Quiz Result Screen */
                  <div className="space-y-6">
                    <div className={`p-6 rounded-2xl text-center border ${
                      quizResult.passed 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                        : 'bg-red-50 border-red-300 text-red-950'
                    }`}>
                      <h4 className="text-2xl font-black mb-1">
                        {quizResult.passed ? '🎉 Congratulations! Assessment Passed' : 'Assessment Not Cleared'}
                      </h4>
                      <p className="text-sm font-semibold">
                        Your Score: <span className="font-mono text-xl">{quizResult.score}%</span> (Threshold: {quizResult.passing_threshold}%)
                      </p>
                      {quizResult.certificate_awarded && (
                        <div className="mt-4 p-3 bg-white border border-emerald-400 rounded-xl text-xs text-slate-800">
                          🛡️ <strong>Ed25519 Certificate Issued:</strong> {quizResult.certificate_id}
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setQuizData(null);
                                setActiveSubTab('certificates');
                              }}
                              className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-bold text-xs hover:bg-emerald-800 transition"
                            >
                              View Tamper-Proof Certificate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question Feedback */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-xs uppercase text-slate-500">Answer Analysis & Grounding:</h5>
                      {quizResult.feedback?.map((fb, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div className="flex items-center gap-2 font-bold mb-1">
                            {fb.is_correct ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <span>Question #{idx + 1}</span>
                          </div>
                          <p className="text-slate-600">{fb.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Quiz Questions Form */
                  <div className="space-y-6">
                    {quizData.questions?.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-sm font-bold text-slate-900 mb-3">
                          {idx + 1}. {q.question_text}
                        </p>
                        <div className="space-y-2">
                          {q.options?.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                                quizAnswers[q.id] === oIdx
                                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={quizAnswers[q.id] === oIdx}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: oIdx })}
                                className="w-4 h-4 text-blue-900 focus:ring-blue-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length < quizData.questions.length}
                      className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      Submit Assessment & Generate Certificate
                    </button>
                  </div>
                )}
              </div>
            ) : selectedLesson ? (
              /* Active Lesson Viewer */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-900">LESSON {selectedLesson.order}</span>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedLesson.title}</h3>
                  </div>
                  <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                    ⏱ {selectedLesson.duration_minutes} Minutes
                  </span>
                </div>

                {/* Vernacular Audio Bar */}
                {selectedLesson.audio_url && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">Vernacular Voice Micro-Lesson (&lt;1.2MB)</div>
                        <div className="text-[11px] text-amber-800">Low-Bandwidth Rural Audio Stream</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded">22 Indic Langs</span>
                  </div>
                )}

                {/* Lesson Main Content */}
                <div className="prose max-w-none text-sm text-slate-700 leading-relaxed mb-6 space-y-4">
                  <p>{selectedLesson.content_text}</p>
                </div>

                {/* Hindi Summary Box */}
                {selectedLesson.summary_hi && (
                  <div className="bg-slate-50 border-l-4 border-blue-900 p-4 rounded-r-xl mb-8">
                    <span className="text-[11px] font-bold text-blue-900 uppercase block mb-1">
                      हिंदी सारांश (Vernacular Summary)
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {selectedLesson.summary_hi}
                    </p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    {selectedLesson.completed ? '✓ Lesson Completed' : 'Pending Completion'}
                  </span>
                  <button
                    onClick={markCurrentLessonComplete}
                    disabled={selectedLesson.completed}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      selectedLesson.completed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{selectedLesson.completed ? 'Completed' : 'Mark as Completed'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Select a lesson to begin learning.</div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: SMART ATTENDANCE */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Edge Biometric Attendance Log</h2>
              <p className="text-xs text-slate-500">Mathematically verified physical scans linked to TA/DA stipend calculations.</p>
            </div>
            <button
              onClick={onOpenKiosk}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Simulate Kiosk Scan</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                  <tr>
                    <th className="p-3.5">EVENT ID</th>
                    <th className="p-3.5">DEVICE ID</th>
                    <th className="p-3.5">METHOD</th>
                    <th className="p-3.5">TIMESTAMP</th>
                    <th className="p-3.5">LOCATION</th>
                    <th className="p-3.5">SIGNATURE</th>
                    <th className="p-3.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendanceRecords.map((r) => (
                    <tr key={r.event_id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{r.event_id}</td>
                      <td className="p-3.5 font-mono text-slate-600">{r.device_id}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800 text-[10px]">
                          {r.method}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 text-slate-600">{r.location}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">{r.signature || 'verified'}</td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{r.sync_status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No attendance records recorded yet. Launch the Kiosk simulator above to mark attendance!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAMPER-PROOF CERTIFICATES */}
      {activeSubTab === 'certificates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Tamper-Proof W3C Cryptographic Credentials</h2>
            <p className="text-xs text-slate-500">Asymmetric Ed25519 digital signatures verified in &lt;15ms without blockchain gas fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div key={cert.certificate_id} className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                    NCCT Official Credential
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ed25519 SIGNED</span>
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-950 mb-1">{cert.course_title}</h3>
                <p className="text-xs text-slate-500 mb-4">{cert.issuer_name}</p>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">GRADE</span>
                    <span className="font-extrabold text-blue-900 text-sm">{cert.grade}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">SCORE</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{cert.score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">DATE</span>
                    <span className="font-semibold text-slate-700 text-[11px]">{cert.issue_date}</span>
                  </div>
                </div>

                {/* Cryptographic Proof Details */}
                <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-[11px] font-mono space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cert ID:</span>
                    <span className="text-amber-400 font-bold">{cert.certificate_id}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400">Signature: </span>
                    <span className="text-slate-300">{cert.ed25519_signature?.substring(0, 36)}...</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span>✓ Zero-Gas Offline Verifiable</span>
                  </div>
                </div>

                {/* Public Verification Link */}
                <button
                  onClick={() => onSelectCertificateForVerify(cert.certificate_id)}
                  className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Public Zero-Login Verifier</span>
                </button>
              </div>
            ))}

            {certificates.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white border border-slate-200 rounded-2xl">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">No Certificates Earned Yet</h4>
                <p className="text-xs text-slate-500 mt-1">Complete the course lessons and pass the certification quiz to unlock your Ed25519 digital credential.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AI CAREER ASSISTANT & RAG */}
      {activeSubTab === 'ai' && (
        <div className="space-y-8">
          
          {/* Skill Gap Analysis Box */}
          {skillGap && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-900">AI DETERMINISTIC GAP ANALYZER</span>
                  <h3 className="text-lg font-black text-slate-900">
                    Role Readiness: {skillGap.target_role} ({skillGap.readiness_percentage}%)
                  </h3>
                </div>
                <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${skillGap.readiness_percentage}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase mb-2">Acquired &amp; Verified Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGap.acquired_skills?.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-950 uppercase mb-2">Recommended Competency Enhancements</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGap.skill_gaps?.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Why Candidate Matches Transparent Analysis */}
              {skillGap.why_candidate_matches && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl mb-4 text-xs">
                  <span className="font-extrabold text-blue-950 uppercase tracking-wide block mb-1 font-mono text-[10px]">
                    EVIDENCE-BASED MATCH RATIONALE:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {skillGap.why_candidate_matches}
                  </p>
                </div>
              )}

              {/* What to Learn Next */}
              {skillGap.what_to_learn_next && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-6 text-xs">
                  <span className="font-extrabold text-amber-950 uppercase tracking-wide block mb-1 font-mono text-[10px]">
                    PRESCRIPTIVE NEXT STEPS:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {skillGap.what_to_learn_next}
                  </p>
                </div>
              )}

              {/* Concrete 5-Step Career Pathway */}
              {skillGap.career_pathway && (
                <div className="mb-6 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
                    Structured Cooperative Career Progression Roadmap:
                  </h4>
                  <div className="space-y-2">
                    {skillGap.career_pathway.map((step, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            step.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                            step.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950 font-bold' :
                            'bg-slate-300 text-slate-700'
                          }`}>
                            {step.step}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">{step.title}</span>
                            <p className="text-slate-500 text-[11px] mt-0.5">{step.detail}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          step.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Courses to Bridge Competency Gap */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
                  Prescribed Learning Modules to Close Competency Gap:
                </h4>
                {skillGap.recommended_courses?.map((rc, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{rc.title}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{rc.reason}</p>
                      {rc.skill_targeted && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Target: {rc.skill_targeted} ({rc.duration})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-blue-900 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      {rc.course_code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded RAG Knowledge Assistant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">Grounded Cooperative RAG Assistant</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time retrieval augmented generation strictly grounded in Ministry of Cooperation Model Byelaws, 
              NABARD circulars, and NCCT capacity curriculum. Out-of-domain refusal guardrail enabled.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about PACS accounting, KCC interest subvention, or Day-Book..."
                className="flex-1 text-xs border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
              />
              <button
                onClick={handleAskAi}
                disabled={isAiLoading}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                {isAiLoading ? 'Retrieving...' : 'Ask AI'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                'What are the official steps for Day-Book closing in a PACS?',
                'Explain the KCC interest subvention rate structure.',
                'What 25 business activities can PACS now perform under Model Byelaws?'
              ].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiQuestion(qp);
                  }}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                >
                  💡 {qp}
                </button>
              ))}
            </div>

            {/* AI Response Display */}
            {aiResponse && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Grounded System Response</span>
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {aiResponse.guardrail_status}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed text-sm mb-4">
                  {aiResponse.answer}
                </p>

                {aiResponse.sources && aiResponse.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1.5 uppercase font-bold">
                      Verified Policy Citations:
                    </span>
                    <div className="space-y-1">
                      {aiResponse.sources.map((s, idx) => (
                        <div key={idx} className="text-[11px] text-blue-900 bg-white p-2 rounded border border-slate-200">
                          <strong>[{s.id}] {s.title}</strong> — {s.source}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: PACS JOB EXCHANGE */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Cooperative Employment Exchange</h2>
            <p className="text-xs text-slate-500">
              Direct recruitment portal bridging certified rural talent into 79,630 computerized PACS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 font-mono">{job.pacs_name}</span>
                    <span className="text-xs font-extrabold text-slate-900">{job.salary_range}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-950 mb-1">{job.title}</h3>
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </p>

                  <p className="text-xs text-slate-600 mb-4">{job.description}</p>

                  {/* Explainable Match Scoring Breakdown */}
                  {job.match && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-blue-950">Explainable Match Score</span>
                        <span className="text-base font-black text-emerald-700 font-mono">
                          {job.match.overall_match}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono mb-2">
                        <div className="bg-white p-1 rounded border border-blue-100">
                          <span className="text-slate-400 block">SKILL</span>
                          <span className="font-bold text-slate-800">{job.match.skill_match}%</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-blue-100">
                          <span className="text-slate-400 block">CERT</span>
                          <span className="font-bold text-slate-800">{job.match.certification_match}%</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-blue-100">
                          <span className="text-slate-400 block">LOCATION</span>
                          <span className="font-bold text-slate-800">{job.match.location_match}%</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-blue-100">
                          <span className="text-slate-400 block">EXP</span>
                          <span className="font-bold text-slate-800">{job.match.experience_match}%</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {job.match.explanation}
                      </p>
                    </div>
                  )}

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.required_skills?.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-4 border-t border-slate-200">
                  {job.is_applied ? (
                    <div className="p-2 text-center bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs">
                      ✓ Application Submitted to PACS Recruiter
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplyJob(job.id)}
                      className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer"
                    >
                      1-Click Verified Apply with Ed25519 Credential
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
