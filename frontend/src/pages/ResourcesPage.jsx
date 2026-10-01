import React from 'react';
import { Download, FileText, FileBarChart, Video } from 'lucide-react';
import PageBanner from '../components/common/PageBanner';

export default function ResourcesPage() {
  const resources = [
    {
      title: 'NCCT National Curriculum Framework 2025',
      type: 'PDF',
      size: '2.4 MB',
      icon: <FileText size={20} />
    },
    {
      title: 'PACS Standard Operating Procedures (SOPs)',
      type: 'PDF',
      size: '1.8 MB',
      icon: <FileText size={20} />
    },
    {
      title: 'Digital Cooperative Infrastructure Guidelines',
      type: 'PDF',
      size: '3.1 MB',
      icon: <FileText size={20} />
    },
    {
      title: 'Cooperative Governance Model By-laws',
      type: 'PDF',
      size: '1.2 MB',
      icon: <FileText size={20} />
    },
    {
      title: 'Annual Cooperative Training Impact Report 2024',
      type: 'Report',
      size: '4.5 MB',
      icon: <FileBarChart size={20} />
    },
    {
      title: 'Navigating the KaushalAI Platform (Video Guide)',
      type: 'Video',
      size: '18 mins',
      icon: <Video size={20} />
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <PageBanner
        title="Resources & Guidelines"
        subtitle="Access official documentation, standard operating procedures, and reports from the Ministry of Cooperation."
        quoteText="“Equipping you with the right knowledge.”"
      />

      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">Official Documentation</h2>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
            These resources are openly available for trainees, cooperative administrators, and the general public.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#056B46] hover:shadow-sm transition bg-[#F8FAFC]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                  {res.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{res.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                    {res.type} • {res.size}
                  </p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-[#056B46] hover:bg-emerald-50 rounded-lg transition shrink-0" aria-label="Download Resource">
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
