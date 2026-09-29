import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, BookOpen, ClipboardCheck, Award, Sparkles, 
  Briefcase, User, CalendarCheck, MessageSquare, HelpCircle, 
  Headphones, Users, FileText, Star, Video, CheckCircle, 
  Building, BarChart3, Building2, CheckSquare, UserCheck, 
  FolderGit2, Settings, UserPlus, BookMarked, FileEdit, RefreshCw
} from 'lucide-react';

export default function Sidebar() {
  const { 
    currentUser, showToast, setIsAiCoachOpen,
    setRegisterLearnerOpen, setEnrolCourseOpen, setIssueCertOpen
  } = useApp();
  const location = useLocation();

  const getMenuItems = () => {
    if (currentUser?.role === 'RECRUITER') {
      return [
        { label: 'Dashboard', path: '/recruiter', icon: LayoutDashboard },
        { label: 'Find Candidates', path: '/recruiter', icon: Users, exact: true },
        { label: 'Job Postings', path: '/recruiter/jobs', icon: Briefcase },
        { label: 'Applications', path: '/recruiter/applications', icon: FileText },
        { label: 'Shortlisted', path: '/recruiter/shortlisted', icon: Star },
        { label: 'Interviews', path: '/recruiter/interviews', icon: Video },
        { label: 'Placements', path: '/recruiter/placements', icon: CheckCircle },
        { label: 'Company Profile', path: '/recruiter/profile', icon: Building },
        { label: 'Analytics & Reports', path: '/recruiter/analytics', icon: BarChart3 },
        { label: 'Messages', path: '/recruiter/messages', icon: MessageSquare, badge: 3 },
        { label: 'Help & Support', path: '/recruiter/help', icon: HelpCircle }
      ];
    }

    if (currentUser?.role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Learner Management', path: '/admin', icon: Users },
        { label: 'Centre Management', path: '/admin', icon: Building2 },
        { label: 'Course Management', path: '/admin', icon: BookOpen },
        { label: 'Assessment Management', path: '/admin', icon: CheckSquare },
        { label: 'Certification', path: '/admin', icon: Award },
        { label: 'Recruiter Management', path: '/admin', icon: Briefcase },
        { label: 'Analytics & Reports', path: '/admin', icon: BarChart3 },
        { label: 'User Management', path: '/admin', icon: UserCheck },
        { label: 'Content Library', path: '/admin', icon: FolderGit2 },
        { label: 'Notifications', path: '/admin', icon: MessageSquare },
        { label: 'System Settings', path: '/admin', icon: Settings },
        { label: 'Help & Support', path: '/admin', icon: HelpCircle }
      ];
    }

    if (currentUser?.role === 'CENTRE_OPERATOR') {
      return [
        { label: 'Dashboard', path: '/kiosk', icon: LayoutDashboard },
        { label: 'Register Learner', action: () => setRegisterLearnerOpen(true), icon: UserPlus },
        { label: 'Enrol in Course', action: () => setEnrolCourseOpen(true), icon: BookMarked },
        { label: 'Take Assessment', action: () => showToast('Opening Offline Assessment module', 'info'), icon: FileEdit },
        { label: 'Issue Certificate', action: () => setIssueCertOpen(true), icon: Award },
        { label: 'Learner Records', path: '/kiosk', icon: Users },
        { label: 'Offline Sync', path: '/kiosk', icon: RefreshCw },
        { label: 'Centre Profile', path: '/kiosk', icon: Building },
        { label: 'Reports', path: '/kiosk', icon: BarChart3 },
        { label: 'Help & Support', path: '/kiosk', icon: HelpCircle }
      ];
    }

    // Default Trainee Menu
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Learning', path: '/learning', icon: BookOpen },
      { label: 'Assessments', path: '/assessments', icon: ClipboardCheck },
      { label: 'Certificates', path: '/certificates', icon: Award },
      { label: 'Career Guidance', path: '/career', icon: Sparkles },
      { label: 'Job Opportunities', path: '/jobs', icon: Briefcase },
      { label: 'Profile', path: '/profile', icon: User },
      { label: 'My Attendance', path: '/dashboard', icon: CalendarCheck },
      { label: 'Messages', path: '/dashboard', icon: MessageSquare, badge: 2 },
      { label: 'Help & Support', path: '/dashboard', icon: HelpCircle }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-56 xl:w-60 bg-white border-r border-gray-200 shrink-0 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between py-4 px-3">
      
      {/* Navigation List */}
      <div className="space-y-1">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          
          if (item.action) {
            return (
              <button
                key={idx}
                onClick={item.action}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className="text-slate-500" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          }

          const isActive = location.pathname === item.path || 
            (item.path !== '/' && item.path !== '/dashboard' && item.path !== '/admin' && item.path !== '/recruiter' && item.path !== '/kiosk' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={idx}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-800 font-bold border-l-3 border-emerald-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-4 h-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Need Help Card */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <div className="bg-slate-50 rounded-xl p-3.5 border border-gray-200/80 text-center">
          <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center mx-auto mb-2 text-emerald-800">
            <Headphones size={17} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Need Help?</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Get support from KaushalAI team
          </p>
          <button
            onClick={() => showToast('Helpdesk ticket system online. Toll-free: 1800-NCCT-AI', 'info')}
            className="w-full mt-3 py-1.5 px-3 rounded-lg border border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white text-xs font-semibold transition"
          >
            Contact Support
          </button>
        </div>
      </div>

    </aside>
  );
}
