import React from 'react';
import { 
  X, CheckCircle2, ArrowRight, ShieldCheck, UserCheck, 
  BookOpen, Award, Sparkles, Briefcase, WifiOff, RefreshCw 
} from 'lucide-react';

export default function SihEvaluationTourModal({ 
  isOpen, 
  onClose, 
  currentStep, 
  onSelectStep 
}) {
  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "Ramesh Logs In",
      persona: "Trainee: Ramesh Kumar",
      desc: "Authentication via JWT. Trainee dashboard loads active enrollment at PTC Rampur.",
      actionLabel: "View Trainee Dashboard",
      tab: "journey",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 2,
      title: "Smart Kiosk Attendance",
      persona: "Hardware Doorway Kiosk",
      desc: "Simulate INT8 Face recognition (<80ms) / NFC tap / 2D QR scan with hardware HMAC.",
      actionLabel: "Open Smart Kiosk",
      tab: "attendance",
      openKiosk: true,
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 3,
      title: "Switch to Offline Mode",
      persona: "Edge Resilience",
      desc: "Network connection severed. Edge SQLite/local queue buffering activated.",
      actionLabel: "Toggle Network Offline",
      toggleOffline: true,
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 4,
      title: "Attendance Queued Offline",
      persona: "Edge Storage",
      desc: "Scan biometric event while offline. Event safely buffered with unique event ID.",
      actionLabel: "Trigger Offline Scan",
      openKiosk: true,
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 5,
      title: "Ramesh Completes LMS Lesson",
      persona: "Trainee LMS",
      desc: "Browse 22-module accounting syllabus, stream vernacular audio, and mark lesson complete.",
      actionLabel: "Open LMS Lesson",
      tab: "courses",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 6,
      title: "Ramesh Takes Assessment Quiz",
      persona: "Assessment Engine",
      desc: "Answer interactive assessment on Model Byelaws, Day-Book closing, and KCC subvention.",
      actionLabel: "Take Assessment Quiz",
      tab: "courses",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 7,
      title: "Ed25519 Certificate Generated",
      persona: "Cryptographic Engine",
      desc: "Passing assessment triggers instant asymmetric private-key signing of W3C credential ($0 gas).",
      actionLabel: "View Ed25519 Certificate",
      tab: "certificates",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 8,
      title: "AI Identifies Skill Gap",
      persona: "AI Gap Analyzer",
      desc: "Deterministic evaluation of acquired skills vs PACS Chief Accountant requirements.",
      actionLabel: "View Skill-Gap Report",
      tab: "ai",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 9,
      title: "AI Recommends Course & Job",
      persona: "Grounded RAG Assistant",
      desc: "RAG pipeline retrieves grounded policy citations to recommend exact courses and PACS jobs.",
      actionLabel: "Ask Grounded AI Assistant",
      tab: "ai",
      role: "ramesh@kaushalai.gov.in"
    },
    {
      step: 10,
      title: "Recruiter Discovers Ramesh",
      persona: "Recruiter: Amit Patel",
      desc: "Recruiter views ranked candidates with 4-factor explainable match breakdown (99.2%).",
      actionLabel: "Switch to Recruiter Portal",
      role: "recruiter@rampurpacs.coop"
    },
    {
      step: 11,
      title: "Public Zero-Login Verification",
      persona: "Public Registry",
      desc: "Recruiter or public employer cryptographically verifies Ed25519 signature without login.",
      actionLabel: "Open Public Verifier",
      verifyCert: "CERT-NCCT-2026-RAMESH01"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
              🏆
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                SIH 2026 Official Evaluation Walkthrough
              </h3>
              <p className="text-xs text-slate-400">
                11-Step End-to-End Operational Pipeline Demonstration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {steps.map((s) => (
            <div 
              key={s.step}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 transition flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  {s.step}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">{s.title}</h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {s.persona}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectStep(s);
                  onClose();
                }}
                className="shrink-0 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Jump</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>MINISTRY OF COOPERATION • NCCT</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-sans font-bold transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
