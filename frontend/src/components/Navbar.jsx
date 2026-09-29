import React from 'react';
import { 
  Building2, UserCheck, ShieldCheck, Briefcase, 
  Wifi, WifiOff, RefreshCw, KeyRound, LogOut, CheckCircle2, Award 
} from 'lucide-react';

export default function Navbar({ 
  user, 
  onSwitchUser, 
  activeTab, 
  setActiveTab, 
  isOffline, 
  setIsOffline, 
  pendingSyncCount, 
  onSyncOffline, 
  onOpenKiosk,
  onOpenTour
}) {
  const demoUsers = [
    { name: 'Ramesh Kumar', role: 'TRAINEE', email: 'ramesh@kaushalai.gov.in', label: 'Trainee (Ramesh)' },
    { name: 'Amit Patel', role: 'RECRUITER', email: 'recruiter@rampurpacs.coop', label: 'Recruiter (PACS)' },
    { name: 'Rajesh Verma', role: 'INSTITUTE_ADMIN', email: 'admin@rampur.ncct.gov.in', label: 'Admin (NCCT)' },
    { name: 'Dr. Priya Sharma', role: 'TRAINER', email: 'trainer@kaushalai.gov.in', label: 'Trainer (Faculty)' }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Indian National Tricolor Top Stripe */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white border-y border-slate-200"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Logo & Ministry Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-amber-400 font-black text-lg shadow-sm border border-blue-900">
              सं
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 tracking-tight">KaushalAI</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase font-mono">
                  SIH #26087
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Ministry of Cooperation • National Council for Cooperative Training (NCCT)
              </p>
            </div>
          </div>

          {/* Quick Actions & Demo Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* SIH Walkthrough Guide Button */}
            <button
              onClick={onOpenTour}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xs transition cursor-pointer"
              title="Open SIH 11-Step Official Evaluation Walkthrough"
            >
              <span>🏆 SIH Evaluation Tour</span>
            </button>

            {/* Kiosk Simulator Quick Launch */}
            <button 
              onClick={onOpenKiosk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs cursor-pointer"
              title="Launch Doorway Biometric Kiosk Hardware Simulator"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Smart Kiosk</span>
            </button>

            {/* Offline Mode Toggle & Sync Status */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
              <button
                onClick={() => setIsOffline(!isOffline)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  isOffline ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Toggle simulated network connectivity"
              >
                {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
                <span>{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
              </button>

              {pendingSyncCount > 0 && (
                <button
                  onClick={onSyncOffline}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-200 text-amber-950 hover:bg-amber-300 font-extrabold text-xs cursor-pointer border border-amber-300"
                  title="Click to sync offline events to server"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{pendingSyncCount} SYNC</span>
                </button>
              )}
            </div>

            {/* Role Demo Switcher Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <select
                value={user?.email || ''}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {demoUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Public Certificate Verifier Tab */}
            <button
              onClick={() => setActiveTab('verify')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                activeTab === 'verify' 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Verify Credential</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
