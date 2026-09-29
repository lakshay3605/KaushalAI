import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, Play, BookOpen, Award, Briefcase, Users, 
  GraduationCap, Building2, CheckCircle2, X, FileCheck, Clock
} from 'lucide-react';

export default function LandingPage() {
  const { switchRole } = useApp();
  const navigate = useNavigate();
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      
      {/* 
        ==================================================
        HERO SECTION (Full-Width with 5-7vw padding)
        ==================================================
      */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 pt-8 pb-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 xl:gap-12">
          
          {/* LEFT SIDE (~48% width) */}
          <div className="w-full lg:w-[47%] shrink-0">
            
            {/* Small Green Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF7EE] border border-[#D1EED8] text-[#0B6A45] text-xs font-semibold mb-6">
              <span>Building Stronger Cooperatives, Stronger India</span>
            </div>

            {/* Large Heading matching reference typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-black text-slate-900 tracking-tight leading-[1.12]">
              Learn. Grow. <br />
              Build the <span className="text-[#056B46]">Cooperative</span> <br />
              Tomorrow.
            </h1>

            {/* Description */}
            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
              KaushalAI is a unified platform for cooperative training, certification, skill development and employment opportunities across India.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  switchRole('TRAINEE');
                  navigate('/dashboard');
                }}
                className="bg-[#0B6A45] hover:bg-[#085536] text-white font-semibold px-6 py-3 rounded-lg shadow-xs hover:shadow transition flex items-center gap-2 text-sm cursor-pointer"
              >
                <span>Online Programme Registration</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-5 py-3 rounded-lg border border-slate-300 shadow-2xs hover:shadow-xs transition flex items-center gap-2 text-sm cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white">
                  <Play size={9} fill="white" className="ml-0.5" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>

          </div>

          {/* RIGHT SIDE (~53% width) — Hero Image with 4 Floating Cards */}
          <div className="w-full lg:w-[53%] relative">
            <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm border border-gray-200/90 aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] min-h-[350px] sm:min-h-0 w-full flex items-center justify-end p-4 sm:p-6 lg:p-7 bg-slate-50">
              
              {/* Clean Background Photo (Farmer holding folder + PACS building with zero embedded text) */}
              <img
                src="/assets/hero_cooperative_professional.jpg"
                alt="Cooperative Professional at Primary Agricultural Credit Society"
                className="absolute inset-0 w-full h-full object-cover object-[left_top]"
                onError={(e) => {
                  e.target.src = '/assets/clean_hero_photo.jpg';
                }}
              />

              {/* Subtle Left Fade */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent pointer-events-none"></div>

              {/* 4 Floating Cards stacked on the right side of the image matching reference screenshot */}
              <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3 w-56 sm:w-64 max-w-full">
                
                {/* Card 1: Skill Development */}
                <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-md border border-gray-100 flex items-center gap-3 transition hover:scale-[1.02]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Skill Development</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Industry-relevant cooperative training</p>
                  </div>
                </div>

                {/* Card 2: Certified Learning */}
                <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-md border border-gray-100 flex items-center gap-3 transition hover:scale-[1.02]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Certified Learning</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Get verified credentials</p>
                  </div>
                </div>

                {/* Card 3: Better Opportunities */}
                <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-md border border-gray-100 flex items-center gap-3 transition hover:scale-[1.02]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Better Opportunities</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Connect with employers</p>
                  </div>
                </div>

                {/* Card 4: Stronger Cooperatives */}
                <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-md border border-gray-100 flex items-center gap-3 transition hover:scale-[1.02]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Stronger Cooperatives</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Empowering rural India</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 
        ==================================================
        FEATURE STRIP (Immediately below Hero with clean dividers)
        ==================================================
      */}
      <section id="about" className="w-full border-y border-gray-200/90 py-5 bg-white scroll-mt-20">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 py-3 sm:py-0 px-4 first:pl-0">
              <div className="w-11 h-11 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Training & LMS</h3>
                <p className="text-xs text-slate-500">Learn at your own pace</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 py-3 sm:py-0 px-4">
              <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Certification</h3>
                <p className="text-xs text-slate-500">Get verified credentials</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 py-3 sm:py-0 px-4">
              <div className="w-11 h-11 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Career Opportunities</h3>
                <p className="text-xs text-slate-500">Connect with employers</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3.5 py-3 sm:py-0 px-4 last:pr-0">
              <div className="w-11 h-11 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cooperative Ecosystem</h3>
                <p className="text-xs text-slate-500">Be part of a stronger India</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ==================================================
        STATISTICS SECTION (4 Columns with mint badges)
        ==================================================
      */}
      <section id="resources" className="w-full border-b border-gray-200/90 py-6 bg-white scroll-mt-20">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat 1 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">50,000+</div>
                <div className="text-xs text-slate-500 font-medium">Trainees Trained</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <Building2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">500+</div>
                <div className="text-xs text-slate-500 font-medium">Training Institutes</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">200+</div>
                <div className="text-xs text-slate-500 font-medium">Courses & Programmes</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">95%</div>
                <div className="text-xs text-slate-500 font-medium">Certification Success Rate</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ==================================================
        FEATURED PROGRAMMES & OUR IMPACT
        ==================================================
      */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-12 scroll-mt-20" id="programmes">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Popular Training Programmes (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-bold text-[#056B46] uppercase tracking-wider block">
                  FEATURED PROGRAMMES
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  Popular Training Programmes
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Industry-relevant courses designed for cooperative sector professionals.
                </p>
              </div>
              <Link 
                to="/learning" 
                className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#056B46] hover:underline"
              >
                <span>View All Programmes</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 3 Course Cards matching screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              
              {/* Course 1 */}
              <div 
                onClick={() => { switchRole('TRAINEE'); navigate('/learning'); }}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 overflow-hidden bg-slate-100">
                    <img 
                      src="/assets/popular_c1.jpg" 
                      alt="PACS Accounting & Bookkeeping" 
                      className="w-full h-full object-cover transition duration-300 hover:scale-105"
                      onError={(e) => { e.target.src = '/assets/course_digital_tools.jpg'; }}
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 bg-[#ECFDF5] text-[#059669]">
                      Accounting
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      PACS Accounting & Bookkeeping
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 pb-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>4 Modules</span>
                  <span>•</span>
                  <span>8 Weeks</span>
                  <span>•</span>
                  <button className="text-[#059669] font-bold hover:underline">Register Now</button>
                </div>
              </div>

              {/* Course 2 */}
              <div 
                onClick={() => { switchRole('TRAINEE'); navigate('/learning'); }}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 overflow-hidden bg-slate-100">
                    <img 
                      src="/assets/popular_c2.jpg" 
                      alt="Cooperative Society Management" 
                      className="w-full h-full object-cover transition duration-300 hover:scale-105"
                      onError={(e) => { e.target.src = '/assets/course_coop_mgmt.jpg'; }}
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 bg-[#EFF6FF] text-[#2563EB]">
                      Management
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      Cooperative Society Management
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 pb-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>6 Modules</span>
                  <span>•</span>
                  <span>10 Weeks</span>
                  <span>•</span>
                  <button className="text-[#059669] font-bold hover:underline">Register Now</button>
                </div>
              </div>

              {/* Course 3 */}
              <div 
                onClick={() => { switchRole('TRAINEE'); navigate('/learning'); }}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 overflow-hidden bg-slate-100">
                    <img 
                      src="/assets/popular_c3.jpg" 
                      alt="Rural Banking & Credit Operations" 
                      className="w-full h-full object-cover transition duration-300 hover:scale-105"
                      onError={(e) => { e.target.src = '/assets/course_rural_banking.jpg'; }}
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 bg-[#FFF7ED] text-[#EA580C]">
                      Operations
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      Rural Banking & Credit Operations
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 pb-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>5 Modules</span>
                  <span>•</span>
                  <span>8 Weeks</span>
                  <span>•</span>
                  <button className="text-[#059669] font-bold hover:underline">Register Now</button>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Our Impact Card (5 Cols) matching screenshot */}
          <div id="opportunities" className="lg:col-span-5 bg-[#F9FAFB] rounded-3xl border border-gray-200/90 shadow-2xs p-6 overflow-hidden scroll-mt-20">
            <span className="text-[10px] font-bold text-[#056B46] uppercase tracking-wider block">
              OUR IMPACT
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Empowering People, Strengthening Cooperatives
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              KaushalAI is helping build a skilled, accountable and future-ready cooperative ecosystem across India.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              
              {/* Quote text and author */}
              <div className="flex-1 space-y-3">
                <div className="text-2xl font-serif text-[#056B46] font-bold">“</div>
                <p className="text-xs italic text-slate-700 leading-relaxed -mt-3">
                  The training helped me understand PACS operations better. Now I feel more confident and job-ready.
                </p>

                <div className="flex items-center gap-2.5 pt-2">
                  <img
                    src="/assets/rohit_kumar.jpg"
                    alt="Ramesh Kumar"
                    className="w-10 h-10 rounded-full object-cover border border-emerald-600/30"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Ramesh Kumar</h4>
                    <p className="text-[10px] text-slate-500">Trainee, PACS Training Programme</p>
                  </div>
                </div>
              </div>

              {/* Right Side Photo of Farmer Family with Laptop */}
              <div className="w-36 h-36 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-gray-200">
                <img
                  src="/assets/impact_laptop.jpg"
                  alt="Farmer family learning on laptop"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/assets/landing_impact.jpg'; }}
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-emerald-400" />
                <span className="text-sm font-bold">KaushalAI Ecosystem Introduction</span>
              </div>
              <button onClick={() => setVideoModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <img
                src="/assets/lesson_video.jpg"
                alt="Video preview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-lg animate-pulse mb-3">
                  <Play size={24} fill="white" />
                </div>
                <h3 className="text-base font-bold">Smart India Hackathon 2026 • PS 26087</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Empowering 100,000+ Primary Agricultural Credit Societies through AI-enabled LMS, Ed25519 digital certificates, and explainable job matching.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-950 flex justify-end">
              <button
                onClick={() => setVideoModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
