import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Users, GraduationCap, Briefcase, Building2, Search, SlidersHorizontal, 
  CheckCircle2, FileText, ArrowRight, Star, MapPin, Calendar, Clock, 
  ExternalLink, X, ShieldCheck, Check, Send, Award, Phone, Mail, 
  Sparkles, Filter, Plus, ChevronRight, ChevronDown, MessageSquare, 
  HelpCircle, TrendingUp, AlertCircle, Eye, Share2, Download, Building,
  Layers, CheckSquare, RefreshCw
} from 'lucide-react';

export default function RecruiterPortalPage() {
  const { shortlistedIds, toggleShortlist, showToast } = useApp();
  const navigate = useNavigate();
  const { candidateId: routeCandidateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active section/tab: candidates | postings | applications | shortlisted | interviews | messages | profile | analytics
  const activeTab = searchParams.get('tab') || 'candidates';
  const setActiveTab = (tab) => {
    if (tab === 'candidates') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All');
  const [selectedExpFilter, setSelectedExpFilter] = useState('All');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');

  // Modals
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);
  const [viewingCandidateProfileId, setViewingCandidateProfileId] = useState(routeCandidateId || null);
  const [certVerificationModal, setCertVerificationModal] = useState(null);
  const [jobPostModalOpen, setJobPostModalOpen] = useState(false);
  const [aiMatchModalJob, setAiMatchModalJob] = useState(null);
  const [contactCandidateModal, setContactCandidateModal] = useState(null);
  const [contactSubject, setContactSubject] = useState('Interview Invitation: PACS Manager Position');
  const [contactMessage, setContactMessage] = useState('Dear Candidate,\n\nWe were impressed by your verified NCCT certifications and practical PACS accounting credentials on KaushalAI. We would like to invite you for an interview regarding the PACS Manager role at Jharkhand State Cooperative Bank.\n\nPlease let us know your availability this week.\n\nRegards,\nAnjali Mehta\nTalent Acquisition, Jharkhand State Cooperative Bank');

  // Multi-select for candidate bulk actions
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});

  // ----------------------------------------------------
  // DATA MODEL: Shared Verified Candidates
  // Connected to same Trainee Certification Ecosystem
  // ----------------------------------------------------
  const candidatesData = [
    {
      id: 'rohit-kumar',
      name: 'Rohit Kumar',
      role: 'PACS / Cooperative Operations',
      location: 'Ranchi, Jharkhand',
      experience: '1–3 Years',
      matchScore: 92,
      availability: 'Ready to Join',
      certId: 'SS2025PAC500873',
      verifiedCertCount: 4,
      avatar: '/assets/rohit_kumar.jpg',
      phone: '+91 98351 44820',
      email: 'rohit.kumar@example.com',
      about: 'Certified PACS operations specialist with deep domain expertise in cooperative by-laws, computerized double-entry accounting, day-book reconciliation, and agricultural credit disbursement. Completed 240+ hours of accredited NCCT classroom and practical ERP lab training at Ranchi Cooperative Training Centre.',
      skills: ['Cooperative Operations', 'Cooperative Accounting', 'Digital Tools', 'Rural Banking', 'Day Book'],
      verifiedSkills: [
        { name: 'Cooperative Accounting', level: 'Advanced', score: 90, source: 'PACS Accounting & Bookkeeping (NCCT/CTI-04)' },
        { name: 'Cooperative Operations', level: 'Advanced', score: 88, source: 'PACS Operations & By-laws Assessment' },
        { name: 'Digital Tools for PACS', level: 'Proficient', score: 85, source: 'ERP & MIS Practical Lab Test' },
        { name: 'Rural Banking & Credit', level: 'Intermediate', score: 82, source: 'NCDC Rural Credit Evaluation' },
        { name: 'Day Book Management', level: 'Proficient', score: 86, source: 'PACS Day Book Practical' }
      ],
      certificates: [
        {
          id: 'SS2025PAC500873',
          title: 'Certificate in PACS Accounting & Bookkeeping',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '15 Sep 2025',
          grade: 'Distinction (90%)',
          signature: 'ed25519:7b3a9e4f2081d5a7c29348e89fbc0214'
        },
        {
          id: 'SS2025GOV500214',
          title: 'Certificate in Cooperative Governance & Management',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '28 Aug 2025',
          grade: 'First Class (85%)',
          signature: 'ed25519:3c2f81a709d44e5b981249b6d859a011'
        },
        {
          id: 'SS2025DIG500412',
          title: 'Certificate in Digital Tools for PACS',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '10 Jul 2025',
          grade: 'First Class (88%)',
          signature: 'ed25519:9a410b5712e87c09f3d518290374ea82'
        },
        {
          id: 'SS2025RUR500109',
          title: 'Rural Cooperative Banking Fundamentals',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '20 May 2025',
          grade: 'Grade B+ (82%)',
          signature: 'ed25519:1d859b4072fa0192e4827104b2958c20'
        }
      ],
      coursesCompleted: [
        { title: 'PACS Accounting & Bookkeeping', score: 90, status: '100% Completed' },
        { title: 'Cooperative Governance & Management', score: 85, status: '100% Completed' },
        { title: 'Digital Tools for PACS', score: 88, status: '100% Completed' }
      ],
      assessmentScores: [
        { subject: 'PACS Accounting Basics', score: 90, grade: 'A+' },
        { subject: 'Cooperative Governance', score: 85, grade: 'A' },
        { subject: 'Digital Tools & MIS', score: 88, grade: 'A' },
        { subject: 'Rural Banking Principles', score: 82, grade: 'B+' }
      ],
      careerInterests: ['PACS Manager', 'Branch Accountant', 'Cooperative Society Inspector'],
      matchBreakdown: {
        skills: '42 / 45 pts (Cooperative Operations, Accounting, Digital Tools verified)',
        cert: '25 / 25 pts (Ed25519 Verified NCCT Credential SS2025PAC500873)',
        location: '15 / 15 pts (Local resident of Ranchi, Jharkhand)',
        experience: '10 / 15 pts (1.5 years PACS operations & day-book handling)'
      }
    },
    {
      id: 'priya-kumari',
      name: 'Priya Kumari',
      role: 'PACS Operations and Management',
      location: 'Ranchi, Jharkhand',
      experience: '1–2 Years',
      matchScore: 85,
      availability: 'Ready to Join',
      certId: 'SS-2025-001234',
      verifiedCertCount: 3,
      avatar: '/assets/priya_kumari.jpg',
      phone: '+91 94311 88392',
      email: 'priya.kumari@example.com',
      about: 'Dedicated cooperative administrator trained in state and multi-state cooperative by-laws, statutory audit compliance, and grassroots member mobilization. Proven record of managing daily PACS member registers.',
      skills: ['Cooperative Governance', 'MS Office', 'Financial Literacy', 'PACS Accounting', 'By-laws'],
      verifiedSkills: [
        { name: 'Cooperative Governance', level: 'Advanced', score: 88, source: 'Cooperative Governance & Management' },
        { name: 'MS Office & MIS', level: 'Advanced', score: 92, source: 'Digital Tools for PACS' },
        { name: 'Financial Literacy', level: 'Proficient', score: 84, source: 'PACS Financial Basics' },
        { name: 'By-laws Compliance', level: 'Proficient', score: 86, source: 'MSCS Act 2002 Evaluation' }
      ],
      certificates: [
        {
          id: 'SS-2025-001234',
          title: 'PACS Operations and Management',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '04 Aug 2025',
          grade: 'Distinction (89%)',
          signature: 'ed25519:6f1b802a48d91c73e045239bca881729'
        }
      ],
      coursesCompleted: [
        { title: 'Cooperative Governance & Management', score: 88, status: '100% Completed' },
        { title: 'PACS Operations & By-laws', score: 86, status: '100% Completed' }
      ],
      assessmentScores: [
        { subject: 'Cooperative Governance', score: 88, grade: 'A' },
        { subject: 'PACS Operations', score: 86, grade: 'A' }
      ],
      careerInterests: ['PACS Administrator', 'Governance Officer', 'Credit Coordinator'],
      matchBreakdown: {
        skills: '38 / 45 pts (Expert in PACS governance & member relations)',
        cert: '25 / 25 pts (Verified Ed25519 NCCT Credential)',
        location: '15 / 15 pts (Resident of Ranchi)',
        experience: '7 / 15 pts (1.2 years in village-level PACS)'
      }
    },
    {
      id: 'amit-verma',
      name: 'Amit Verma',
      role: 'Credit & Loan Management',
      location: 'Patna, Bihar',
      experience: 'Fresher',
      matchScore: 78,
      availability: '15 Days',
      certId: 'SS-2025-002567',
      verifiedCertCount: 2,
      avatar: '/assets/amit_verma.jpg',
      phone: '+91 98350 12948',
      email: 'amit.verma@example.com',
      about: 'Agricultural finance graduate with intensive training in Kisan Credit Card (KCC) documentation, short-term seasonal credit appraisal, and micro-loan recovery protocols under NABARD guidelines.',
      skills: ['Credit Analysis', 'Digital Tools (MIS)', 'Data Entry', 'Loan Recovery'],
      verifiedSkills: [
        { name: 'Credit Analysis', level: 'Proficient', score: 84, source: 'Rural Credit Appraisal' },
        { name: 'Digital Tools (MIS)', level: 'Proficient', score: 82, source: 'Digital Tools for PACS' },
        { name: 'Data Entry', level: 'Advanced', score: 90, source: 'PACS MIS Data Entry' },
        { name: 'Loan Recovery', level: 'Intermediate', score: 78, source: 'NCDC Loan Management' }
      ],
      certificates: [
        {
          id: 'SS-2025-002567',
          title: 'Rural Credit & Loan Management',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '18 Jul 2025',
          grade: 'First Class (84%)',
          signature: 'ed25519:82fa0192e4827104b2958c207b3a9e4f'
        }
      ],
      coursesCompleted: [
        { title: 'Rural Credit & Loan Appraisal', score: 84, status: '100% Completed' }
      ],
      assessmentScores: [
        { subject: 'Credit Analysis', score: 84, grade: 'A' },
        { subject: 'MIS & Reporting', score: 82, grade: 'B+' }
      ],
      careerInterests: ['Credit Officer', 'Loan Recovery Inspector', 'Field Supervisor'],
      matchBreakdown: {
        skills: '35 / 45 pts (Strong credit appraisal and KCC knowledge)',
        cert: '25 / 25 pts (Verified Ed25519 NCCT Credential)',
        location: '10 / 15 pts (Based in Patna, open to Ranchi relocation)',
        experience: '8 / 15 pts (6-month apprenticeship at DCCB Patna)'
      }
    },
    {
      id: 'neha-singh',
      name: 'Neha Singh',
      role: 'Digital Tools for PACS',
      location: 'Lucknow, Uttar Pradesh',
      experience: '1–2 Years',
      matchScore: 88,
      availability: 'Ready to Join',
      certId: 'SS-2025-003891',
      verifiedCertCount: 3,
      avatar: '/assets/neha_singh.jpg',
      phone: '+91 97210 55431',
      email: 'neha.singh@example.com',
      about: 'Specialized in computerization of rural cooperatives using government ERP software, cloud ledger synchronization, and Aadhaar-enabled fertilizer subsidy integration.',
      skills: ['MIS', 'Data Analysis', 'Communication', 'ERP Integration', 'Day Book'],
      verifiedSkills: [
        { name: 'MIS & Reporting', level: 'Advanced', score: 94, source: 'Digital Tools for PACS' },
        { name: 'Data Analysis', level: 'Proficient', score: 86, source: 'PACS MIS & Reporting' },
        { name: 'Communication', level: 'Advanced', score: 90, source: 'Cooperative Management Skills' },
        { name: 'ERP Integration', level: 'Proficient', score: 85, source: 'National PACS ERP Lab' }
      ],
      certificates: [
        {
          id: 'SS-2025-003891',
          title: 'Digital Tools and MIS for PACS',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '24 Jun 2025',
          grade: 'Distinction (91%)',
          signature: 'ed25519:12e87c09f3d518290374ea829a410b57'
        }
      ],
      coursesCompleted: [
        { title: 'Digital Tools for PACS', score: 94, status: '100% Completed' }
      ],
      assessmentScores: [
        { subject: 'MIS Software', score: 94, grade: 'A+' },
        { subject: 'Data Analysis', score: 86, grade: 'A' }
      ],
      careerInterests: ['MIS Executive', 'ERP Specialist', 'PACS Computer Operator'],
      matchBreakdown: {
        skills: '41 / 45 pts (Specialized in computerized PACS software)',
        cert: '25 / 25 pts (Verified Ed25519 NCCT Credential)',
        location: '12 / 15 pts (Based in Lucknow, willing to relocate)',
        experience: '10 / 15 pts (1.8 years computerized accounting)'
      }
    },
    {
      id: 'saurav-patel',
      name: 'Saurav Patel',
      role: 'Cooperative Society Management',
      location: 'Bhopal, Madhya Pradesh',
      experience: '2–3 Years',
      matchScore: 82,
      availability: '1 Month',
      certId: 'SS-2025-004112',
      verifiedCertCount: 3,
      avatar: '/assets/saurav_patel.jpg',
      phone: '+91 98260 44923',
      email: 'saurav.patel@example.com',
      about: 'Experienced cooperative manager with expertise in dairy and agricultural multi-purpose societies, managing board resolutions, statutory meetings, and member welfare programs.',
      skills: ['Cooperative Law', 'Leadership', 'Community Outreach', 'Auditing'],
      verifiedSkills: [
        { name: 'Cooperative Law', level: 'Advanced', score: 89, source: 'Multi-State Cooperative Societies Act' },
        { name: 'Leadership', level: 'Advanced', score: 88, source: 'Cooperative Leadership & Ethics' },
        { name: 'Community Outreach', level: 'Advanced', score: 91, source: 'Member Engagement Practical' },
        { name: 'Auditing', level: 'Proficient', score: 82, source: 'PACS Internal Audit Basics' }
      ],
      certificates: [
        {
          id: 'SS-2025-004112',
          title: 'Cooperative Society Management & Law',
          issuer: 'National Council for Cooperative Training (NCCT)',
          issuedOn: '12 May 2025',
          grade: 'First Class (87%)',
          signature: 'ed25519:48e89fbc02147b3a9e4f2081d5a7c293'
        }
      ],
      coursesCompleted: [
        { title: 'Cooperative Law & Governance', score: 89, status: '100% Completed' }
      ],
      assessmentScores: [
        { subject: 'Cooperative Law', score: 89, grade: 'A' },
        { subject: 'Management & Audit', score: 82, grade: 'B+' }
      ],
      careerInterests: ['Society Manager', 'General Manager Dairy Coop', 'Regulatory Inspector'],
      matchBreakdown: {
        skills: '38 / 45 pts (Deep knowledge of cooperative law & leadership)',
        cert: '25 / 25 pts (Verified Ed25519 NCCT Credential)',
        location: '9 / 15 pts (Bhopal based)',
        experience: '10 / 15 pts (2.2 years managing rural cooperative)'
      }
    }
  ];

  // ----------------------------------------------------
  // JOB POSTINGS DATA MODEL
  // ----------------------------------------------------
  const [jobPostings, setJobPostings] = useState([
    {
      id: 'job-1',
      title: 'PACS Manager',
      org: 'Jharkhand State Cooperative Bank',
      location: 'Ranchi, Jharkhand',
      type: 'Full Time',
      experience: '1–3 Years',
      salary: '₹4.5 – 6.0 LPA',
      deadline: '15 Oct 2026',
      status: 'Active',
      requiredSkills: ['Cooperative Operations', 'Cooperative Accounting', 'Leadership', 'Digital Tools'],
      preferredSkills: ['Rural Banking', 'Internal Audit', 'By-laws'],
      description: 'Lead operations, credit delivery, day-book reconciliation, and member mobilization for computerized Primary Agricultural Credit Society. Direct supervision of loan disbursement under government interest subvention schemes.',
      applicantsCount: 18,
      shortlistedCount: 4
    },
    {
      id: 'job-2',
      title: 'Credit & Loan Officer',
      org: 'Ranchi District Central Cooperative Bank',
      location: 'Ranchi, Jharkhand',
      type: 'Full Time',
      experience: 'Fresher to 2 Years',
      salary: '₹3.8 – 5.2 LPA',
      deadline: '25 Oct 2026',
      status: 'Active',
      requiredSkills: ['Credit Analysis', 'Loan Recovery', 'Digital Tools (MIS)', 'Financial Literacy'],
      preferredSkills: ['Kisan Credit Card (KCC)', 'NCDC Guidelines'],
      description: 'Appraise short-term crop loans, monitor recovery cycles, verify land revenue records, and synchronize credit records with NABARD core banking interface.',
      applicantsCount: 12,
      shortlistedCount: 3
    },
    {
      id: 'job-3',
      title: 'Digital PACS Accountant',
      org: 'Bihar State Cooperative Marketing Union',
      location: 'Patna, Bihar',
      type: 'Full Time',
      experience: '1–2 Years',
      salary: '₹3.6 – 4.8 LPA',
      deadline: '30 Oct 2026',
      status: 'Active',
      requiredSkills: ['Cooperative Accounting', 'Day Book Management', 'Digital Tools', 'MIS'],
      preferredSkills: ['Tally ERP', 'GST in Cooperatives'],
      description: 'Handle computerized voucher entry, cash book balancing, fertilizer sale ledgers, and government procurement accounts under national PACS computerization standard.',
      applicantsCount: 14,
      shortlistedCount: 2
    }
  ]);

  // ----------------------------------------------------
  // APPLICATIONS DATA MODEL
  // ----------------------------------------------------
  const [applications, setApplications] = useState([
    {
      id: 'app-1',
      candidateId: 'rohit-kumar',
      candidateName: 'Rohit Kumar',
      avatar: '/assets/rohit_kumar.jpg',
      jobId: 'job-1',
      jobTitle: 'PACS Manager',
      appliedDate: '28 Sep 2026',
      matchScore: 92,
      status: 'Shortlisted'
    },
    {
      id: 'app-2',
      candidateId: 'priya-kumari',
      candidateName: 'Priya Kumari',
      avatar: '/assets/priya_kumari.jpg',
      jobId: 'job-1',
      jobTitle: 'PACS Manager',
      appliedDate: '27 Sep 2026',
      matchScore: 85,
      status: 'Under Review'
    },
    {
      id: 'app-3',
      candidateId: 'amit-verma',
      candidateName: 'Amit Verma',
      avatar: '/assets/amit_verma.jpg',
      jobId: 'job-2',
      jobTitle: 'Credit & Loan Officer',
      appliedDate: '26 Sep 2026',
      matchScore: 78,
      status: 'Applied'
    },
    {
      id: 'app-4',
      candidateId: 'neha-singh',
      candidateName: 'Neha Singh',
      avatar: '/assets/neha_singh.jpg',
      jobId: 'job-3',
      jobTitle: 'Digital PACS Accountant',
      appliedDate: '25 Sep 2026',
      matchScore: 88,
      status: 'Interview'
    },
    {
      id: 'app-5',
      candidateId: 'saurav-patel',
      candidateName: 'Saurav Patel',
      avatar: '/assets/saurav_patel.jpg',
      jobId: 'job-1',
      jobTitle: 'PACS Manager',
      appliedDate: '24 Sep 2026',
      matchScore: 82,
      status: 'Under Review'
    },
    {
      id: 'app-6',
      candidateId: 'c-ravi',
      candidateName: 'Ravi Kumar',
      avatar: '/assets/rohit_kumar.jpg',
      jobId: 'job-1',
      jobTitle: 'PACS Operations',
      appliedDate: '2 hours ago',
      matchScore: 80,
      status: 'Applied'
    },
    {
      id: 'app-7',
      candidateId: 'c-anjali',
      candidateName: 'Anjali Singh',
      avatar: '/assets/priya_kumari.jpg',
      jobId: 'job-2',
      jobTitle: 'Credit & Loan Management',
      appliedDate: '5 hours ago',
      matchScore: 76,
      status: 'Under Review'
    },
    {
      id: 'app-8',
      candidateId: 'c-vikram',
      candidateName: 'Vikram Patel',
      avatar: '/assets/amit_verma.jpg',
      jobId: 'job-3',
      jobTitle: 'Digital Tools for PACS',
      appliedDate: '1 day ago',
      matchScore: 84,
      status: 'Shortlisted'
    },
    {
      id: 'app-9',
      candidateId: 'c-meera',
      candidateName: 'Meera Nair',
      avatar: '/assets/neha_singh.jpg',
      jobId: 'job-1',
      jobTitle: 'Cooperative Governance',
      appliedDate: '1 day ago',
      matchScore: 89,
      status: 'Interview'
    }
  ]);

  // Update application status
  const handleUpdateStatus = (appId, newStatus) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    showToast(`Application status updated to '${newStatus}'`, 'success');
  };

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  const filteredCandidates = useMemo(() => {
    return candidatesData.filter(c => {
      // If we are in Shortlisted tab, only show shortlisted
      if (activeTab === 'shortlisted' && !shortlistedIds.includes(c.id)) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRole = c.role.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        const matchesSkill = c.skills.some(s => s.toLowerCase().includes(q));
        const matchesCert = c.certId.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesLoc && !matchesSkill && !matchesCert) return false;
      }

      // Skills filter
      if (selectedSkillFilter !== 'All') {
        const hasSkill = c.skills.some(s => s.toLowerCase().includes(selectedSkillFilter.toLowerCase()));
        if (!hasSkill) return false;
      }

      // Course filter
      if (selectedCourseFilter !== 'All') {
        const hasCourse = c.coursesCompleted.some(cc => cc.title.toLowerCase().includes(selectedCourseFilter.toLowerCase())) ||
                          c.certificates.some(cert => cert.title.toLowerCase().includes(selectedCourseFilter.toLowerCase()));
        if (!hasCourse) return false;
      }

      // Location filter
      if (selectedLocationFilter !== 'All') {
        if (!c.location.toLowerCase().includes(selectedLocationFilter.toLowerCase())) return false;
      }

      // Experience filter
      if (selectedExpFilter !== 'All') {
        if (selectedExpFilter === 'Fresher' && !c.experience.toLowerCase().includes('fresher')) return false;
        if (selectedExpFilter === '1–2 Years' && !c.experience.includes('1–2') && !c.experience.includes('1–3')) return false;
        if (selectedExpFilter === '2–3 Years' && !c.experience.includes('2–3') && !c.experience.includes('1–3')) return false;
      }

      // Availability filter
      if (selectedAvailabilityFilter !== 'All') {
        if (c.availability !== selectedAvailabilityFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.matchScore - a.matchScore; // default relevance = highest match
    });
  }, [candidatesData, searchTerm, selectedSkillFilter, selectedCourseFilter, selectedLocationFilter, selectedExpFilter, selectedAvailabilityFilter, sortBy, activeTab, shortlistedIds]);

  // Selected candidate for deep profile inspection
  const activeCandidateProfile = useMemo(() => {
    const targetId = routeCandidateId || viewingCandidateProfileId;
    if (!targetId) return null;
    return candidatesData.find(c => c.id === targetId) || null;
  }, [routeCandidateId, viewingCandidateProfileId, candidatesData]);

  // Handle Create Job Submission
  const handleCreateJob = (e) => {
    e.preventDefault();
    const form = e.target;
    const newJob = {
      id: `job-${jobPostings.length + 1}`,
      title: form.title.value,
      org: form.org.value || 'Jharkhand State Cooperative Bank',
      location: form.location.value,
      type: form.type.value,
      experience: form.experience.value,
      salary: form.salary.value || '₹4.0 – 5.5 LPA',
      deadline: form.deadline.value || '15 Nov 2026',
      status: 'Active',
      requiredSkills: form.requiredSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: form.preferredSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      description: form.description.value,
      applicantsCount: 0,
      shortlistedCount: 0
    };
    setJobPostings([newJob, ...jobPostings]);
    setJobPostModalOpen(false);
    showToast(`✓ Vacancy for '${newJob.title}' published to national cooperative network!`, 'success');
  };

  // Handle Contact Send
  const handleSendContact = (e) => {
    e.preventDefault();
    showToast(`✓ Message & interview invitation dispatched to ${contactCandidateModal.name}! Notification sent to Trainee portal.`, 'success');
    setContactCandidateModal(null);
  };

  // Toggle multi-select checkbox
  const toggleCheckbox = (id) => {
    setSelectedCheckboxes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">

      {/* TOP BANNER matching recruiter portal.png with clean standalone photo */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#033322] via-[#054E33] to-[#0A6444] text-white shadow-sm border border-emerald-900/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[170px]">
          
          {/* Banner Left Copy */}
          <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-center space-y-2 z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Recruiter / Employment Portal
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Hire skilled, certified and job-ready talent from KaushalAI. Connect with trained individuals from cooperative training programmes across India.
            </p>
          </div>

          {/* Banner Right Image + Quote Card */}
          <div className="lg:col-span-4 relative min-h-[140px] lg:min-h-full overflow-hidden flex items-center justify-end">
            <img
              src="/assets/recruiter_hero_team.jpg"
              alt="Recruiter Collaboration Team"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 mix-blend-luminosity"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop';
              }}
            />
            {/* Subtle Gradient Overlays for soft integration */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#054E33] via-transparent to-black/20 pointer-events-none" />

            {/* Quote Pill Card from reference */}
            <div className="relative m-4 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white max-w-[280px] shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/80 flex items-center justify-center shrink-0 text-white">
                <Users size={20} />
              </div>
              <p className="text-xs italic font-medium leading-snug">
                “Skilled talent for a stronger cooperative tomorrow”
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* TOP 4 STAT CARDS matching recruiter portal.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Job-ready Candidates */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">12,460</div>
            <div className="text-xs font-semibold text-slate-600">Job-ready Candidates</div>
            <div className="text-[11px] font-bold text-emerald-700 mt-0.5">↑ 18% vs last month</div>
          </div>
        </div>

        {/* Stat 2: Certified Candidates */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">3,280</div>
            <div className="text-xs font-semibold text-slate-600">Certified Candidates</div>
            <div className="text-[11px] font-bold text-purple-700 mt-0.5">↑ 24% vs last month</div>
          </div>
        </div>

        {/* Stat 3: Active Job Seekers */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">480</div>
            <div className="text-xs font-semibold text-slate-600">Active Job Seekers</div>
            <div className="text-[11px] font-bold text-amber-700 mt-0.5">↑ 12% vs last month</div>
          </div>
        </div>

        {/* Stat 4: Partner Organizations */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">820</div>
            <div className="text-xs font-semibold text-slate-600">Partner Organizations</div>
            <div className="text-[11px] font-bold text-blue-700 mt-0.5">↑ 15% vs last month</div>
          </div>
        </div>

      </div>

      {/* PORTAL NAVIGATION SUB-BAR (Left sidebar collapsed or horizontal layout for high usability) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setActiveTab('candidates'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'candidates' && !viewingCandidateProfileId
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users size={14} />
              <span>Find Candidates</span>
            </button>

            <button
              onClick={() => { setActiveTab('postings'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'postings'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase size={14} />
              <span>Job Postings ({jobPostings.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('applications'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'applications'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={14} />
              <span>Applications ({applications.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('shortlisted'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'shortlisted'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star size={14} className={shortlistedIds.length > 0 ? 'text-amber-500 fill-amber-500' : ''} />
              <span>Shortlisted ({shortlistedIds.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('interviews'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'interviews'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock size={14} />
              <span>Interviews (3)</span>
            </button>

            <button
              onClick={() => { setActiveTab('messages'); setViewingCandidateProfileId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'messages'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={14} />
              <span>Messages</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setJobPostModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Post New Vacancy</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* VIEW: DETAILED CANDIDATE PROFILE (/jobs/candidates/:id) */}
      {/* ---------------------------------------------------- */}
      {activeCandidateProfile ? (
        <div className="space-y-6">
          
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setViewingCandidateProfileId(null);
                if (routeCandidateId) navigate('/jobs');
              }}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition shadow-2xs"
            >
              <span>← Back to Candidates List</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setContactCandidateModal(activeCandidateProfile)}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Send size={13} />
                <span>Contact Candidate</span>
              </button>

              <button
                onClick={() => toggleShortlist(activeCandidateProfile.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                  shortlistedIds.includes(activeCandidateProfile.id)
                    ? 'bg-amber-600 text-white'
                    : 'border border-gray-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Star size={13} fill={shortlistedIds.includes(activeCandidateProfile.id) ? 'currentColor' : 'none'} />
                <span>{shortlistedIds.includes(activeCandidateProfile.id) ? 'Shortlisted' : 'Shortlist'}</span>
              </button>
            </div>
          </div>

          {/* Profile Card Header */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
            
            {/* Top Identity Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <img
                  src={activeCandidateProfile.avatar}
                  alt={activeCandidateProfile.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-700/20 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-extrabold text-slate-900">{activeCandidateProfile.name}</h2>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-700" />
                      VERIFIED PROFILE
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{activeCandidateProfile.role}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {activeCandidateProfile.location}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {activeCandidateProfile.experience}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {activeCandidateProfile.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Mail size={12} /> {activeCandidateProfile.email}</span>
                  </div>
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[130px]">
                <div className="text-2xl font-black text-emerald-800">{activeCandidateProfile.matchScore}%</div>
                <div className="text-[11px] font-bold text-emerald-700">Role Match Score</div>
                <div className="text-[10px] text-slate-500 mt-0.5">PACS Manager Alignment</div>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">About Candidate</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-gray-100">
                {activeCandidateProfile.about}
              </p>
            </div>

            {/* Verified Skills Breakdown with Source */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>Verified Skills & Competency Matrix</span>
                </h3>
                <span className="text-[11px] font-medium text-slate-400">All credentials Ed25519 digitally verified</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCandidateProfile.verifiedSkills.map((sk, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-600/40 transition flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sk.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {sk.level}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Verification Source: </span>
                        <span>{sk.source}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-800">{sk.score}%</div>
                      <div className="text-[9px] text-slate-400">Exam Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Certificates Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award size={16} className="text-emerald-700" />
                <span>Verified National NCCT Certificates ({activeCandidateProfile.certificates.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCandidateProfile.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setCertVerificationModal(cert)}
                    className="p-4 rounded-xl border border-emerald-600/30 bg-emerald-50/30 hover:bg-emerald-50/60 transition cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {cert.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {cert.grade}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-2">{cert.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cert.issuer} • Issued {cert.issuedOn}</p>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                      <span>Click to View Ed25519 Verification</span>
                      <ExternalLink size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Performance & Completed Courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Completed Courses</h3>
                <div className="space-y-2">
                  {activeCandidateProfile.coursesCompleted.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{c.title}</div>
                        <div className="text-[10px] text-slate-400">{c.status}</div>
                      </div>
                      <span className="font-black text-emerald-800">{c.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Assessment Performance</h3>
                <div className="space-y-2">
                  {activeCandidateProfile.assessmentScores.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{a.subject}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Grade: {a.grade}</div>
                      </div>
                      <span className="font-black text-slate-900">{a.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Candidate Matching Explanation */}
            <div className="p-5 rounded-xl bg-slate-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Explainable AI Matching Breakdown (PACS Manager Role)</span>
                </div>
                <span className="text-xs font-black text-emerald-800">{activeCandidateProfile.matchScore}% Overall Match</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-slate-800">1. Skill Alignment (45% wt)</div>
                  <div className="text-slate-500 mt-0.5">{activeCandidateProfile.matchBreakdown.skills}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-slate-800">2. Ed25519 Certification (25% wt)</div>
                  <div className="text-slate-500 mt-0.5">{activeCandidateProfile.matchBreakdown.cert}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-slate-800">3. Geo Proximity (15% wt)</div>
                  <div className="text-slate-500 mt-0.5">{activeCandidateProfile.matchBreakdown.location}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-slate-800">4. Prior Experience (15% wt)</div>
                  <div className="text-slate-500 mt-0.5">{activeCandidateProfile.matchBreakdown.experience}</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : activeTab === 'postings' ? (
        
        /* ---------------------------------------------------- */
        /* VIEW: JOB POSTINGS MANAGEMENT */
        /* ---------------------------------------------------- */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Active Job Postings ({jobPostings.length})</h2>
              <p className="text-xs text-slate-500">Manage vacancies and view AI Candidate Match rankings for each role.</p>
            </div>
            <button
              onClick={() => setJobPostModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus size={14} />
              <span>Create Vacancy</span>
            </button>
          </div>

          <div className="space-y-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{job.org}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                      <span>•</span>
                      <span>{job.experience}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{job.salary}</span>
                      <span>•</span>
                      <span className="text-amber-700">Deadline: {job.deadline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setAiMatchModalJob(job)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Sparkles size={13} />
                      <span>AI Candidate Matches</span>
                    </button>
                    <button
                      onClick={() => showToast(`Editing job '${job.title}'`, 'info')}
                      className="px-3 py-2 rounded-xl border border-gray-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-gray-100">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Required:</span>
                    {job.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span>{job.applicantsCount} Applicants</span>
                    <span>•</span>
                    <span className="text-emerald-700">{job.shortlistedCount} Shortlisted</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : activeTab === 'applications' ? (

        /* ---------------------------------------------------- */
        /* VIEW: APPLICATION PIPELINE & STATUS MANAGEMENT */
        /* ---------------------------------------------------- */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Application Pipeline ({applications.length})</h2>
              <p className="text-xs text-slate-500">Track candidate status across Applied, Under Review, Shortlisted, Interview, and Selected.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Job Role</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4">Match Score</th>
                    <th className="p-4">Application Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.avatar}
                            alt={app.candidateName}
                            className="w-9 h-9 rounded-xl object-cover border border-emerald-700/20"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{app.candidateName}</div>
                            <div className="text-[10px] text-emerald-800 font-medium">Verified Credentials</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{app.jobTitle}</td>
                      <td className="p-4 text-slate-500">{app.appliedDate}</td>
                      <td className="p-4">
                        <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          {app.matchScore}%
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            app.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            app.status === 'Interview' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            app.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            app.status === 'Selected' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-700 border-gray-200'
                          }`}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            const cand = candidatesData.find(c => c.id === app.candidateId) || candidatesData[0];
                            setViewingCandidateProfileId(cand.id);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            const cand = candidatesData.find(c => c.id === app.candidateId) || candidatesData[0];
                            setContactCandidateModal(cand);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px]"
                        >
                          Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : activeTab === 'messages' ? (

        /* ---------------------------------------------------- */
        /* VIEW: MESSAGES & OUTREACH */
        /* ---------------------------------------------------- */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Direct Candidate Messages</h3>
              <p className="text-xs text-slate-500">Official recruitment communication directly linked to KaushalAI trainee inboxes.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-800">3 Conversations Active</span>
          </div>

          <div className="space-y-3">
            {[
              {
                candidate: 'Rohit Kumar',
                avatar: '/assets/rohit_kumar.jpg',
                subject: 'Interview Scheduled: PACS Manager at Ranchi Cooperative Bank',
                snippet: 'Thank you Anjali ma\'am. I have reviewed the job description and will be present at the Ranchi Main Branch on Thursday with my original NCCT certificates.',
                time: '10:45 AM',
                unread: true
              },
              {
                candidate: 'Priya Kumari',
                avatar: '/assets/priya_kumari.jpg',
                subject: 'Inquiry regarding PACS Operations role in Ramgarh',
                snippet: 'Good morning ma\'am. I am ready to join immediately and have completed the day-book practical training test with 89% score.',
                time: 'Yesterday',
                unread: false
              },
              {
                candidate: 'Neha Singh',
                avatar: '/assets/neha_singh.jpg',
                subject: 'Digital Tools certification verification',
                snippet: 'My Ed25519 digital certificate SS-2025-003891 has been confirmed by NCCT registry. Looking forward to hearing from you.',
                time: '2 days ago',
                unread: false
              }
            ].map((msg, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-200 hover:bg-slate-50 transition flex items-start gap-4">
                <img src={msg.avatar} alt={msg.candidate} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{msg.candidate}</span>
                      {msg.unread && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                    </h4>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{msg.subject}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{msg.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : (

        /* ---------------------------------------------------- */
        /* DEFAULT VIEW: FIND CANDIDATES (Exact match to reference recruiter portal.png) */
        /* ---------------------------------------------------- */
        <>
          {/* SEARCH & ADVANCED FILTERS BAR */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
            
            {/* Top Search Input Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, skills, location, course, or certification..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>
              <button
                onClick={() => showToast(`Search applied for '${searchTerm || 'all verified candidates'}'`, 'info')}
                className="px-6 py-2.5 rounded-xl bg-[#056B46] hover:bg-[#045537] text-white text-xs font-bold transition shadow-2xs shrink-0"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setSelectedSkillFilter('All');
                  setSelectedCourseFilter('All');
                  setSelectedLocationFilter('All');
                  setSelectedExpFilter('All');
                  setSelectedAvailabilityFilter('All');
                  setSearchTerm('');
                  showToast('Filters reset to default', 'info');
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <SlidersHorizontal size={14} className="text-slate-500" />
                <span>Advanced Filters</span>
              </button>
            </div>

            {/* 5 Filter Dropdowns matching reference */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Skills
                </label>
                <select
                  value={selectedSkillFilter}
                  onChange={(e) => setSelectedSkillFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Skills</option>
                  <option value="Cooperative Operations">Cooperative Operations</option>
                  <option value="Cooperative Accounting">Cooperative Accounting</option>
                  <option value="Digital Tools">Digital Tools (MIS)</option>
                  <option value="Rural Banking">Rural Banking</option>
                  <option value="Cooperative Governance">Cooperative Governance</option>
                  <option value="Credit Analysis">Credit Analysis</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Course / Certification
                </label>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Courses</option>
                  <option value="PACS Accounting">PACS Accounting & Bookkeeping</option>
                  <option value="Cooperative Governance">Cooperative Governance</option>
                  <option value="Digital Tools">Digital Tools for PACS</option>
                  <option value="Rural Credit">Rural Credit & Banking</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Location
                </label>
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All States</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Experience Level
                </label>
                <select
                  value={selectedExpFilter}
                  onChange={(e) => setSelectedExpFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Levels</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1–2 Years">1–2 Years</option>
                  <option value="2–3 Years">2–3 Years</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Availability
                </label>
                <select
                  value={selectedAvailabilityFilter}
                  onChange={(e) => setSelectedAvailabilityFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Availabilities</option>
                  <option value="Ready to Join">Ready to Join</option>
                  <option value="15 Days">15 Days</option>
                  <option value="1 Month">1 Month</option>
                </select>
              </div>

            </div>
          </div>

          {/* MAIN GRID: Recommended Candidates (Col 8) + Right Sidebar (Col 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Candidate Cards (Col 8) */}
            <div className="lg:col-span-8 space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recommended Candidates ({filteredCandidates.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified, certified and ready for employment.
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 border-none focus:outline-none cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="match">Match Score</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Candidates Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No verified candidate matches the selected filters. Try broadening your skill or location criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSkillFilter('All');
                      setSelectedLocationFilter('All');
                    }}
                    className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredCandidates.map((cand) => {
                    const isShortlisted = shortlistedIds.includes(cand.id);

                    return (
                      <div
                        key={cand.id}
                        className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-700/40 hover:shadow-xs transition"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={Boolean(selectedCheckboxes[cand.id])}
                            onChange={() => toggleCheckbox(cand.id)}
                            className="mt-1 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700 shrink-0 cursor-pointer"
                          />

                          {/* Avatar with online dot */}
                          <div className="relative shrink-0">
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-emerald-700/20"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                              }}
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                          </div>

                          {/* Candidate Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {cand.name}
                              </h4>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Job Ready
                              </span>
                              {cand.matchScore && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                  {cand.matchScore}% Match
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                              {cand.role}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin size={11} className="text-slate-400" />
                                {cand.location}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Briefcase size={11} className="text-slate-400" />
                                {cand.experience}
                              </span>
                            </div>

                            {/* Verified Certificate Badge */}
                            <div
                              onClick={() => setCertVerificationModal(cand.certificates ? cand.certificates[0] : { id: cand.certId, title: 'PACS Operations', issuer: 'NCCT' })}
                              className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-emerald-800 font-medium cursor-pointer hover:underline"
                            >
                              <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                              <span className="font-bold">Verified & Certified</span>
                              <span className="text-slate-500 font-mono text-[10px]">({cand.certId})</span>
                            </div>

                            {/* Skill Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              {cand.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium">
                                  {skill}
                                </span>
                              ))}
                              {cand.skills.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-medium">
                                  +{cand.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <button
                            onClick={() => {
                              setViewingCandidateProfileId(cand.id);
                              navigate(`/jobs/candidates/${cand.id}`);
                            }}
                            className="w-full sm:w-28 py-2 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition text-center shadow-2xs"
                          >
                            View Profile
                          </button>

                          <button
                            onClick={() => toggleShortlist(cand.id)}
                            className={`w-full sm:w-28 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                              isShortlisted 
                                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                : 'bg-[#056B46] hover:bg-[#045537] text-white'
                            }`}
                          >
                            <Star size={13} fill={isShortlisted ? 'currentColor' : 'none'} />
                            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                          </button>

                          <button
                            onClick={() => setContactCandidateModal(cand)}
                            className="w-full sm:w-28 py-1.5 rounded-xl border border-emerald-700/30 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold transition flex items-center justify-center gap-1"
                          >
                            <Send size={11} />
                            <span>Contact</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Hiring Overview, Skills in Demand, Recent Applications (Col 4) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Hiring Overview Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Hiring Overview
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Last 30 Days ▾</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <div className="flex items-center gap-2 text-emerald-800 mb-1">
                      <Users size={16} />
                      <span className="text-lg font-black text-slate-900">48</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Active Job Postings</div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <FileText size={16} />
                      <span className="text-lg font-black text-purple-900">1,256</span>
                    </div>
                    <div className="text-[11px] text-purple-700 font-medium">Applications Received</div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                      <Star size={16} />
                      <span className="text-lg font-black text-amber-900">
                        {320 + (shortlistedIds.length - 2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-700 font-medium">Candidates Shortlisted</div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <CheckCircle2 size={16} />
                      <span className="text-lg font-black text-blue-900">86</span>
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium">Successful Placements</div>
                  </div>
                </div>
              </div>

              {/* Top Skills in Demand Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Top Skills in Demand
                  </h3>
                  <button onClick={() => showToast('Displaying national skill analytics', 'info')} className="text-xs font-semibold text-emerald-800 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Cooperative Management', count: 420, percent: 92 },
                    { name: 'Digital Tools (MIS)', count: 368, percent: 80 },
                    { name: 'Financial Literacy', count: 310, percent: 68 },
                    { name: 'Credit Analysis', count: 280, percent: 61 },
                    { name: 'Community Outreach', count: 245, percent: 54 }
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{s.name}</span>
                        <span className="font-bold text-slate-900 font-mono">{s.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-700 h-full rounded-full" style={{ width: `${s.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Applications Feed */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Recent Applications
                  </h3>
                  <button onClick={() => setActiveTab('applications')} className="text-xs font-semibold text-emerald-800 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Ravi Kumar', role: 'PACS Operations', time: 'Applied 2 hours ago', status: 'New', color: 'bg-blue-50 text-blue-700' },
                    { name: 'Anjali Singh', role: 'Credit & Loan Management', time: 'Applied 5 hours ago', status: 'Under Review', color: 'bg-amber-50 text-amber-700' },
                    { name: 'Vikram Patel', role: 'Digital Tools for PACS', time: 'Applied 1 day ago', status: 'Shortlisted', color: 'bg-emerald-50 text-emerald-800' },
                    { name: 'Meera Nair', role: 'Cooperative Governance', time: 'Applied 1 day ago', status: 'Interview', color: 'bg-purple-50 text-purple-700' }
                  ].map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-100">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{app.name}</h4>
                          <p className="text-[10px] text-slate-400">{app.role} • {app.time}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.color}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ED25519 CERTIFICATE VERIFICATION POPUP */}
      {/* ---------------------------------------------------- */}
      {certVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-300" />
                <span className="text-sm font-bold">Official Credential Verification</span>
              </div>
              <button onClick={() => setCertVerificationModal(null)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="inline-flex items-center gap-1 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 size={16} />
                  <span>NATIONAL REPOSITORY VERIFIED</span>
                </div>
                <p className="text-[11px] text-emerald-700">Ed25519 cryptographic signature authentic & untampered</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-slate-500">Certificate ID:</span>
                  <span className="font-mono font-bold text-slate-800">{certVerificationModal.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-slate-500">Course / Qualification:</span>
                  <span className="font-bold text-slate-800">{certVerificationModal.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-slate-500">Accredited Issuer:</span>
                  <span className="font-semibold text-slate-800">National Council for Cooperative Training (NCCT)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-slate-500">Grade / Performance:</span>
                  <span className="font-bold text-emerald-800">{certVerificationModal.grade || 'Distinction'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="font-medium text-slate-800">{certVerificationModal.issuedOn || '15 Sep 2025'}</span>
                </div>
                <div className="flex flex-col py-1 border-b border-gray-100">
                  <span className="text-slate-500">Public Key Hash:</span>
                  <span className="font-mono text-[10px] text-slate-600 break-all">{certVerificationModal.signature || 'ed25519:7b3a9e4f2081d5a7c29348e89fbc0214'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Link
                  to={`/verify/${certVerificationModal.id}`}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Open Public Verifier</span>
                </Link>
                <button
                  onClick={() => setCertVerificationModal(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: AI CANDIDATE MATCHING FOR JOB POSTING */}
      {/* ---------------------------------------------------- */}
      {aiMatchModalJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-300" />
                <span className="text-sm font-bold">AI Candidate Matching • {aiMatchModalJob.title}</span>
              </div>
              <button onClick={() => setAiMatchModalJob(null)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Job Summary Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{aiMatchModalJob.title} ({aiMatchModalJob.org})</div>
                  <div className="text-slate-500 mt-0.5">Required Skills: {aiMatchModalJob.requiredSkills.join(', ')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-800">{candidatesData.length} Candidates Evaluated</div>
                  <div className="text-[10px] text-slate-400">Deterministic Skill Alignment</div>
                </div>
              </div>

              {/* Matched Candidate Ranking */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Top Ranked Candidates
                </h4>

                {candidatesData.slice(0, 3).map((cand, rank) => {
                  const matchedSkills = cand.skills.filter(s => aiMatchModalJob.requiredSkills.some(rs => rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase())));
                  const missingSkills = aiMatchModalJob.requiredSkills.filter(rs => !cand.skills.some(s => s.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(s.toLowerCase())));

                  return (
                    <div key={cand.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-600/40 transition space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs">
                            #{rank + 1}
                          </span>
                          <img src={cand.avatar} alt={cand.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{cand.name}</div>
                            <div className="text-[11px] text-slate-500">{cand.location} • {cand.experience}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {cand.matchScore}% Match
                          </span>
                        </div>
                      </div>

                      {/* Matched vs Gap */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <div className="font-bold text-emerald-900 flex items-center gap-1">
                            <Check size={12} />
                            <span>Matched Skills ({matchedSkills.length})</span>
                          </div>
                          <div className="text-emerald-800 mt-1">
                            {matchedSkills.join(', ') || 'Cooperative Operations, Accounting'}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                          <div className="font-bold text-amber-900 flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>Skill Gaps ({missingSkills.length})</span>
                          </div>
                          <div className="text-amber-800 mt-1">
                            {missingSkills.join(', ') || 'Leadership module in progress'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setAiMatchModalJob(null);
                            setViewingCandidateProfileId(cand.id);
                            navigate(`/jobs/candidates/${cand.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold"
                        >
                          View Full Dossier
                        </button>
                        <button
                          onClick={() => {
                            toggleShortlist(cand.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold"
                        >
                          {shortlistedIds.includes(cand.id) ? 'Shortlisted' : 'Shortlist Candidate'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONTACT CANDIDATE / INTERVIEW INVITATION */}
      {/* ---------------------------------------------------- */}
      {contactCandidateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={16} />
                <span className="text-sm font-bold">Contact Candidate • {contactCandidateModal.name}</span>
              </div>
              <button onClick={() => setContactCandidateModal(null)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendContact} className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-gray-200">
                <img src={contactCandidateModal.avatar} alt={contactCandidateModal.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <div className="font-bold text-slate-900">{contactCandidateModal.name}</div>
                  <div className="text-[11px] text-slate-500">{contactCandidateModal.role} • {contactCandidateModal.location}</div>
                  <div className="text-[10px] text-emerald-800 font-bold">Verified NCCT Certificate: {contactCandidateModal.certId}</div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={5}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 leading-relaxed font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setContactCandidateModal(null)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: POST NEW JOB VACANCY */}
      {/* ---------------------------------------------------- */}
      {jobPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Post Cooperative Job Vacancy</span>
              <button onClick={() => setJobPostModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Title</label>
                <input name="title" defaultValue="PACS Manager" required className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organization</label>
                  <input name="org" defaultValue="Jharkhand State Cooperative Bank" required className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location</label>
                  <input name="location" defaultValue="Ranchi, Jharkhand" required className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employment Type</label>
                  <select name="type" defaultValue="Full Time" className="w-full p-2 border rounded-lg bg-slate-50">
                    <option>Full Time</option>
                    <option>Contract</option>
                    <option>Apprenticeship</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience</label>
                  <input name="experience" defaultValue="1–3 Years" className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salary Range</label>
                  <input name="salary" defaultValue="₹4.5 – 6.0 LPA" className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Required Skills (Comma separated)</label>
                <input name="requiredSkills" defaultValue="Cooperative Operations, Accounting, Leadership, Digital Tools" required className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Skills</label>
                <input name="preferredSkills" defaultValue="Rural Banking, Internal Audit, By-laws" className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Description</label>
                <textarea name="description" rows={3} defaultValue="Lead operations, day book reconciliation, and agricultural credit disbursement for computerized Primary Agricultural Credit Society." className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Application Deadline</label>
                <input name="deadline" type="date" defaultValue="2026-10-15" className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setJobPostModalOpen(false)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg shadow-sm">Publish Vacancy</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
