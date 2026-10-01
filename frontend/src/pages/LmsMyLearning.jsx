import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import { 
  ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, 
  Maximize, CheckCircle2, Lock, Download, 
  Eye, FileText, Video, Presentation, Lightbulb, MessageSquare, 
  BookOpen, Sparkles, Languages, Clock, Award, Search, Filter, 
  CheckSquare, ChevronRight, BarChart2, Star
} from 'lucide-react';

export default function LmsMyLearning() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const { courseId } = useParams();

  // Catalog State
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL, IN_PROGRESS, COMPLETED, NOT_STARTED
  const [searchQuery, setSearchQuery] = useState('');

  // Lesson Player State (for /learning/:courseId)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, notes, resources, discussion
  const [selectedLessonId, setSelectedLessonId] = useState('3.2');
  const [language, setLanguage] = useState('hi'); // Hindi or English
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');
  const [userNote, setUserNote] = useState('');
  const [courseProgress, setCourseProgress] = useState(60);
  const [savedNotes, setSavedNotes] = useState([
    'Remember: By-laws amendment requires 2/3rd majority in General Body meeting.',
    'NCDC credit line is integrated with NABARD refinancing scheme under PACS Computerization.'
  ]);

  // Mock Courses Catalog matching reference screenshot
  const coursesCatalog = [
    {
      id: 'pacs-operations',
      title: 'PACS Operations and Management',
      category: 'Operations',
      status: 'IN_PROGRESS',
      progress: courseProgress,
      level: 'Intermediate',
      modulesCount: 6,
      weeksCount: 8,
      lessonsCount: 24,
      thumbnail: '/assets/farmer_pacs_backdrop.jpg',
      currentLesson: 'Module 3: Lesson 3.2 — Functions and Services of PACS',
      badgeColor: 'bg-emerald-50 text-[#056B46] border-emerald-200'
    },
    {
      id: 'pacs-accounting',
      title: 'PACS Accounting & Bookkeeping',
      category: 'Accounting',
      status: 'IN_PROGRESS',
      progress: 25,
      level: 'Foundation',
      modulesCount: 4,
      weeksCount: 6,
      lessonsCount: 16,
      thumbnail: '/assets/assessment_calc_hands.jpg',
      currentLesson: 'Module 1: Lesson 1.3 — Journal Entries & Double Entry System',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'coop-management',
      title: 'Cooperative Society Management',
      category: 'Management',
      status: 'NOT_STARTED',
      progress: 0,
      level: 'Advanced',
      modulesCount: 6,
      weeksCount: 8,
      lessonsCount: 22,
      thumbnail: '/assets/career_coop_manager.jpg',
      currentLesson: 'Module 1: Lesson 1.1 — Principles of Cooperative Governance',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'rural-banking',
      title: 'Rural Banking & Credit Operations',
      category: 'Banking',
      status: 'NOT_STARTED',
      progress: 0,
      level: 'Intermediate',
      modulesCount: 5,
      weeksCount: 6,
      lessonsCount: 18,
      thumbnail: '/assets/career_rural_finance.jpg',
      currentLesson: 'Module 1: Lesson 1.1 — Agricultural Credit Delivery Architecture',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'digital-tools',
      title: 'Digital Tools for PACS',
      category: 'Digital Technology',
      status: 'COMPLETED',
      progress: 100,
      level: 'Foundation',
      modulesCount: 4,
      weeksCount: 5,
      lessonsCount: 14,
      thumbnail: '/assets/impact_laptop.jpg',
      currentLesson: 'All Modules Completed • Certificate Verified',
      badgeColor: 'bg-emerald-50 text-[#056B46] border-emerald-200'
    },
    {
      id: 'coop-governance',
      title: 'Cooperative Governance & By-laws',
      category: 'Legal & Governance',
      status: 'COMPLETED',
      progress: 100,
      level: 'Intermediate',
      modulesCount: 4,
      weeksCount: 4,
      lessonsCount: 12,
      thumbnail: '/assets/career_community_dev.jpg',
      currentLesson: 'All Modules Completed • Certificate Verified',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  ];

  // Lessons inside course detail
  const [lessonsList, setLessonsList] = useState([
    { id: '3.1', title: '3.1 Introduction to PACS', duration: '28 min', status: 'completed' },
    { id: '3.2', title: '3.2 Functions and Services of PACS', duration: '32 min', status: 'active' },
    { id: '3.3', title: '3.3 PACS Governance Structure', duration: '25 min', status: 'pending' },
    { id: '3.4', title: '3.4 Financial Management in PACS', duration: '30 min', status: 'pending' },
    { id: '3.5', title: '3.5 Digital Tools for PACS', duration: '22 min', status: 'pending' },
    { id: '3.6', title: '3.6 Case Study: Successful PACS in India', duration: '20 min', status: 'locked' },
    { id: '3.7', title: '3.7 Summary and Key Learnings', duration: '10 min', status: 'locked' },
    { id: '3.8', title: '3.8 Practice Quiz & Knowledge Check', duration: '15 min', status: 'locked' }
  ]);

  const handleDownloadResource = (name) => {
    showToast(`Downloading official NCCT training material: ${name}`, 'success');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!userNote.trim()) return;
    setSavedNotes([...savedNotes, userNote]);
    setUserNote('');
    showToast('Note added to your learning portfolio', 'success');
  };

  const handleMarkComplete = () => {
    setLessonsList(prev => prev.map(l => l.id === selectedLessonId ? { ...l, status: 'completed' } : l));
    const nextProgress = Math.min(100, courseProgress + 10);
    setCourseProgress(nextProgress);
    showToast(`Lesson ${selectedLessonId} marked complete! Course progress: ${nextProgress}%`, 'success');
  };

  const handleNextLesson = () => {
    const currentIndex = lessonsList.findIndex(l => l.id === selectedLessonId);
    if (currentIndex >= 0 && currentIndex < lessonsList.length - 1) {
      const nextLesson = lessonsList[currentIndex + 1];
      setSelectedLessonId(nextLesson.id);
      setIsPlaying(true);
      showToast(`Now playing: ${nextLesson.title}`, 'info');
    } else {
      showToast('You have completed all lessons in this module!', 'success');
    }
  };

  // Filter logic for Catalog
  const filteredCourses = coursesCatalog.filter(course => {
    const matchesCategory = 
      filterCategory === 'ALL' ? true :
      filterCategory === 'IN_PROGRESS' ? course.status === 'IN_PROGRESS' :
      filterCategory === 'COMPLETED' ? course.status === 'COMPLETED' :
      filterCategory === 'NOT_STARTED' ? course.status === 'NOT_STARTED' : true;

    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ==============================================================
  // RENDER 1: COURSE DETAIL & LESSON PLAYER (When courseId is present)
  // ==============================================================
  if (courseId) {
    return (
      <div className="space-y-6">
        
        {/* Course Header Bar with Back Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/learning')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#056B46] transition mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to My Learning</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#056B46] flex items-center justify-center font-bold text-base border border-emerald-100">
                🌿
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    PACS Operations and Management
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#056B46] border border-emerald-200">
                    In Progress
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  National Council for Cooperative Training (NCCT) • Module 3 of 6 • 8 Lessons • 2 Hours 30 Minutes
                </p>
              </div>
            </div>
          </div>

          {/* Progress & Quick Actions */}
          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Course Progress</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-28 sm:w-36 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#056B46] h-full rounded-full transition-all duration-500" style={{ width: `${courseProgress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-800">{courseProgress}%</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlaying(true);
                showToast('Resuming Module 3: Functions and Services of PACS', 'info');
              }}
              className="bg-[#0B6A45] hover:bg-[#085536] text-white font-bold px-4 py-2.5 rounded-xl shadow-2xs text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Main Grid: Video Player + Course Curriculum */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Video Player & Lesson Details (Col 8) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Video Lesson Screen */}
            <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-800 relative group">
              
              {/* Screen Content */}
              <div className="aspect-video relative flex items-center justify-center bg-black">
                <img
                  src="/assets/lesson_video.jpg"
                  alt="Role of PACS in Rural Economy"
                  className="w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    e.target.src = '/assets/clean_hero_photo.jpg';
                  }}
                />

                {/* Center Play Button Overlay */}
                {!isPlaying && (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute w-16 h-16 rounded-full bg-[#056B46]/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer"
                  >
                    <Play size={24} fill="white" className="ml-1" />
                  </button>
                )}

                {/* Hindi / English Audio Switcher Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border border-white/10">
                  <Languages size={12} className="text-emerald-400" />
                  <span>Audio: {language === 'hi' ? 'Hindi (हिंदी)' : 'English'}</span>
                </div>

                {/* Bottom Video Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2">
                  {/* Progress scrubber */}
                  <div className="w-full bg-white/20 h-1 rounded-full cursor-pointer overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[45%]"></div>
                  </div>

                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-emerald-400 transition cursor-pointer">
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button onClick={() => setIsMuted(!isMuted)} className="hover:text-emerald-400 transition cursor-pointer">
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <span className="text-[11px] text-slate-300 font-mono">14:20 / 32:00</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <button 
                        onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                        className="hover:text-emerald-400 transition cursor-pointer"
                      >
                        {language === 'hi' ? 'EN' : 'HI'}
                      </button>
                      <button 
                        onClick={() => setPlaybackSpeed(playbackSpeed === '1.0x' ? '1.25x' : playbackSpeed === '1.25x' ? '1.5x' : '1.0x')}
                        className="font-mono hover:text-emerald-400 transition cursor-pointer"
                      >
                        {playbackSpeed}
                      </button>
                      <button className="hover:text-emerald-400 transition cursor-pointer">
                        <Maximize size={15} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Current Lesson Title & Action Row */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-[#056B46] uppercase tracking-wider block">
                    CURRENT LESSON
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    3.2 Functions and Core Services of PACS
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkComplete}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 size={13} className="text-[#056B46]" />
                    <span>Mark Complete</span>
                  </button>
                  <button
                    onClick={handleNextLesson}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>Next Lesson</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Lesson Tabs: Overview, Notes, Resources, Discussion */}
              <div className="flex items-center gap-6 mt-4 border-b border-gray-100 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'overview' ? 'text-[#056B46]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Overview & Objectives
                  {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#056B46] rounded-full"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'notes' ? 'text-[#056B46]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  My Notes ({savedNotes.length})
                  {activeTab === 'notes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#056B46] rounded-full"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'resources' ? 'text-[#056B46]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Resources & Downloads
                  {activeTab === 'resources' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#056B46] rounded-full"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'discussion' ? 'text-[#056B46]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Q&A Discussion
                  {activeTab === 'discussion' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#056B46] rounded-full"></span>}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-4 text-xs text-slate-600 leading-relaxed">
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <p>
                      In this lesson, trainees will explore the essential statutory and non-statutory services provided by 
                      Primary Agricultural Credit Societies (PACS) to rural farmer members across India.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                        <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-xs">
                          <CheckSquare size={13} className="text-[#056B46]" /> Key Objectives
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                          <li>Short-term crop loan sanctioning workflow</li>
                          <li>Distribution of agricultural inputs (seeds, fertilizer)</li>
                          <li>Storage godown management & aggregation</li>
                        </ul>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                        <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-xs">
                          <Lightbulb size={13} className="text-amber-600" /> Operational Context
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Covers computerization guidelines issued by the Ministry of Cooperation for 79,630+ PACS under national ERP standards.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input
                        type="text"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="Write a personal note for this lesson..."
                        className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#056B46]/20 focus:border-[#056B46]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0B6A45] hover:bg-[#085536] text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                      >
                        Add Note
                      </button>
                    </form>
                    <div className="space-y-2">
                      {savedNotes.map((n, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-start justify-between gap-3">
                          <p className="text-slate-700 text-xs italic">“{n}”</p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">Saved</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <FileText size={18} className="text-[#056B46]" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">PACS Model By-laws 2024.pdf</div>
                          <div className="text-[10px] text-slate-400">Official Ministry of Cooperation Document • 2.4 MB</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadResource('PACS Model By-laws 2024.pdf')}
                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs transition cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <Presentation size={18} className="text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">Lesson 3.2 Slide Deck.pptx</div>
                          <div className="text-[10px] text-slate-400">NCCT Lecture Presentation Slides • 5.1 MB</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadResource('Lesson 3.2 Slide Deck.pptx')}
                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs transition cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                          A
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Anand Verma (Trainee, Pune)</span>
                        <span className="text-[10px] text-slate-400">• 2 days ago</span>
                      </div>
                      <p className="text-slate-600 text-xs">
                        Is credit appraisal mandatory for KCC renewal if the farmer has repaid the principal in full within 12 months?
                      </p>
                      <p className="text-[#056B46] text-xs font-semibold mt-1">
                        Instructor Reply: Automatic renewal is permitted subject to land records validation in the State portal.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Course Syllabus / Modules Accordion (Col 4) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Course Syllabus</h3>
                <span className="text-xs font-semibold text-[#056B46]">Module 3 of 6</span>
              </div>

              {/* Lesson Items */}
              <div className="space-y-2">
                {lessonsList.map((lesson) => {
                  const isCurrent = lesson.id === selectedLessonId;
                  const isDone = lesson.status === 'completed';
                  const isLocked = lesson.status === 'locked';

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedLessonId(lesson.id);
                          setIsPlaying(true);
                        } else {
                          showToast('Complete previous lessons to unlock this session', 'info');
                        }
                      }}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isCurrent 
                          ? 'bg-[#EAF7EE] border-[#056B46]/30 shadow-2xs' 
                          : isLocked 
                          ? 'bg-slate-50/60 border-gray-100 opacity-60' 
                          : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-[#056B46] shrink-0" />
                        ) : isLocked ? (
                          <Lock size={15} className="text-slate-400 shrink-0" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full bg-[#056B46] flex items-center justify-center text-white shrink-0">
                            <Play size={8} fill="white" className="ml-0.5" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                        )}

                        <div className="leading-tight">
                          <p className={`text-xs font-bold ${isCurrent ? 'text-[#056B46]' : 'text-slate-800'}`}>
                            {lesson.title}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{lesson.duration}</span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#056B46] bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                          Playing
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Assessment Action */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate('/assessments/pacs-accounting')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  <Award size={14} className="text-white" />
                  <span>Take Module 3 Assessment</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // ==============================================================
  // RENDER 2: LMS CATALOG & DASHBOARD (Matching My Learning.png)
  // ==============================================================
  return (
    <div className="space-y-6">
      
      {/* 
        ==================================================
        TOP BANNER (Matching My Learning.png with building photo)
        ==================================================
      */}
      <PageBanner
        title="My Learning"
        subtitle="Access structured courses designed for cooperative sector professionals."
        rightCardTitle="Learn at your own pace"
        rightCardText="Build skills, get certified and create better opportunities."
        rightCardIcon={BookOpen}
      />

      {/* 
        ==================================================
        4 STAT CARDS ROW (Matching My Learning.png stats)
        ==================================================
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        
        {/* Stat 1: Enrolled Courses */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">4</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Enrolled Courses</div>
          </div>
        </div>

        {/* Stat 2: In Progress */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">2</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">In Progress</div>
          </div>
        </div>

        {/* Stat 3: Completed Courses */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">2</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Completed Courses</div>
          </div>
        </div>

        {/* Stat 4: Total Learning Hours */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">36.5 Hrs</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total Learning Time</div>
          </div>
        </div>

      </div>

      {/* 
        ==================================================
        FILTER PILLS & SEARCH BAR (Matching reference)
        ==================================================
      */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-[#0B6A45] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Courses (6)
          </button>
          <button
            onClick={() => setFilterCategory('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterCategory === 'IN_PROGRESS'
                ? 'bg-[#0B6A45] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress (2)
          </button>
          <button
            onClick={() => setFilterCategory('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterCategory === 'COMPLETED'
                ? 'bg-[#0B6A45] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed (2)
          </button>
          <button
            onClick={() => setFilterCategory('NOT_STARTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterCategory === 'NOT_STARTED'
                ? 'bg-[#0B6A45] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Not Started (2)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses or topics..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#056B46]/20 focus:border-[#056B46]"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

      </div>

      {/* 
        ==================================================
        COURSE CARDS 2x3 GRID (Matching My Learning.png)
        ==================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {filteredCourses.map((course) => {
          const isDone = course.status === 'COMPLETED';
          const isInProgress = course.status === 'IN_PROGRESS';

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              <div>
                {/* Course Image Header with Badges */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover object-center transition duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.src = '/assets/clean_hero_photo.jpg';
                    }}
                  />

                  {/* Top Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-800 shadow-2xs border border-gray-100">
                      {course.category}
                    </span>
                  </div>

                  {/* Top Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs border ${
                      isDone 
                        ? 'bg-emerald-600 text-white border-emerald-700' 
                        : isInProgress 
                        ? 'bg-[#0B6A45] text-white border-[#085536]' 
                        : 'bg-white/95 backdrop-blur-xs text-slate-700 border-gray-200'
                    }`}>
                      {isDone ? 'Completed' : isInProgress ? 'In Progress' : 'Enrolled'}
                    </span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium">
                    National Council for Cooperative Training (NCCT)
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400 font-medium">
                    <span>{course.modulesCount} Modules</span>
                    <span>•</span>
                    <span>{course.weeksCount} Weeks</span>
                    <span>•</span>
                    <span>{course.lessonsCount} Lessons</span>
                  </div>

                  {/* Progress Bar (if in progress or completed) */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500 font-medium">Course Progress</span>
                      <span className="font-bold text-slate-800">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDone ? 'bg-[#056B46]' : 'bg-[#0B6A45]'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-4 sm:p-5 pt-0">
                {isInProgress ? (
                  <button
                    onClick={() => navigate(`/learning/${course.id}`)}
                    className="w-full py-2.5 px-4 bg-[#0B6A45] hover:bg-[#085536] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue Learning</span>
                    <ArrowRight size={14} />
                  </button>
                ) : isDone ? (
                  <button
                    onClick={() => navigate('/certificates')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#056B46] font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Award size={14} />
                    <span>View Certificate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/learning/${course.id}`)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Start Course</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
