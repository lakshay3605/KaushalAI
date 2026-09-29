import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import { 
  Sparkles, Briefcase, BookOpen, Star, Bot, ArrowRight, 
  Send, ChevronRight, CheckCircle2, AlertCircle, FileText, 
  Video, UserCheck, Search, Building2, MapPin, Check
} from 'lucide-react';
import { apiRequest } from '../api';

export default function AiCareerGuidancePage() {
  const { showToast, appliedJobIds, toggleApplyJob } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hi Rohit! 👋 I am your AI Career Assistant. Ask me anything about courses, exams, or cooperative careers, or try one of the suggestions below!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const initialPromptProcessed = useRef(false);

  const careerPaths = [
    {
      id: 'cp-1',
      title: 'Cooperative Manager',
      desc: 'Manage cooperative operations and member services',
      match: 92,
      badge: 'Best Match',
      image: '/assets/career_coop_manager.jpg'
    },
    {
      id: 'cp-2',
      title: 'Rural Finance Officer',
      desc: 'Facilitate credit, loan management and financial inclusion',
      match: 85,
      image: '/assets/career_rural_finance.jpg'
    },
    {
      id: 'cp-3',
      title: 'Community Development Executive',
      desc: 'Work on rural development and community outreach',
      match: 78,
      image: '/assets/career_community_dev.jpg'
    },
    {
      id: 'cp-4',
      title: 'MIS & Data Analyst',
      desc: 'Use data to improve cooperative operations',
      match: 72,
      image: '/assets/career_mis_analyst.jpg'
    },
    {
      id: 'cp-5',
      title: 'Agricultural Extension Officer',
      desc: 'Support farmers with training and resources',
      match: 68,
      image: '/assets/career_agri_extension.jpg'
    }
  ];

  const jobs = [
    {
      id: 'job-1',
      title: 'Cooperative Assistant',
      org: 'Jharkhand State Cooperative Bank',
      loc: 'Ranchi, Jharkhand',
      type: 'Full Time',
      exp: 'Entry Level',
      color: 'bg-emerald-50 text-emerald-800'
    },
    {
      id: 'job-2',
      title: 'Data Entry Operator',
      org: 'Dhanbad Cooperative Society',
      loc: 'Dhanbad, Jharkhand',
      type: 'Full Time',
      exp: '0-2 Years',
      color: 'bg-purple-50 text-purple-700'
    },
    {
      id: 'job-3',
      title: 'Field Coordinator',
      org: 'Rural Development Department',
      loc: 'Hazaribagh, Jharkhand',
      type: 'Full Time',
      exp: '1-3 Years',
      color: 'bg-amber-50 text-amber-700'
    },
    {
      id: 'job-4',
      title: 'MIS Executive',
      org: 'State Cooperative Union',
      loc: 'Patna, Bihar',
      type: 'Full Time',
      exp: '1-3 Years',
      color: 'bg-blue-50 text-blue-700'
    }
  ];

  // SVG Radar chart data
  const radarAxes = [
    { name: 'Cooperative Operations', score: 85, angle: 0 },
    { name: 'Financial Literacy', score: 70, angle: 60 },
    { name: 'Digital Tools', score: 60, angle: 120 },
    { name: 'Communication', score: 78, angle: 180 },
    { name: 'Leadership', score: 65, angle: 240 },
    { name: 'Agriculture Knowledge', score: 72, angle: 300 }
  ];

  const handleSendMessage = async (msgText) => {
    const text = msgText || chatInput;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoadingAi(true);

    try {
      // Connect to existing backend RAG endpoint /ai/rag-query
      const res = await apiRequest('/ai/rag-query', {
        method: 'POST',
        body: JSON.stringify({ query: text, role: 'TRAINEE' })
      }).catch(() => null);

      setTimeout(() => {
        if (res && res.answer) {
          setChatMessages(prev => [...prev, {
            sender: 'ai',
            text: res.answer,
            sources: res.sources
          }]);
        } else {
          // Fallback intelligent simulated career coach response
          let reply = "Based on NCCT cooperative competency frameworks, strengthening your 'Advanced Excel & MIS' and 'PACS Statutory Accounting' skills will accelerate your qualification for Managerial roles.";
          if (text.toLowerCase().includes('job')) {
            reply = "I found 3 open positions in Jharkhand PACS that value your certified 'PACS Operations' credential. You meet 92% of the prerequisite criteria!";
          } else if (text.toLowerCase().includes('course') || text.toLowerCase().includes('learn')) {
            reply = "I recommend enrolling in 'Digital Tools for PACS' (Module 5). Completing it will close your digital tools skill gap from 60% to 85%.";
          } else if (text.toLowerCase().includes('lacking') || text.toLowerCase().includes('lack')) {
            reply = "Based on your current profile, you are lacking in **'Digital Tools' (60%)** and **'Leadership' (65%)**. To become fully job-ready for a Cooperative Manager role, I recommend completing the 'Digital Tools for PACS' and 'Cooperative Leadership' modules. This will boost your overall readiness by 15%.";
          }
          setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
        }
        setLoadingAi(false);
      }, 1200);
      
    } catch (e) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: 'To enter the cooperative banking cadre, acquire 75%+ attendance in PACS Operations and complete credit underwriting modules.' 
        }]);
        setLoadingAi(false);
      }, 1200);
    }
  };

  useEffect(() => {
    if (location.state?.initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      handleSendMessage(location.state.initialPrompt);
      // Clean up the location state so it doesn't refire on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner matching ai career guidance.png */}
      <PageBanner
        title="AI Career Guidance"
        subtitle="Get personalized career recommendations based on your skills, interests and learning progress. Explore career paths, discover opportunities and build the right skills for a brighter future."
        quoteText="“Your skills today, a stronger tomorrow.”"
        rightCardIcon={Bot}
      />

      {/* Top 4 Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Career Readiness */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <Sparkles size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight">78%</div>
            <p className="text-xs text-slate-600 font-medium truncate">Career Readiness</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>

        {/* Recommended Career Paths */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">5</div>
            <p className="text-xs text-slate-600 font-medium">Recommended Career Paths</p>
          </div>
        </div>

        {/* Suggested Courses */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">12</div>
            <p className="text-xs text-slate-600 font-medium">Suggested Courses</p>
          </div>
        </div>

        {/* Skill Gaps to Focus */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Star size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">3</div>
            <p className="text-xs text-slate-600 font-medium">Skill Gaps to Focus</p>
          </div>
        </div>

      </div>

      {/* Row 1: Recommended Career Paths (5 Cards) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recommended Career Paths
            </h3>
            <p className="text-xs text-slate-500">
              Based on your skills, interests and learning progress
            </p>
          </div>
          <button 
            onClick={() => showToast('Displaying complete NCCT cooperative role taxonomies', 'info')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View All Careers</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {careerPaths.map((cp) => (
            <div
              key={cp.id}
              className="rounded-xl border border-gray-200 p-3 flex flex-col justify-between hover:border-emerald-700/40 hover:shadow-xs transition"
            >
              <div>
                <div className="h-24 rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                  <img src={cp.image} alt={cp.title} className="w-full h-full object-cover" />
                  {cp.badge && (
                    <span className="absolute top-1.5 left-1.5 bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {cp.badge}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {cp.title}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                  {cp.desc}
                </p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">Match</span>
                    <span className="text-emerald-800">{cp.match}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-700 h-full rounded-full" style={{ width: `${cp.match}%` }}></div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => showToast(`Career Path details for ${cp.title}: Salary ₹3-6 LPA, 42 Openings in State PACS`, 'info')}
                className="w-full mt-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold transition text-center"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Skills Radar + Skill Gap + Learning Roadmap + AI Career Coach Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Sub-Grid: Skills Profile & Gap Analysis (Col 8) */}
        <div className="lg:col-span-8 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Skills Profile with SVG Radar Chart (Col 6) */}
            <div className="md:col-span-6 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Your Skills Profile
                  </h3>
                  <p className="text-[10px] text-slate-400">Last updated: 12 Oct 2025</p>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Update Skills →
                </button>
              </div>

              {/* Spider / Radar Chart Illustration */}
              <div className="flex items-center justify-center my-3 relative">
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
                  {/* Outer Polygon */}
                  <polygon
                    points="110,20 188,65 188,155 110,200 32,155 32,65"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                  {/* Middle Polygon */}
                  <polygon
                    points="110,50 162,80 162,140 110,170 58,140 58,80"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  {/* Inner Polygon */}
                  <polygon
                    points="110,80 136,95 136,125 110,140 84,125 84,95"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />

                  {/* Industry Average Shape */}
                  <polygon
                    points="110,40 165,85 155,135 110,165 65,135 70,85"
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#93C5FD"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* User Skill Polygon */}
                  <polygon
                    points="110,30 178,75 160,145 110,158 60,138 72,72"
                    fill="rgba(4, 120, 87, 0.2)"
                    stroke="#047857"
                    strokeWidth="2"
                  />

                  {/* Axis dots */}
                  <circle cx="110" cy="30" r="3.5" fill="#047857" />
                  <circle cx="178" cy="75" r="3.5" fill="#047857" />
                  <circle cx="160" cy="145" r="3.5" fill="#047857" />
                  <circle cx="110" cy="158" r="3.5" fill="#047857" />
                  <circle cx="60" cy="138" r="3.5" fill="#047857" />
                  <circle cx="72" cy="72" r="3.5" fill="#047857" />
                </svg>
              </div>

              {/* Legend & Scores */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Coop Operations
                  </span>
                  <span className="font-bold text-slate-900">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Financial Literacy
                  </span>
                  <span className="font-bold text-slate-900">70%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Digital Tools (MIS)
                  </span>
                  <span className="font-bold text-slate-900">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Communication
                  </span>
                  <span className="font-bold text-slate-900">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Leadership
                  </span>
                  <span className="font-bold text-slate-900">65%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    Agri Knowledge
                  </span>
                  <span className="font-bold text-slate-900">72%</span>
                </div>
              </div>
            </div>

            {/* Skill Gap Analysis (Col 6) */}
            <div className="md:col-span-6 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Skill Gap Analysis
                  </h3>
                  <button 
                    onClick={() => showToast('Full skill gap matrix loaded', 'info')}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">3 key skills to focus on</p>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Advanced Data Analysis</span>
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                        High Demand
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Learn advanced Excel, MIS and data dashboards for PACS reporting.
                    </p>
                    <button
                      onClick={() => navigate('/learning')}
                      className="mt-2 text-[11px] font-bold text-emerald-800 hover:text-emerald-900"
                    >
                      Find Courses →
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Project Management</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Medium Demand
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Learn to manage rural projects and cooperative teams.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Policy & Governance</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Medium Demand
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Understand cooperative policies and Multi-State Act regulations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Learning Roadmap */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900">Learning Roadmap</h4>
                  <span className="text-[10px] text-slate-400">Personalized</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="p-1 rounded bg-emerald-50 text-emerald-800 font-bold">1. Core Courses</div>
                  <div className="p-1 rounded bg-slate-50 text-slate-600">2. Key Skills</div>
                  <div className="p-1 rounded bg-slate-50 text-slate-600">3. Certify</div>
                  <div className="p-1 rounded bg-slate-50 text-slate-600">4. Jobs</div>
                </div>
              </div>
            </div>

          </div>

          {/* Job Opportunities for You (4 Cards Grid) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Job Opportunities for You
                </h3>
                <p className="text-xs text-slate-500">
                  Based on your skills and career interests
                </p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1">
                <span>View All Jobs</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {jobs.map((job) => {
                const isApplied = appliedJobIds.includes(job.id);
                return (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl border border-gray-200 flex flex-col justify-between hover:border-emerald-700/40 transition"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs mb-2">
                        <Building2 size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {job.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{job.org}</p>
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <MapPin size={10} />
                        <span className="truncate">{job.loc}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {job.type}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {job.exp}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleApplyJob(job.id)}
                      className={`w-full mt-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isApplied 
                          ? 'bg-slate-100 text-slate-600 cursor-default' 
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs'
                      }`}
                    >
                      {isApplied ? 'Applied ✓' : 'Apply Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: AI Career Coach Chat Panel & Career Resources (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* AI Career Coach Panel matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">AI Career Coach</h3>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Powered by KaushalAI
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Prompt Pills */}
            <div className="py-2.5 space-y-1.5 border-b border-gray-100">
              <button
                onClick={() => handleSendMessage('What career is right for me?')}
                className="w-full text-left p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 flex items-center justify-between"
              >
                <span>What career is right for me?</span>
                <ChevronRight size={12} className="text-slate-400" />
              </button>
              <button
                onClick={() => handleSendMessage('Which skills should I improve?')}
                className="w-full text-left p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 flex items-center justify-between"
              >
                <span>Which skills should I improve?</span>
                <ChevronRight size={12} className="text-slate-400" />
              </button>
              <button
                onClick={() => handleSendMessage('Suggest courses for Rural Finance')}
                className="w-full text-left p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-[11px] text-slate-700 flex items-center justify-between"
              >
                <span>Suggest courses for Rural Finance</span>
                <ChevronRight size={12} className="text-slate-400" />
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-emerald-800 text-white rounded-br-xs' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loadingAi && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                  <span>AI Coach is analyzing career pathways...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="pt-2 border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about your career..."
                className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
              />
              <button
                type="submit"
                disabled={loadingAi}
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center shrink-0 transition"
              >
                <Send size={13} />
              </button>
            </form>
          </div>

          {/* Career Resources Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Career Resources
            </h3>
            <div className="space-y-2.5 text-xs">
              <div 
                onClick={() => showToast('Opening NCCT Cooperative Resume Builder', 'info')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-100 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-blue-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">Resume Builder</h4>
                    <p className="text-[10px] text-slate-400">Create a professional resume</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </div>

              <div 
                onClick={() => showToast('Starting AI Mock Interview Simulator for PACS Manager', 'info')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-100 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck size={16} className="text-emerald-700" />
                  <div>
                    <h4 className="font-bold text-slate-900">Interview Preparation</h4>
                    <p className="text-[10px] text-slate-400">Practice with AI-powered questions</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
