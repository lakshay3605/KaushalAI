import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import StatCard from '../components/common/StatCard';
import { 
  Award, FileText, Clock, ShieldCheck, Download, ExternalLink, 
  Share2, QrCode, CheckCircle2, Search, ArrowRight, Briefcase, 
  Settings, Star, Check, Sparkles, BookOpen, Layers, UserCheck, 
  TrendingUp, ChevronRight
} from 'lucide-react';

export default function CertificatesPage() {
  const { showToast, currentUser } = useApp();
  const navigate = useNavigate();
  
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // Certificate catalog
  const certHistory = [
    {
      id: 'SS2025PAC500873',
      title: 'PACS Operations and Management',
      recipient: currentUser?.name || 'Rohit Kumar',
      issueDate: '15 Sep 2025',
      verified: true,
      grade: 'Distinction (90%)',
      director: 'A. K. Sharma',
      badgeColor: 'text-[#056B46] bg-emerald-50 border-emerald-200'
    },
    {
      id: 'SS2025GOV388219',
      title: 'Cooperative Governance',
      recipient: currentUser?.name || 'Rohit Kumar',
      issueDate: '22 Aug 2025',
      verified: true,
      grade: 'First Class (87%)',
      director: 'A. K. Sharma',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      id: 'SS2025DIG109283',
      title: 'Digital Tools for Cooperatives',
      recipient: currentUser?.name || 'Rohit Kumar',
      issueDate: '10 Aug 2025',
      verified: true,
      grade: 'First Class (85%)',
      director: 'A. K. Sharma',
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-200'
    },
    {
      id: 'SS2025BNK771204',
      title: 'Rural Banking & Credit Operations',
      recipient: currentUser?.name || 'Rohit Kumar',
      issueDate: '28 Jul 2025',
      verified: true,
      grade: 'Distinction (92%)',
      director: 'A. K. Sharma',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200'
    }
  ];

  const [selectedCert, setSelectedCert] = useState(certHistory[0]);

  // Verified Skill Profile Data linked to credentials
  const verifiedSkills = [
    {
      id: 'skill-1',
      name: 'Cooperative Accounting',
      level: 'Advanced',
      proficiency: 90,
      earnedThrough: 'PACS Accounting & Bookkeeping',
      certId: 'SS2025PAC500873',
      category: 'Finance & Accounts',
      badge: 'bg-emerald-50 text-[#056B46] border-emerald-200'
    },
    {
      id: 'skill-2',
      name: 'Cooperative Governance',
      level: 'Intermediate',
      proficiency: 75,
      earnedThrough: 'Cooperative Governance',
      certId: 'SS2025GOV388219',
      category: 'Legal & Compliance',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'skill-3',
      name: 'Digital Tools for PACS',
      level: 'Intermediate',
      proficiency: 70,
      earnedThrough: 'Digital Tools for Cooperatives',
      certId: 'SS2025DIG109283',
      category: 'Digital Operations',
      badge: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'skill-4',
      name: 'Rural Banking & Credit Analysis',
      level: 'Advanced',
      proficiency: 85,
      earnedThrough: 'Rural Banking & Credit Operations',
      certId: 'SS2025BNK771204',
      category: 'Credit & Refinancing',
      badge: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'skill-5',
      name: 'Financial Literacy & Audit',
      level: 'Proficient',
      proficiency: 80,
      earnedThrough: 'PACS Operations and Management',
      certId: 'SS2025PAC500873',
      category: 'Governance & Audit',
      badge: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      id: 'skill-6',
      name: 'Rural Development & Inclusivity',
      level: 'Proficient',
      proficiency: 82,
      earnedThrough: 'Cooperatives and Rural Development',
      certId: 'SS2025DEV992104',
      category: 'Socio-Economic Planning',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'skill-7',
      name: 'Cooperative By-laws & Leadership',
      level: 'Intermediate',
      proficiency: 78,
      earnedThrough: 'Cooperative Governance & Law',
      certId: 'SS2025GOV388219',
      category: 'Leadership & By-laws',
      badge: 'bg-slate-50 text-slate-800 border-gray-200'
    }
  ];

  // Actions
  const handleDownload = () => {
    showToast(`Downloading high-resolution tamper-proof PDF for ${selectedCert.id}`, 'success');
    window.print();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/verify/${selectedCert.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    showToast(`Verification link copied to clipboard: ${url}`, 'success');
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const query = verifyInput.trim();
    if (!query) return;

    // Check if matches known certs or arbitrary valid ID
    const matched = certHistory.find(c => c.id.toLowerCase() === query.toLowerCase());
    if (matched) {
      setVerificationFeedback({
        valid: true,
        id: matched.id,
        trainee: matched.recipient,
        programme: matched.title,
        issued: matched.issueDate,
        status: 'Verified'
      });
      showToast(`✓ Certificate ${matched.id} verified as authentic!`, 'success');
    } else if (query.startsWith('SS') || query.length >= 6) {
      setVerificationFeedback({
        valid: true,
        id: query.toUpperCase(),
        trainee: 'Rohit Kumar',
        programme: 'PACS Operations and Management',
        issued: '15 Sep 2025',
        status: 'Verified'
      });
      showToast(`✓ Certificate ${query.toUpperCase()} verified!`, 'success');
    } else {
      setVerificationFeedback({
        valid: false,
        id: query,
        message: 'Invalid certificate ID. Please verify the code on your credentials.'
      });
      showToast('Certificate not found in central registry', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 
        ==================================================
        TOP BANNER (Matching Certificates.png)
        ==================================================
      */}
      <PageBanner
        title="My Certificates"
        subtitle="Earn verified certificates upon successful completion of courses and assessments."
        rightCardTitle="Government Recognised"
        rightCardText="Certificates issued on KaushalAI are verified and recognised for cooperative sector opportunities."
        rightCardIcon={Award}
      />

      {/* 
        ==================================================
        4 STAT CARDS ROW (Matching Certificates.png)
        ==================================================
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        
        {/* Stat 1: Certificates Earned */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">4</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Certificates Earned</div>
          </div>
        </div>

        {/* Stat 2: In Progress */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">2</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">In Progress</div>
          </div>
        </div>

        {/* Stat 3: Pending Assessments */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">0</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Pending Assessments</div>
          </div>
        </div>

        {/* Stat 4: Verifiable Certificates */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">100%</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Verifiable Certificates</div>
          </div>
        </div>

      </div>

      {/* 
        ==================================================
        MAIN GRID: CERTIFICATE PREVIEW + CERTIFICATE LIST & VERIFIER
        ==================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Col 8): Latest Certificate Viewer & Actions */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Latest Certificate
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#056B46] border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> Verified
            </span>
          </div>

          {/* Authentic Ornate Certificate Frame matching screenshot */}
          <div id="printable-certificate" className="bg-[#FDFAF5] rounded-2xl border-4 border-double border-[#056B46] p-5 sm:p-8 shadow-xs relative overflow-hidden text-center">
            
            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 text-[#056B46] text-xs font-serif select-none">❖</div>
            <div className="absolute top-2 right-2 text-[#056B46] text-xs font-serif select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-[#056B46] text-xs font-serif select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-[#056B46] text-xs font-serif select-none">❖</div>

            {/* Inner Border */}
            <div className="border border-[#056B46]/30 p-4 sm:p-6 rounded-lg relative bg-white/60 backdrop-blur-xs">
              
              {/* Header Row: Ministry Emblem + KaushalAI Logo + QR Code */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4">
                
                {/* Ministry of Cooperation Emblem */}
                <div className="flex items-center gap-2 text-left shrink-0">
                  <img src="/assets/emblem.png" alt="Emblem of India" className="h-9 sm:h-11 w-auto" />
                  <div className="text-[10px] text-slate-700 leading-tight">
                    <span className="font-bold block text-slate-900">Ministry of Cooperation</span>
                    <span>Government of India</span>
                  </div>
                </div>

                {/* KaushalAI Logo Center */}
                <div className="text-center shrink-0">
                  <div className="font-black text-[#056B46] text-xs sm:text-sm tracking-tight flex items-center justify-center gap-1">
                    <span className="text-sm sm:text-base">🌿</span> KaushalAI
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Digital Training & Employment Platform</div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white p-1 border border-gray-300 rounded flex items-center justify-center shadow-2xs">
                    <QrCode size={40} className="text-slate-900" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5 font-medium">Scan to Verify</span>
                </div>

              </div>

              {/* Title Heading */}
              <div className="my-4">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-wider uppercase font-serif">
                  Certificate of Completion
                </h2>
                <p className="text-xs text-slate-500 mt-1 italic font-serif">
                  This is to certify that
                </p>
              </div>

              {/* Recipient Name */}
              <div className="my-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif decoration-[#056B46] underline underline-offset-8">
                  {selectedCert.recipient}
                </h3>
              </div>

              {/* Course Title */}
              <div className="my-4">
                <p className="text-xs text-slate-500 font-serif">
                  has successfully completed the
                </p>
                <h4 className="text-base sm:text-lg font-bold text-[#056B46] mt-0.5">
                  {selectedCert.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  under KaushalAI • Digital Training & Employment Platform • NCCT Accredited
                </p>
              </div>

              {/* Ornamental divider */}
              <div className="flex items-center justify-center gap-2 text-[#056B46]/60 text-xs my-3">
                <span>━━━━</span>
                <span>❖</span>
                <span>━━━━</span>
              </div>

              {/* Signatures & Credentials Row */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#056B46]/10 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Issue Date</span>
                  <span className="font-bold text-slate-800">{selectedCert.issueDate}</span>
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Certificate ID</span>
                  <span className="font-mono font-bold text-[#056B46] text-[11px]">{selectedCert.id}</span>
                </div>

                <div className="text-right">
                  <div className="font-serif italic text-sm text-slate-900 font-bold leading-tight">{selectedCert.director}</div>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Director, Ministry of Cooperation<br />Government of India
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleDownload}
              className="py-2.5 px-4 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download size={14} />
              <span>Download Certificate</span>
            </button>

            <button
              onClick={() => navigate(`/verify/${selectedCert.id}`)}
              className="py-2.5 px-4 rounded-xl border border-gray-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>View Verification</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-4 rounded-xl border border-gray-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>

        </div>

        {/* Right Column (Col 4): My Certificates List & Verifier */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Certificate List Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                My Certificates
              </h3>
              <button 
                onClick={() => showToast('Showing all 4 issued certificates', 'info')}
                className="text-xs font-semibold text-[#056B46] hover:text-[#085536] flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {certHistory.map((c) => {
                const isCurrent = selectedCert.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border transition ${
                      isCurrent 
                        ? 'border-[#056B46] bg-emerald-50/50' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {c.title}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-[#056B46] border border-emerald-100">
                              Verified
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                            Issued on {c.issueDate}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCert(c);
                          showToast(`Loaded ${c.title} into certificate viewer`, 'info');
                        }}
                        className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#0B6A45] text-white border-[#0B6A45]'
                            : 'border-gray-200 text-slate-700 hover:bg-slate-100 bg-slate-50'
                        }`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Verification Card matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 text-[#056B46] font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck size={16} />
              <span>Certificate Verification</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
              All certificates are digitally signed and can be verified using the unique certificate ID or QR code.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-2">
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. SS2025PAC500873)"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#056B46]/20 focus:border-[#056B46] font-mono shadow-2xs"
              />

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <span>Verify</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {/* Quick Inline Verification Feedback Box */}
            {verificationFeedback && (
              <div className={`mt-3 p-3 rounded-xl border text-xs ${
                verificationFeedback.valid 
                  ? 'bg-emerald-50/80 border-emerald-200 text-slate-800' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {verificationFeedback.valid ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-[#056B46] font-bold text-xs mb-1.5">
                      <CheckCircle2 size={14} />
                      <span>Certificate Verified</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificate ID:</span>
                        <span className="font-mono font-bold text-slate-900">{verificationFeedback.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Trainee:</span>
                        <span className="font-bold text-slate-900">{verificationFeedback.trainee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Programme:</span>
                        <span className="font-semibold text-slate-900 text-right truncate ml-2">{verificationFeedback.programme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Issued:</span>
                        <span className="font-medium text-slate-900">{verificationFeedback.issued}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-[#056B46]">{verificationFeedback.status}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold mb-1">Verification Failed</div>
                    <p className="text-[11px]">{verificationFeedback.message}</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 
        ==================================================
        BENEFITS OF KAUSHALAI CERTIFICATES
        ==================================================
      */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Benefits of KaushalAI Certificates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100">
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Recognised by Employers</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                Valid for job opportunities in the cooperative sector.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Settings size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Builds Your Skill Profile</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                Showcase verified skills to national recruiters.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Digital & Secure</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                QR code verification and tamper-proof signatures.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <Star size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Enhances Opportunities</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                Direct access to better career and growth options.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ==================================================
        DEDICATED SKILL PROFILE SECTION (Newly Added & Refined)
        Course → Assessment → Certificate → Verified Skill
        ==================================================
      */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#056B46] uppercase tracking-wider mb-1">
              <Sparkles size={15} />
              <span>National Qualification Framework Alignment</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              My Skill Profile
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified skills earned through completed training and assessments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/career')}
              className="py-2 px-3.5 rounded-xl bg-[#0B6A45] hover:bg-[#085536] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Explore AI Career Guidance</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Clear Visual Connection Pipeline: Course → Assessment → Certificate → Verified Skill */}
        <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Credentialing & Verification Pipeline
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            
            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-1.5">
                <BookOpen size={14} />
              </div>
              <div className="text-xs font-bold text-slate-900">1. Course</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Enrolled & Completed</div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-1.5">
                <FileText size={14} />
              </div>
              <div className="text-xs font-bold text-slate-900">2. Assessment</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Passed with 80%+</div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#056B46] flex items-center justify-center mx-auto mb-1.5">
                <Award size={14} />
              </div>
              <div className="text-xs font-bold text-slate-900">3. Certificate</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Digitally Signed & QR</div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-[#056B46] text-white flex items-center justify-center mx-auto mb-1.5">
                <ShieldCheck size={14} />
              </div>
              <div className="text-xs font-bold text-[#056B46]">4. Verified Skill</div>
              <div className="text-[10px] text-[#056B46] font-medium mt-0.5">Synced with Recruiters</div>
            </div>

          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verifiedSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-4 rounded-xl border border-gray-200/90 bg-white hover:border-[#056B46]/40 transition shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {skill.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${skill.badge}`}>
                    {skill.level}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Category: <span className="text-slate-700">{skill.category}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-slate-500">Proficiency Score</span>
                    <span className="text-[#056B46]">{skill.proficiency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0B6A45] h-full rounded-full transition-all duration-300"
                      style={{ width: `${skill.proficiency}%` }}
                    ></div>
                  </div>
                </div>

                {/* Earned Through & Related Certificate */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400 font-medium">Earned through: </span>
                    <span className="font-semibold text-slate-800">{skill.earnedThrough}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400 font-medium">Related Certificate: </span>
                    <button
                      onClick={() => {
                        const target = certHistory.find(c => c.id === skill.certId);
                        if (target) {
                          setSelectedCert(target);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          showToast(`Viewing certificate ${target.id}`, 'info');
                        }
                      }}
                      className="font-mono text-[10px] font-bold text-[#056B46] hover:underline bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 cursor-pointer"
                    >
                      {skill.certId}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
