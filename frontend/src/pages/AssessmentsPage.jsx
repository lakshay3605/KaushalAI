import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import ProgressRing from '../components/common/ProgressRing';
import { 
  ClipboardCheck, Calendar, Clock, Award, CheckCircle2, 
  AlertCircle, ArrowRight, ArrowLeft, Lightbulb, Play, Eye, FileText, 
  Lock, X, Check, HelpCircle, BarChart2, Search, RotateCcw,
  BookOpen, ChevronRight, ShieldCheck, Download
} from 'lucide-react';

export default function AssessmentsPage() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { assessmentId } = useParams();

  const isResultPage = location.pathname.endsWith('/result');
  const isTakingTest = Boolean(assessmentId && !isResultPage);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState('all'); // all, upcoming, inprogress, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [syllabusModal, setSyllabusModal] = useState(null);

  // Test Taking State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({ 0: 1, 1: 2 }); // pre-filled for in-progress feeling
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(32 * 60); // 32 minutes
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showAnswerReview, setShowAnswerReview] = useState(false);

  // Real Timer Countdown
  useEffect(() => {
    if (!isTakingTest) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTakingTest]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cooperative Questions Bank for Test
  const testQuestions = [
    {
      id: 1,
      question: 'What is the primary statutory objective of a Primary Agricultural Credit Society (PACS)?',
      options: [
        'Providing commercial speculative real estate loans in metropolitan areas',
        'Disbursing short-term crop loans and medium-term agricultural credit to rural farmers',
        'Acting as a private equity investment trust for non-resident entities',
        'Underwriting foreign exchange securities and derivative contracts'
      ],
      correct: 1,
      explanation: 'PACS form the base tier of the short-term cooperative credit structure (STCCS), primarily advancing production credit to farmer members.'
    },
    {
      id: 2,
      question: 'Under standard PACS Accounting By-laws, what minimum percentage of annual net profit must be compulsorily allocated to the Statutory Reserve Fund?',
      options: [
        '5%',
        '10%',
        '25%',
        '50%'
      ],
      correct: 2,
      explanation: 'Under the Model Cooperative Societies Act and State By-laws, at least 25% of net profit must be transferred to the Statutory Reserve Fund before any dividend distribution.'
    },
    {
      id: 3,
      question: 'In double-entry cooperative bookkeeping, which book of prime entry records all day-to-day cash receipts and cash payments?',
      options: [
        'Day Book / Cash Book',
        'General Ledger',
        'Stock Transfer Register',
        'Fixed Assets Register'
      ],
      correct: 0,
      explanation: 'The Day Book serves as the chronological cash journal for recording all daily monetary transactions of a PACS.'
    },
    {
      id: 4,
      question: 'Which apex financial institution provides national refinancing and technical assistance for the computerization and modernization of PACS?',
      options: [
        'SEBI',
        'NABARD (National Bank for Agriculture and Rural Development)',
        'IRDAI',
        'Pension Fund Regulatory Authority'
      ],
      correct: 1,
      explanation: 'NABARD serves as the central nodal agency for implementing the National PACS Computerization Project under the Ministry of Cooperation.'
    },
    {
      id: 5,
      question: 'Which of the following documents is prepared at the end of an accounting period to verify the arithmetical accuracy of ledger postings?',
      options: [
        'Trial Balance',
        'Promissory Note',
        'Share Certificate',
        'Quorum Attendance Register'
      ],
      correct: 0,
      explanation: 'The Trial Balance compiles debit and credit ledger balances to ensure that total debits equal total credits prior to finalizing the Balance Sheet.'
    },
    {
      id: 6,
      question: 'What constitutes the supreme governing authority in a Primary Agricultural Credit Society?',
      options: [
        'The General Body of all voting members',
        'The Secretary alone',
        'The District Central Cooperative Bank Manager',
        'The External Auditor'
      ],
      correct: 0,
      explanation: 'The General Body of members represents the democratic foundation and ultimate decision-making authority of a cooperative society.'
    }
  ];

  // Syllabus definitions for "View Syllabus"
  const syllabuses = {
    accounting: {
      title: 'PACS Accounting Basics — Official NCCT Syllabus',
      module: 'Module 3 • 40 Marks',
      topics: [
        'Fundamentals of Double-Entry Bookkeeping in Cooperatives',
        'Maintenance of Day Book, Cash Book, and Petty Cash Vouchers',
        'General Ledger Accounts: Members Credit, Fertilizer Inventory, Share Capital',
        'Preparation of Trial Balance and Monthly Financial Statements',
        'Statutory Reserve Fund allocations and Cooperative Audit compliance'
      ]
    },
    governance: {
      title: 'Cooperative Governance — Official NCCT Syllabus',
      module: 'Module 2 • 30 Marks',
      topics: [
        'Democratic Member Control and 1-Member 1-Vote Principle',
        'Powers and Duties of the Board of Directors & Managing Committee',
        'General Body Meetings: Notice, Quorum, and Resolutions',
        'State Cooperative Societies Act & Model By-laws Provisions',
        'Transparency, Disclosure, and Vigilance Mechanisms'
      ]
    }
  };

  // Completed Assessments Table Data (Exact from reference)
  const completedAssessments = [
    {
      id: 'intro-cooperatives',
      title: 'Introduction to Cooperatives',
      module: 'Module 1',
      marks: '38 / 40',
      percentage: '95%',
      result: 'Pass (95%)',
      completedOn: '15 Aug 2025'
    },
    {
      id: 'pacs-governance',
      title: 'PACS Governance Structure',
      module: 'Module 2',
      marks: '26 / 30',
      percentage: '87%',
      result: 'Pass (87%)',
      completedOn: '22 Aug 2025'
    },
    {
      id: 'rural-credit',
      title: 'Rural Credit Operations',
      module: 'Module 4',
      marks: '32 / 40',
      percentage: '80%',
      result: 'Pass (80%)',
      completedOn: '05 Sep 2025'
    },
    {
      id: 'coop-rural-dev',
      title: 'Cooperatives and Rural Development',
      module: 'Module 1',
      marks: '36 / 40',
      percentage: '90%',
      result: 'Pass (90%)',
      completedOn: '12 Sep 2025'
    }
  ];

  // Filter completed assessments by search
  const filteredCompleted = completedAssessments.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.module.toLowerCase().includes(q);
  });

  // Handle Question Answer
  const handleSelectAnswer = (optionIdx) => {
    setAnswers({
      ...answers,
      [currentQIndex]: optionIdx
    });
  };

  const handleToggleReview = (idx) => {
    setMarkedForReview({
      ...markedForReview,
      [idx]: !markedForReview[idx]
    });
  };

  const handleSubmitTest = () => {
    setShowSubmitConfirm(false);
    showToast('Assessment submitted successfully to NCCT Examination Portal!', 'success');
    navigate(`/assessments/${assessmentId || 'pacs-accounting'}/result`);
  };

  // ==============================================================
  // VIEW 1: ASSESSMENT RESULT SCREEN (/assessments/:id/result)
  // ==============================================================
  if (isResultPage) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/assessments')}
            className="flex items-center gap-2 text-xs font-bold text-[#056B46] hover:text-[#085536] transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Assessments</span>
          </button>
          <span className="text-xs font-medium text-slate-500">
            Exam ID: NCCT-PACS-2025-0982
          </span>
        </div>

        {/* Master Result Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#056B46] border border-emerald-200 mb-3">
                <CheckCircle2 size={14} />
                <span>Passed • Grade: Distinction</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                PACS Accounting Basics — Examination Result
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                National Council for Cooperative Training (NCCT) Accredited Assessment
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:px-6 flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-3xl font-black text-[#056B46] tracking-tight">36 / 40</div>
                <div className="text-[11px] text-[#056B46] font-bold">Score (90% Marks)</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#056B46] text-white flex items-center justify-center shrink-0">
                <Award size={24} />
              </div>
            </div>
          </div>

          {/* Performance Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
              <div className="text-[11px] text-slate-500 font-medium">Correct Answers</div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">5 of 6</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
              <div className="text-[11px] text-slate-500 font-medium">Incorrect Answers</div>
              <div className="text-lg font-black text-amber-700 mt-0.5">1 of 6</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
              <div className="text-[11px] text-slate-500 font-medium">Time Taken</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">24m 18s</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
              <div className="text-[11px] text-slate-500 font-medium">Attempt Status</div>
              <div className="text-lg font-black text-blue-700 mt-0.5">1 of 1 (Final)</div>
            </div>
          </div>

          {/* Skills Evaluated Bar Breakdown */}
          <div className="py-6 border-b border-gray-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Competencies & Skills Evaluated
            </h3>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">Double-Entry Bookkeeping & Day Book</span>
                  <span className="font-bold text-emerald-800">100%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#056B46] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">Trial Balance & Ledger Reconciliation</span>
                  <span className="font-bold text-emerald-800">90%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#056B46] rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">Statutory Reserve Fund & Audit Provisions</span>
                  <span className="font-bold text-emerald-800">80%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#056B46] rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Detailed Answers Section */}
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setShowAnswerReview(!showAnswerReview)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={15} />
                <span>{showAnswerReview ? 'Hide Detailed Answers' : 'View Question-by-Question Review'}</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/certificates')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#056B46] border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award size={15} />
                  <span>View Certificate</span>
                </button>
                <button
                  onClick={() => navigate('/learning')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <span>Continue Learning</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Answer Breakdown Panel */}
            {showAnswerReview && (
              <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Question Review & Official Answer Keys
                </h4>
                {testQuestions.map((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.correct;
                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-gray-200/90 text-xs">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {q.question}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct (+6.6 Marks)' : 'Incorrect (0 Marks)'}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-2 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Your Answer: </span>
                          <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                            {userAns !== undefined ? q.options[userAns] : 'Not Answered'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="font-semibold text-slate-700">Correct Answer: </span>
                            <span className="text-emerald-700 font-bold">{q.options[q.correct]}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          Official Note: {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW 2: TEST TAKING INTERFACE (/assessments/:assessmentId)
  // ==============================================================
  if (isTakingTest) {
    const q = testQuestions[currentQIndex];
    const totalQuestions = testQuestions.length;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-5">
        
        {/* Top Header / Timer Bar */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/assessments')}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                PACS Accounting Basics
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Module 3 • 40 Maximum Marks • Passing Score: 75% (30 Marks)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Live Timer Pill */}
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600 animate-pulse" />
              <span>Time Left: {formatTimer(timeLeft)}</span>
            </div>

            {/* Submit Early Button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="py-1.5 px-4 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Submit Assessment
            </button>
          </div>
        </div>

        {/* Question Area & Navigator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Question Card (Col 8) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 flex flex-col justify-between min-h-[440px]">
            <div>
              
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <span className="text-xs font-bold text-[#056B46] uppercase tracking-wider">
                  Question {currentQIndex + 1} of {totalQuestions}
                </span>
                <button
                  onClick={() => handleToggleReview(currentQIndex)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    markedForReview[currentQIndex]
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-gray-200 hover:bg-slate-100'
                  }`}
                >
                  {markedForReview[currentQIndex] ? '★ Marked for Review' : '☆ Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-5">
                {q.question}
              </h3>

              {/* Options List */}
              <div className="space-y-3">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(oIdx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-[#056B46] text-[#056B46] font-semibold ring-1 ring-[#056B46]'
                          : 'bg-white border-gray-200/90 text-slate-700 hover:border-gray-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                        isSelected 
                          ? 'border-[#056B46] bg-[#056B46] text-white' 
                          : 'border-gray-300 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              {currentQIndex === totalQuestions - 1 ? (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit Exam</span>
                  <CheckCircle2 size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Question Navigator (Col 4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Question Navigator
            </h4>

            {/* Status counts */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pb-3 border-b border-gray-100">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="font-bold text-[#056B46]">{answeredCount}</div>
                <div className="text-slate-500 text-[10px]">Answered</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                <div className="font-bold text-amber-700">{Object.values(markedForReview).filter(Boolean).length}</div>
                <div className="text-slate-500 text-[10px]">Review</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-gray-200">
                <div className="font-bold text-slate-700">{totalQuestions - answeredCount}</div>
                <div className="text-slate-500 text-[10px]">Remaining</div>
              </div>
            </div>

            {/* Question Badges */}
            <div className="grid grid-cols-5 gap-2">
              {testQuestions.map((_, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = answers[idx] !== undefined;
                const isReview = markedForReview[idx];

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-[#056B46] ring-offset-1 bg-slate-900 text-white'
                        : isReview
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isAnswered
                        ? 'bg-[#0B6A45] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Instructions box */}
            <div className="pt-3 border-t border-gray-100 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
              <p>• Single attempt allowed for certification credit.</p>
              <p>• Your progress is auto-saved locally every 10 seconds.</p>
              <p>• Ensure stable connectivity before final submission.</p>
            </div>
          </div>

        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#056B46] flex items-center justify-center mb-4 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Submit Assessment?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You have answered <span className="font-bold text-slate-900">{answeredCount} of {totalQuestions} questions</span>. Once submitted, your answers will be graded by the NCCT examination server.
              </p>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleSubmitTest}
                  className="px-5 py-2 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==============================================================
  // VIEW 3: MAIN ASSESSMENT DASHBOARD (Matching Assessment.png)
  // ==============================================================
  return (
    <div className="space-y-6">
      
      {/* 
        ==================================================
        ASSESSMENT HERO BANNER (Matching reference screenshot)
        ==================================================
      */}
      <PageBanner
        title="Assessments"
        subtitle="Test your knowledge, track your progress and get certified."
        rightCardTitle="Assess. Improve. Get Certified."
        rightCardText="Regular assessments help you build real-world skills for better opportunities in the cooperative sector."
        rightCardIcon={ClipboardCheck}
      />

      {/* 
        ==================================================
        FILTER PILLS & SEARCH BAR
        ==================================================
      */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Filter Tabs matching reference: All, Upcoming (2), In Progress (1), Completed (4) */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-[#0B6A45] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Assessments
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'upcoming' 
                ? 'bg-[#0B6A45] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Upcoming (2)
          </button>
          <button
            onClick={() => setActiveFilter('inprogress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'inprogress' 
                ? 'bg-[#0B6A45] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            In Progress (1)
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'completed' 
                ? 'bg-[#0B6A45] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Completed (4)
          </button>
        </div>

        {/* Real-time search filter */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assessments..."
            className="w-full bg-white border border-gray-200/90 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#056B46]/20 focus:border-[#056B46] shadow-2xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

      </div>

      {/* 
        ==================================================
        MAIN ASSESSMENT CONTENT GRID (Col 8 / Col 4)
        ==================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Col 8): Upcoming, In-Progress & Completed Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* UPCOMING ASSESSMENTS */}
          {(activeFilter === 'all' || activeFilter === 'upcoming') && (
            <div>
              <div className="mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Upcoming Assessments
                </h3>
                <p className="text-xs text-slate-500">
                  Take assessments to evaluate your understanding and get certified.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Upcoming Card 1: PACS Accounting Basics */}
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-emerald-700/40 transition">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                        <FileText size={20} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#056B46] border border-emerald-200">
                        Scheduled
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      PACS Accounting Basics
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Module 3 • 40 Marks
                    </p>

                    <div className="mt-3 py-2 border-y border-gray-100 space-y-1 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span>28 Sep 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400" />
                        <span>10:00 AM - 11:00 AM (60 Minutes)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                      Test your understanding of PACS accounting concepts and basic bookkeeping.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <button
                      onClick={() => navigate('/assessments/pacs-accounting')}
                      className="py-2.5 px-3 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Play size={12} fill="white" />
                      <span>Start Assessment</span>
                    </button>
                    <button
                      onClick={() => setSyllabusModal(syllabuses.accounting)}
                      className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition text-center cursor-pointer"
                    >
                      View Syllabus
                    </button>
                  </div>
                </div>

                {/* Upcoming Card 2: Cooperative Governance */}
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                        <BarChart2 size={20} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Opens Soon
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Cooperative Governance
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Module 2 • 30 Marks
                    </p>

                    <div className="mt-3 py-2 border-y border-gray-100 space-y-1 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span>02 Oct 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400" />
                        <span>2:00 PM - 3:00 PM (45 Minutes)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                      Assessment on governance structure, by-laws and management of cooperatives.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <button
                      disabled
                      className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock size={12} />
                      <span>Available in 5 days</span>
                    </button>
                    <button
                      onClick={() => setSyllabusModal(syllabuses.governance)}
                      className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition text-center cursor-pointer"
                    >
                      View Syllabus
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* IN PROGRESS ASSESSMENTS */}
          {(activeFilter === 'all' || activeFilter === 'inprogress') && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                In Progress Assessments
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Authentic calculator and hands thumbnail matching screenshot */}
                <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-gray-200">
                  <img 
                    src="/assets/assessment_calc_hands.jpg" 
                    alt="Digital Tools for PACS" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/course_digital_tools.jpg';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      Digital Tools for PACS
                    </h4>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      In Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Module 5 • 25 Marks
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0B6A45] h-full rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-800">60%</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => navigate('/assessments/digital-tools')}
                    className="w-full sm:w-auto bg-[#0B6A45] hover:bg-[#085536] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Continue Assessment</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Time Left: 32 minutes
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* COMPLETED ASSESSMENTS TABLE (Exact match to reference) */}
          {(activeFilter === 'all' || activeFilter === 'completed') && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Completed Assessments
                </h3>
                <span className="text-xs text-slate-400 font-medium">{filteredCompleted.length} Total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Assessment Title</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Marks</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4">Completed On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {filteredCompleted.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.title}</td>
                        <td className="py-3 px-4">{item.module}</td>
                        <td className="py-3 px-4 font-mono font-medium">{item.marks}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#056B46] border border-emerald-100">
                            {item.result}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{item.completedOn}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => navigate(`/assessments/${item.id}/result`)}
                              className="text-slate-600 hover:text-[#056B46] font-semibold text-xs transition cursor-pointer"
                            >
                              View Result
                            </button>
                            <Link 
                              to="/certificates" 
                              className="text-[#056B46] font-bold hover:underline flex items-center gap-1"
                            >
                              <Download size={12} />
                              <span>View Certificate</span>
                              <ChevronRight size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Col 4): Overall Progress & Assessment Tips */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* OVERALL ASSESSMENT PROGRESS CARD (75% Ring) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Overall Assessment Progress
            </h3>

            <div className="flex items-center gap-5 my-2">
              <ProgressRing
                percentage={75}
                size={95}
                strokeWidth={9}
                color="#056B46"
              />

              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Completed
                  </span>
                  <span className="font-bold text-slate-900">4 / 6</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    In Progress
                  </span>
                  <span className="font-bold text-slate-900">1</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Upcoming
                  </span>
                  <span className="font-bold text-slate-900">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASSESSMENT TIPS CARD */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 text-[#056B46] font-bold text-xs uppercase tracking-wider mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <Lightbulb size={14} />
              </div>
              <span>Assessment Tips</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#056B46] shrink-0 mt-0.5" />
                <span>Complete all learning modules first</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#056B46] shrink-0 mt-0.5" />
                <span>Read the study materials and notes</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#056B46] shrink-0 mt-0.5" />
                <span>Take practice quizzes before the main test</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Manage your time carefully during the exam</span>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>You can attempt assessments only once (for certification)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Syllabus Modal */}
      {syllabusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{syllabusModal.title}</h3>
                <span className="text-[11px] text-[#056B46] font-bold">{syllabusModal.module}</span>
              </div>
              <button onClick={() => setSyllabusModal(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">Key Syllabus Units Covered:</div>
              {syllabusModal.topics.map((t, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#056B46] mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSyllabusModal(null)}
                className="px-4 py-2 bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
