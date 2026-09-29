import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import ProgressRing from '../components/common/ProgressRing';
import { 
  User, Mail, Phone, MapPin, Calendar, Globe, Edit3, 
  CheckCircle2, Circle, Plus, Award, BookOpen, Clock, 
  FileText, ShieldCheck, Camera, Sparkles, ArrowRight
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('personal'); // personal, education, skills, career, docs
  const [keySkills, setKeySkills] = useState([
    'Cooperative Accounting',
    'Financial Management',
    'Digital Tools',
    'Communication'
  ]);
  const [areasOfInterest, setAreasOfInterest] = useState([
    'Rural Development',
    'Cooperative Governance',
    'Agricultural Finance',
    'Community Development'
  ]);

  const handleAddSkill = () => {
    const newSkill = prompt('Enter a new cooperative skill:');
    if (newSkill && newSkill.trim()) {
      setKeySkills([...keySkills, newSkill.trim()]);
      showToast(`Skill '${newSkill.trim()}' added to your profile`, 'success');
    }
  };

  const handleAddInterest = () => {
    const newInterest = prompt('Enter a new area of interest:');
    if (newInterest && newInterest.trim()) {
      setAreasOfInterest([...areasOfInterest, newInterest.trim()]);
      showToast(`Interest '${newInterest.trim()}' added`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner matching Profile.png */}
      <PageBanner
        title="My Profile"
        subtitle="Manage your personal information, learning progress, skills and career preferences."
      />

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img
              src={currentUser?.avatar || '/assets/rohit_kumar.jpg'}
              alt={currentUser?.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-700/20"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
              }}
            />
            <button 
              onClick={() => showToast('Upload photo feature available in edit mode', 'info')}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-xs hover:bg-emerald-900"
            >
              <Camera size={13} />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentUser?.name || 'Rohit Kumar'}
              </h2>
              <CheckCircle2 size={18} className="text-emerald-700" />
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Trainee</p>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" /> Ranchi, Jharkhand
              </span>
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-slate-400" /> {currentUser?.email || 'rohit.kumar@example.com'}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" /> +91 98765 43210
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Cooperative Management
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Rural Development
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Financial Literacy
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => showToast('Opening profile editor modal', 'info')}
          className="px-4 py-2 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Edit3 size={13} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/90 shadow-2xs">
        {[
          { id: 'personal', label: 'Personal Information' },
          { id: 'education', label: 'Education' },
          { id: 'skills', label: 'Skills & Interests' },
          { id: 'career', label: 'Career Preferences' },
          { id: 'documents', label: 'Documents' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab 
                ? 'bg-emerald-800 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Details + Right Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Information Cards (Col 8) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Personal Information
              </h3>
              <button 
                onClick={() => showToast('Editing Personal Info', 'info')}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Full Name</span>
                <span className="font-bold text-slate-900">{currentUser?.name || 'Rohit Kumar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                <span className="font-bold text-slate-900">15 Mar 2002</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-bold text-slate-900">Male</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Address</span>
                <span className="font-bold text-slate-900">Ranchi, Jharkhand</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Preferred Language</span>
                <span className="font-bold text-slate-900">Hindi, English</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-bold text-slate-900">+91 98765 43210</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-bold text-slate-900">{currentUser?.email || 'rohit.kumar@example.com'}</span>
              </div>
            </div>
          </div>

          {/* Skills & Interests matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Skills & Interests
              </h3>
              <button 
                onClick={handleAddSkill}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            {/* Key Skills */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Key Skills</span>
              <div className="flex flex-wrap items-center gap-2">
                {keySkills.map((s, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    {s}
                  </span>
                ))}
                <button
                  onClick={handleAddSkill}
                  className="px-3 py-1 border border-dashed border-gray-300 hover:border-emerald-700 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Skill
                </button>
              </div>
            </div>

            {/* Areas of Interest */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Areas of Interest</span>
              <div className="flex flex-wrap items-center gap-2">
                {areasOfInterest.map((a, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200">
                    {a}
                  </span>
                ))}
                <button
                  onClick={handleAddInterest}
                  className="px-3 py-1 border border-dashed border-gray-300 hover:border-blue-600 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Interest
                </button>
              </div>
            </div>
          </div>

          {/* Career Preferences */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Career Preferences
              </h3>
              <button 
                onClick={() => showToast('Career preferences saved', 'success')}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Preferred Job Roles</span>
                <span className="font-bold text-slate-900">PACS Manager, Field Officer, Cooperative Accountant</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Preferred Location</span>
                <span className="font-bold text-slate-900">Jharkhand, Bihar, Delhi (NCR)</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Work Type</span>
                <span className="font-bold text-slate-900">Full Time</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Expected Salary Range</span>
                <span className="font-bold text-slate-900">₹3 – 6 LPA</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Profile Completion, Progress, Achievements (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Profile Completion Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Profile Completion
            </h3>

            <div className="flex items-center gap-4 my-2">
              <ProgressRing
                percentage={85}
                size={80}
                strokeWidth={8}
                color="#047857"
              />
              <div className="text-xs text-slate-500 leading-snug">
                <span className="font-bold text-slate-900 block">Almost there!</span>
                Complete your profile to get better job recommendations.
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                <span>Personal Information</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                <span>Educational Details</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                <span>Skills & Interests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                <span>Career Preferences</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Circle size={13} className="shrink-0" />
                <span>Upload Profile Photo</span>
              </div>
            </div>

            <button
              onClick={() => showToast('Profile verified 85% - compliant with NCCT standards', 'info')}
              className="w-full mt-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
            >
              <span>Complete Profile</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Learning Progress 4-metric strip */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Learning Progress
              </h3>
              <span className="text-[11px] text-emerald-800 font-bold">View All →</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                <BookOpen size={16} className="text-emerald-700 mx-auto mb-1" />
                <div className="text-lg font-black text-slate-900">6</div>
                <div className="text-[10px] text-slate-500">Courses Completed</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <FileText size={16} className="text-purple-700 mx-auto mb-1" />
                <div className="text-lg font-black text-purple-800">2</div>
                <div className="text-[10px] text-purple-600">Assessments Pending</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <Award size={16} className="text-amber-700 mx-auto mb-1" />
                <div className="text-lg font-black text-amber-800">4</div>
                <div className="text-[10px] text-amber-600">Certificates Earned</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <Clock size={16} className="text-blue-700 mx-auto mb-1" />
                <div className="text-lg font-black text-blue-800">32 hrs</div>
                <div className="text-[10px] text-blue-600">Total Learning Time</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Achievements
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <h4 className="font-bold text-slate-900">Quick Learner</h4>
                  <p className="text-[10px] text-slate-500">Completed 5 courses • 10 Sep 2025</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center gap-3">
                <span className="text-xl">🎖️</span>
                <div>
                  <h4 className="font-bold text-slate-900">Assessment Pro</h4>
                  <p className="text-[10px] text-slate-500">Scored 90%+ on first attempt</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
