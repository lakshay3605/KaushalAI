import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Search, Bell, ChevronDown, Wifi, WifiOff, Camera, Award,
  Sparkles, CheckCircle2, User, LogOut, ExternalLink, ShieldCheck, Compass, Menu, X
} from 'lucide-react';

export default function Header() {
  const { 
    currentUser, switchRole, isOffline, setIsOffline, 
    pendingSyncCount, handleSyncOffline, setIsKioskOpen, 
    setIsTourOpen, notifications, setNotifications
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginId, setLoginId] = useState('ADMIN');
  const [loginPassword, setLoginPassword] = useState('ADMIN');
  const [loginRole, setLoginRole] = useState('TRAINEE');

  useEffect(() => {
    if (isLandingPage) {
      const timer = setTimeout(() => {
        setIsLoginModalOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLandingPage]);

  const unreadNotifCount = notifications.filter(n => n.unread).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (currentUser?.role === 'RECRUITER') {
      navigate('/recruiter');
    } else {
      navigate('/learning');
    }
  };

  const getNavLinks = () => {
    if (isLandingPage) {
      return [
        { label: 'Home', path: '/' },
        { label: 'About', path: '/#about' },
        { label: 'Programmes', path: '/#programmes' },
        { label: 'Opportunities', path: '/#opportunities' },
        { label: 'Resources', path: '/#resources' },
        { label: 'Contact', path: '/#contact' }
      ];
    }
    if (currentUser?.role === 'RECRUITER' || location.pathname.startsWith('/jobs') || location.pathname.startsWith('/recruiter')) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/jobs' },
        { label: 'Find Candidates', path: '/jobs' },
        { label: 'Job Postings', path: '/jobs?tab=postings' },
        { label: 'Applications', path: '/jobs?tab=applications' },
        { label: 'Analytics', path: '/jobs?tab=analytics' }
      ];
    }
    if (currentUser?.role === 'ADMIN' || location.pathname.startsWith('/admin')) {
      return [
        { label: 'Overview', path: '/admin' },
        { label: 'Training', path: '/admin?tab=training' },
        { label: 'Trainees', path: '/admin?tab=trainees' },
        { label: 'Institutes', path: '/admin?tab=institutes' },
        { label: 'Courses', path: '/admin?tab=courses' },
        { label: 'Assessments', path: '/admin?tab=assessments' },
        { label: 'Certificates', path: '/admin?tab=certificates' },
        { label: 'Employment', path: '/admin?tab=employment' },
        { label: 'Analytics', path: '/admin?tab=analytics' }
      ];
    }
    if (currentUser?.role === 'CENTRE_OPERATOR' || location.pathname.startsWith('/kiosk')) {
      return [
        { label: 'Dashboard', path: '/kiosk' },
        { label: 'Attendance', path: '/kiosk?tab=attendance' },
        { label: 'Learner Registration', path: '/kiosk?tab=registration' },
        { label: 'Assessments', path: '/kiosk?tab=assessments' },
        { label: 'Certificates', path: '/kiosk?tab=certificates' },
        { label: 'Reports', path: '/kiosk?tab=reports' },
        { label: 'Help', path: '/kiosk?tab=help' }
      ];
    }
    // Default Trainee Nav
    return [
      { label: 'Home', path: '/' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Learning', path: '/learning' },
      { label: 'Assessments', path: '/assessments' },
      { label: 'Certificates', path: '/certificates' },
      { label: 'Career Guidance', path: '/career' },
      { label: 'Job Opportunities', path: '/jobs' }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200/90 shadow-2xs">
      
      {/* Main Navigation Bar — Matching approved reference header */}
      <div className={`w-full mx-auto flex items-center justify-between gap-4 h-16 ${
        isLandingPage ? 'px-6 sm:px-10 lg:px-14 xl:px-16' : 'px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px]'
      }`}>
        
        {/* LEFT: KaushalAI Logo & Emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <img 
              src="/assets/emblem.png" 
              alt="Emblem of India" 
              className="h-8 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg block">
                KaushalAI
              </span>
              <span className="text-[10px] text-[#056B46] font-bold tracking-wide block -mt-0.5">
                Cooperative Skill Ecosystem
              </span>
            </div>
          </Link>
        </div>

        {/* CENTER: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
          {navLinks.map((item) => {
            const isHome = item.label === 'Home';
            const isRecruiterPortal = location.pathname.startsWith('/jobs') || location.pathname.startsWith('/recruiter');
            const isAdminPortal = location.pathname.startsWith('/admin');
            const isKioskPortal = location.pathname.startsWith('/kiosk');
            const isActive = isLandingPage 
              ? isHome 
              : isKioskPortal
              ? (item.label === 'Dashboard' && !location.search.includes('tab=')) ||
                (location.search.includes('tab=attendance') && item.label === 'Attendance') ||
                (location.search.includes('tab=registration') && item.label === 'Learner Registration') ||
                (location.search.includes('tab=assessments') && item.label === 'Assessments') ||
                (location.search.includes('tab=certificates') && item.label === 'Certificates') ||
                (location.search.includes('tab=reports') && item.label === 'Reports') ||
                (location.search.includes('tab=help') && item.label === 'Help')
              : isAdminPortal
              ? (item.label === 'Overview' && !location.search.includes('tab=')) || 
                (location.search.includes('tab=training') && item.label === 'Training') ||
                (location.search.includes('tab=trainees') && item.label === 'Trainees') ||
                (location.search.includes('tab=institutes') && item.label === 'Institutes') ||
                (location.search.includes('tab=courses') && item.label === 'Courses') ||
                (location.search.includes('tab=assessments') && item.label === 'Assessments') ||
                (location.search.includes('tab=certificates') && item.label === 'Certificates') ||
                (location.search.includes('tab=employment') && item.label === 'Employment') ||
                (location.search.includes('tab=analytics') && item.label === 'Analytics')
              : isRecruiterPortal 
              ? (item.label === 'Find Candidates' && !location.search.includes('tab=')) || (location.search.includes('tab=postings') && item.label === 'Job Postings') || (location.search.includes('tab=applications') && item.label === 'Applications') || (location.search.includes('tab=analytics') && item.label === 'Analytics')
              : (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`py-1 text-sm font-medium transition relative whitespace-nowrap ${
                  isActive 
                    ? 'text-[#056B46] font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#056B46] rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: Search, Login, Get Started, and Ministry Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Search Icon */}
          <button
            onClick={() => {
              if (isLandingPage) {
                navigate('/learning');
              } else {
                const el = document.getElementById('global-search');
                if (el) el.focus();
              }
            }}
            className="p-1.5 text-slate-700 hover:text-slate-900 transition"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {isLandingPage ? (
            <>
              {/* Login Button (White outline button matching screenshot) */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Login
              </button>

              {/* Get Started Button (Solid dark green matching screenshot) */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-semibold transition shadow-2xs"
              >
                Get Started
              </button>

              {/* Ministry of Cooperation Official Branding on the far right */}
              <div className="hidden sm:flex items-center pl-2 border-l border-gray-200">
                <img
                  src="/assets/ministry_header_logo.png"
                  alt="Ministry of Cooperation, Government of India"
                  className="h-9 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text if crop is missing
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Mobile Menu Toggle for screens < lg */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 transition rounded-lg hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            /* Dashboard user controls for non-landing pages */
            <>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition"
                >
                  <img
                    src={location.pathname.startsWith('/admin') ? '/assets/ncct_admin.jpg' : 
                         location.pathname.startsWith('/kiosk') ? '/assets/sunita_kumari.jpg' :
                         (currentUser?.avatar || '/assets/rohit_kumar.jpg')}
                    alt={location.pathname.startsWith('/admin') ? 'NCCT Administrator' : 
                         location.pathname.startsWith('/kiosk') ? 'Amit Kumar' :
                         currentUser?.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-700/30"
                  />
                  <div className="text-left hidden sm:block leading-tight">
                    <div className="text-xs font-bold text-slate-800">
                      {location.pathname.startsWith('/admin') ? 'NCCT Administrator' : 
                       location.pathname.startsWith('/kiosk') ? 'Amit Kumar' :
                       currentUser?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {location.pathname.startsWith('/admin') ? 'National Council for Cooperative Training' :
                       location.pathname.startsWith('/kiosk') ? 'Centre Operator • Ranchi Centre' :
                       currentUser?.role === 'TRAINEE' ? 'Trainee' :
                       currentUser?.role === 'RECRUITER' ? 'Recruiter' :
                       currentUser?.role === 'ADMIN' ? 'NCCT Admin' : 'Centre Operator'}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[11px] font-bold text-slate-800">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400">{currentUser?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => { switchRole('TRAINEE'); navigate('/dashboard'); setProfileMenuOpen(false); }} className="w-full text-left p-1.5 rounded text-xs hover:bg-slate-50">Trainee (Rohit Kumar)</button>
                      <button onClick={() => { switchRole('RECRUITER'); navigate('/recruiter'); setProfileMenuOpen(false); }} className="w-full text-left p-1.5 rounded text-xs hover:bg-slate-50">Recruiter (Anjali Mehta)</button>
                      <button onClick={() => { switchRole('ADMIN'); navigate('/admin'); setProfileMenuOpen(false); }} className="w-full text-left p-1.5 rounded text-xs hover:bg-slate-50">NCCT Admin</button>
                      <button onClick={() => { switchRole('CENTRE_OPERATOR'); navigate('/kiosk'); setProfileMenuOpen(false); }} className="w-full text-left p-1.5 rounded text-xs hover:bg-slate-50">Centre Operator (Sunita)</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

      </div>

      {/* Mobile Drawer Navigation for Landing Page */}
      {mobileMenuOpen && isLandingPage && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-2.5">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700 hover:text-[#056B46] py-1.5 border-b border-gray-50 flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">→</span>
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-semibold rounded-lg text-center shadow-xs"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg text-center hover:bg-slate-50"
              >
                Login
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative p-6 border-b border-gray-100 bg-gradient-to-br from-[#056B46]/5 to-[#0B6A45]/10 flex flex-col items-center justify-center text-center">
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition shadow-2xs"
              >
                <X size={18} />
              </button>
              
              <img 
                src="/assets/emblem.png" 
                alt="Emblem" 
                className="h-10 w-auto object-contain mb-3 drop-shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Login to KaushalAI</h3>
              <p className="text-[11px] text-[#056B46] font-bold mt-1 uppercase tracking-wide">Cooperative Skill Ecosystem</p>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsLoginModalOpen(false);
                switchRole(loginRole);
                if (loginRole === 'TRAINEE') navigate('/dashboard');
                else if (loginRole === 'CENTRE_OPERATOR') navigate('/kiosk');
                else if (loginRole === 'RECRUITER') navigate('/recruiter');
                else if (loginRole === 'ADMIN') navigate('/admin');
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">User ID / Email</label>
                <input 
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. SS202500873" 
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#056B46] focus:ring-1 focus:ring-[#056B46]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#056B46] focus:ring-1 focus:ring-[#056B46]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Role</label>
                <select 
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#056B46] focus:ring-1 focus:ring-[#056B46]"
                >
                  <option value="TRAINEE">Trainee</option>
                  <option value="CENTRE_OPERATOR">Kiosk Worker</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">NCCT Admin</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-semibold rounded-xl text-center shadow-2xs transition"
                >
                  Sign In
                </button>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-500">
                  Demo credentials: Any ID and Password will work to enter the prototype.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
