import React from 'react';
import { ShieldCheck, BookOpen, Users, TrendingUp } from 'lucide-react';
import PageBanner from '../components/common/PageBanner';

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <PageBanner
        title="About KaushalAI"
        subtitle="The unified digital training and employment platform empowering Primary Agricultural Credit Societies (PACS) and Cooperative Institutions across India."
        quoteText="“Building Stronger Cooperatives, Stronger India.”"
      />

      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-8">
            Under the vision of "Sahakar-se-Samriddhi" (Prosperity through Cooperation), KaushalAI was conceived to address the critical skill gaps within India's cooperative sector. By leveraging modern LMS technologies, verifiable Ed25519 digital certifications, and AI-driven career matching, we aim to modernize the workforce of over 100,000 PACS.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Standardized Quality</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We provide a unified curriculum approved by the National Council for Cooperative Training (NCCT), ensuring every trainee across the nation receives the same high-quality education.
              </p>
            </div>
            
            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Employment Linkage</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Beyond training, KaushalAI bridges the gap between skilled individuals and cooperative societies seeking talent, using our proprietary AI matching engine.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">The SIH 2026 Initiative</h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-8">
            This platform was built to solve the Smart India Hackathon (SIH) Problem Statement 26087. The Ministry of Cooperation mandated a robust digital ecosystem that not only trains professionals but ensures accountability, transparency (through verifiable certificates), and active employment linkages.
          </p>
        </div>
      </div>
    </div>
  );
}
