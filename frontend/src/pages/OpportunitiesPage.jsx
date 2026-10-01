import React from 'react';
import { Briefcase, Link as LinkIcon, Building2, TrendingUp } from 'lucide-react';
import PageBanner from '../components/common/PageBanner';

export default function OpportunitiesPage() {
  return (
    <div className="bg-white min-h-screen">
      <PageBanner
        title="Career Opportunities"
        subtitle="Bridging the gap between certified cooperative professionals and institutions seeking verified talent."
        quoteText="“Connecting skills with genuine impact.”"
      />

      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">Employment Linkage</h2>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
            KaushalAI ensures that your training translates into tangible career growth by maintaining a secure ecosystem for recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">For Trainees</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Upon completion of your NCCT-certified courses, your digital profile automatically becomes available to registered cooperative employers across your state. Our AI Guidance engine also recommends roles that perfectly match your verified competencies.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">For Recruiters</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Cooperative Banks, PACS, and Federations can log in to the Recruiter Portal to filter candidates by specific skill sets (e.g., "Advanced PACS Accounting"). You can verify candidate certificates cryptographically with one click.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">How it works</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#056B46] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Learn & Verify:</strong> Complete a module and pass the e-assessment to earn an Ed25519-signed certificate.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#056B46] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">AI Match:</strong> KaushalAI automatically links your skill profile to current industry demands.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#056B46] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Hire:</strong> Employers reach out directly with interview invitations via the platform.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
