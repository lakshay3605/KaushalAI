import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-white border-t border-gray-200 mt-12 py-8 text-slate-600 text-xs scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/assets/emblem.png" alt="Emblem" className="h-8 w-auto object-contain" />
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                KaushalAI
              </div>
              <p className="text-[11px] text-slate-500">
                National Council for Cooperative Training (NCCT) • Ministry of Cooperation, GoI
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/" className="hover:text-emerald-800 transition">Home</Link>
            <Link to="/learning" className="hover:text-emerald-800 transition">LMS Courses</Link>
            <Link to="/assessments" className="hover:text-emerald-800 transition">Exams</Link>
            <Link to="/certificates" className="hover:text-emerald-800 transition">Certificates</Link>
            <Link to="/career" className="hover:text-emerald-800 transition">AI Guidance</Link>
            <Link to="/jobs" className="hover:text-emerald-800 transition">Opportunities</Link>
            <Link to="/verify" className="hover:text-emerald-800 transition flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck size={14} /> Public Verifier
            </Link>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>
            Smart India Hackathon (SIH 2026) • Problem Statement ID: 26087
          </p>
          <p className="flex items-center gap-1">
            Built for 3-tier Cooperative Skilling & Employment Ecosystem
          </p>
        </div>
      </div>
    </footer>
  );
}
