import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import ProgressRing from '../components/common/ProgressRing';
import { 
  Flame, Calendar, MapPin, CheckCircle2, Lock, ArrowRight, 
  Send, Bot, BookOpen, Clock, FileText, ChevronRight, Award, Edit3
} from 'lucide-react';

export default function TraineeDashboard() {
  const { currentUser, showToast, setIsAiCoachOpen } = useApp();
  const navigate = useNavigate();
  const [aiInput, setAiInput] = useState('');
  const [attendanceViewOpen, setAttendanceViewOpen] = useState(false);

  const handleAiSend = (e) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;
    navigate('/career', { state: { initialPrompt: aiInput } });
  };

  const handlePromptClick = (prompt) => {
    navigate('/career', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Banner matching screenshot */}
      <PageBanner
        title="Welcome back, Rohit! 👋"
        subtitle="Keep learning, keep growing. Build your future in the cooperative sector."
        customRightContent={
          <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-gray-100 shadow-2xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100">
              <Calendar size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Thursday, 25 Sep 2025
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Continue your learning journey today!
              </div>
            </div>
          </div>
        }
      />

      {/* Row 1: Profile Summary, Overall Progress, Learning Streak */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Profile Summary Card (Col 5) */}
        <div className="md:col-span-6 lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[200px]">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src="/assets/rohit_kumar.jpg"
                alt={currentUser?.name || 'Rohit Kumar'}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-emerald-600/30 shadow-2xs"
                onError={(e) => {
                  e.target.src = '/assets/clean_hero_photo.jpg';
                }}
              />
              <button 
                onClick={() => navigate('/profile')}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0B6A45] hover:bg-[#085536] text-white rounded-full flex items-center justify-center shadow-xs transition cursor-pointer"
                title="Edit Profile"
              >
                <Edit3 size={11} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'Rohit Kumar'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Trainee ID: {currentUser?.traineeId || 'SS202500873'}
              </p>
              <p className="text-xs font-semibold text-emerald-800 mt-1">
                {currentUser?.programme || 'PACS Management Programme'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100 text-[11px]">
            <div>
              <div className="text-slate-400 flex items-center gap-1">
                <MapPin size={11} className="text-emerald-700" /> Centre
              </div>
              <div className="font-semibold text-slate-800 truncate mt-0.5">
                Ranchi, JH
              </div>
            </div>
            <div>
              <div className="text-slate-400">Enrolled on</div>
              <div className="font-semibold text-slate-800 mt-0.5">12 Aug 2025</div>
            </div>
            <div>
              <div className="text-slate-400">Course Ends</div>
              <div className="font-semibold text-slate-800 mt-0.5">30 Nov 2025</div>
            </div>
          </div>
        </div>

        {/* Overall Progress (Col 4) */}
        <div className="md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[200px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Overall Progress
            </h3>
          </div>

          <div className="flex items-center gap-5 my-2">
            <ProgressRing
              percentage={currentUser?.completionRate || 68}
              size={90}
              strokeWidth={8}
              color="#047857"
            />

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Modules Completed
                </span>
                <span className="font-bold text-slate-900">8 / 12</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Assessments
                </span>
                <span className="font-bold text-slate-900">3 / 4</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Certificate Pending
                </span>
                <span className="font-bold text-slate-900">1</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/learning')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <span>Continue Learning</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Learning Streak (Col 3) */}
        <div 
          onClick={() => showToast('12-day attendance & LMS module completion streak active!', 'success')}
          className="md:col-span-12 lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[200px] hover:border-amber-500/40 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Your Learning Streak
            </h3>
            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <ArrowRight size={13} />
            </div>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <Flame size={32} className="animate-bounce" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                12 Days
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Keep it up! You're doing great!
              </p>
            </div>
          </div>

          <div className="text-[10px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg font-medium border border-amber-100 flex items-center gap-1">
            <span>🔥</span> Verified via Smart Kiosk Attendance
          </div>
        </div>

      </div>

      {/* Row 2: Continue Learning, Upcoming Assessment, My Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Continue Learning Card (Col 5) */}
        <div className="md:col-span-6 lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Continue Learning
            </h3>
            <Link to="/learning" className="text-xs font-semibold text-[#056B46] hover:text-[#085536]">
              View All
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-gray-200">
              <img
                src="/assets/pacs_learning_group.jpg"
                alt="PACS Operations"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=200';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 mb-1">
                In Progress
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                PACS Operations and Management
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Module 3 of 6
              </p>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-700 h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-[11px] font-bold text-slate-700">60%</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/learning')}
              className="bg-[#0B6A45] hover:bg-[#085536] text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer transition"
              title="Continue"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Upcoming Assessment Card (Col 4) */}
        <div className="md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Upcoming Assessment
            </h3>
            <Link to="/assessments" className="text-xs font-semibold text-[#056B46] hover:text-[#085536]">
              View All
            </Link>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900">
                PACS Accounting Basics
              </h4>
              <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" /> 28 Sep 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-slate-400" /> 10:00 AM - 11:00 AM
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/assessments')}
            className="w-full mt-3 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition text-center"
          >
            View Details
          </button>
        </div>

        {/* My Attendance Card (Col 3) */}
        <div className="md:col-span-12 lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              My Attendance
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">This Month</span>
          </div>

          <div className="flex items-center gap-4 my-1">
            <ProgressRing
              percentage={85}
              size={76}
              strokeWidth={7}
              color="#047857"
            />

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Present
                </span>
                <span className="font-bold text-slate-900">17</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Absent
                </span>
                <span className="font-bold text-slate-900">3</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  Leave
                </span>
                <span className="font-bold text-slate-900">0</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => showToast('Attendance verified via Smart Biometric Kiosk. Current percentage: 85%', 'info')}
            className="w-full mt-2 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition text-center"
          >
            View Attendance
          </button>
        </div>

      </div>

      {/* Row 3: My Learning Path & Your Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Learning Path (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              My Learning Path
            </h3>
            <Link to="/learning" className="text-xs font-semibold text-[#056B46] hover:text-[#085536]">
              View All Modules
            </Link>
          </div>

          {/* Stepper with connecting line matching screenshot */}
          <div className="relative py-2">
            {/* Background connecting track */}
            <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-slate-200 z-0"></div>
            {/* Active completed track up to step 3 */}
            <div className="absolute top-4 left-[8%] w-[38%] h-0.5 bg-[#056B46] z-0"></div>

            <div className="grid grid-cols-6 gap-2 text-center relative z-10">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2 shadow-xs">
                1
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                Introduction to Cooperatives
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Completed
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2 shadow-xs">
                2
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                Cooperative Governance
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Completed
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2 shadow-xs ring-4 ring-blue-100">
                3
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                PACS Operations
              </p>
              <span className="text-[10px] text-blue-700 font-bold mt-1">
                In Progress
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center mb-2">
                4
              </div>
              <p className="text-[11px] font-medium text-slate-700 leading-tight">
                Accounting & Bookkeeping
              </p>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                <Lock size={10} /> Locked
              </span>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center mb-2">
                5
              </div>
              <p className="text-[11px] font-medium text-slate-700 leading-tight">
                Digital Tools for Cooperatives
              </p>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                <Lock size={10} /> Locked
              </span>
            </div>

            {/* Step 6 */}
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center mb-2">
                6
              </div>
              <p className="text-[11px] font-medium text-slate-700 leading-tight">
                Rural Credit & Inclusion
              </p>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                <Lock size={10} /> Locked
              </span>
            </div>

            </div>
          </div>
        </div>

        {/* Your Certificates (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between text-center h-full min-h-[175px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Your Certificates
            </h3>
            <Link to="/certificates" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900">
              View All
            </Link>
          </div>

          <div className="py-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <Award size={28} />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              No certificate yet
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Complete all modules and assessments to get your government-verified certificate.
            </p>
          </div>

          <button
            onClick={() => navigate('/certificates')}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            View Certificate
          </button>
        </div>

      </div>

      {/* Row 4: Recommended for You & AI Career Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Recommended for You (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Recommended for You
              </h3>
              <Link to="/learning" className="text-xs font-semibold text-[#056B46] hover:text-[#085536]">
                View All
              </Link>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <div 
              onClick={() => navigate('/learning')}
              className="rounded-xl border border-gray-200 p-2.5 hover:shadow-xs hover:border-emerald-700/40 transition cursor-pointer"
            >
              <div className="h-20 rounded-lg overflow-hidden bg-slate-100 mb-2">
                <img src="/assets/course_rural_banking.jpg" alt="Rural Banking" className="w-full h-full object-cover" />
              </div>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Popular
              </span>
              <h4 className="text-[11px] font-bold text-slate-900 mt-1 line-clamp-2">
                Rural Banking & Credit Operations
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">5 Modules • 6 Weeks</p>
            </div>

            <div 
              onClick={() => navigate('/learning')}
              className="rounded-xl border border-gray-200 p-2.5 hover:shadow-xs hover:border-emerald-700/40 transition cursor-pointer"
            >
              <div className="h-20 rounded-lg overflow-hidden bg-slate-100 mb-2">
                <img src="/assets/course_digital_tools.jpg" alt="Digital Tools" className="w-full h-full object-cover" />
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                New
              </span>
              <h4 className="text-[11px] font-bold text-slate-900 mt-1 line-clamp-2">
                Digital Tools for PACS
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">4 Modules • 5 Weeks</p>
            </div>

            <div 
              onClick={() => navigate('/learning')}
              className="rounded-xl border border-gray-200 p-2.5 hover:shadow-xs hover:border-emerald-700/40 transition cursor-pointer"
            >
              <div className="h-20 rounded-lg overflow-hidden bg-slate-100 mb-2">
                <img src="/assets/course_coop_mgmt.jpg" alt="Coop Mgmt" className="w-full h-full object-cover" />
              </div>
              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                Recommended
              </span>
              <h4 className="text-[11px] font-bold text-slate-900 mt-1 line-clamp-2">
                Cooperative Society Management
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">6 Modules • 8 Weeks</p>
            </div>

          </div>
          </div>
        </div>

        {/* AI Career Assistant (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Career Assistant
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Get personalised guidance for your career in cooperatives
            </p>

            {/* Prompt pills matching screenshot */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => handlePromptClick('What skills should I learn?')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-left border border-gray-100 flex items-center justify-between transition"
              >
                <span>What skills should I learn?</span>
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              </button>

              <button
                onClick={() => handlePromptClick('Show me job opportunities')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-left border border-gray-100 flex items-center justify-between transition"
              >
                <span>Show me job opportunities</span>
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              </button>

              <button
                onClick={() => handlePromptClick('How to start a career in cooperatives?')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-left border border-gray-100 flex items-center justify-between transition"
              >
                <span>How to start a career?</span>
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              </button>

              <button
                onClick={() => handlePromptClick('Suggest next course')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-left border border-gray-100 flex items-center justify-between transition"
              >
                <span>Suggest next course</span>
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Chat input box */}
          <form onSubmit={handleAiSend} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask anything about courses, exams or cooperative careers..."
              className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#056B46]/20 focus:border-[#056B46]"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-2xs"
              title="Send to AI Assistant"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
