import React from 'react';
import { BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import PageBanner from '../components/common/PageBanner';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProgrammesPage() {
  const { switchRole } = useApp();

  const programmes = [
    {
      title: 'PACS Accounting & Bookkeeping',
      category: 'Accounting',
      desc: 'Master the double-entry accounting system, daily ledger maintenance, and statutory audit compliance specifically tailored for Primary Agricultural Credit Societies.',
      img: '/assets/popular_c1.jpg',
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      title: 'Cooperative Society Management',
      category: 'Governance',
      desc: 'Learn cooperative principles, MSCS Act 2002 guidelines, and effective management strategies for rural cooperatives.',
      img: '/assets/popular_c2.jpg',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      title: 'Digital Tools for PACS',
      category: 'IT / Digital',
      desc: 'Transition from physical registers to digital ERPs. Learn to use the national cooperative software and manage data securely.',
      img: '/assets/popular_c3.jpg',
      color: 'bg-amber-50 text-amber-700'
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <PageBanner
        title="Training Programmes"
        subtitle="Explore our comprehensive list of NCCT-approved courses designed for cooperative sector professionals."
        quoteText="“Knowledge is the foundation of a strong cooperative.”"
      />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">Featured Curriculum</h2>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
            Our programmes are designed with both classroom theoretical foundations and extensive practical lab work for real-world readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programmes.map((p, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col">
              <div className="h-40 overflow-hidden bg-slate-100">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/assets/clean_hero_photo.jpg'; }} />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold mb-3 self-start ${p.color}`}>
                  {p.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                  {p.desc}
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-600" /> NCCT Certified
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Blended Learning
                  </div>
                </div>

                <Link 
                  to="/dashboard"
                  onClick={() => switchRole('TRAINEE')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#056B46] border border-gray-200 rounded-lg text-sm font-bold text-center transition"
                >
                  Register as Trainee
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
