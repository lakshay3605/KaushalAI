import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import StatCard from '../components/common/StatCard';
import ProgressRing from '../components/common/ProgressRing';
import { 
  Users, Building2, Award, Briefcase, TrendingUp, BarChart3, 
  MapPin, CheckCircle2, Clock, FileText, Bell, Plus, Download, 
  Send, X, Check, ShieldCheck, AlertTriangle, Filter, Search, 
  ExternalLink, Calendar, BookOpen, Layers, CheckSquare, Sparkles, 
  PieChart, RefreshCw, Eye, ChevronRight, UserCheck, ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab/Section: overview | training | trainees | institutes | courses | assessments | certificates | employment | analytics
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    if (tab === 'overview') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

  // State
  const [timeframe, setTimeframe] = useState('1Y');
  const [selectedTraineeModal, setSelectedTraineeModal] = useState(null);
  const [addProgrammeModalOpen, setAddProgrammeModalOpen] = useState(false);
  const [addCentreModalOpen, setAddCentreModalOpen] = useState(false);
  const [issueCertModalOpen, setIssueCertModalOpen] = useState(false);
  const [exportReportModalOpen, setExportReportModalOpen] = useState(false);

  // Filters for Trainee Directory
  const [traineeSearch, setTraineeSearch] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('All');
  const [filterProgramme, setFilterProgramme] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Filters for Attendance
  const [attendanceCentreFilter, setAttendanceCentreFilter] = useState('All');

  // ----------------------------------------------------
  // DATA MODELS
  // ----------------------------------------------------
  const topCentres = [
    { rank: 1, name: 'Ranchi Cooperative Centre', state: 'Jharkhand', learners: '5,420', rate: 92, status: 'Active' },
    { rank: 2, name: 'Patna Training Centre', state: 'Bihar', learners: '4,980', rate: 88, status: 'Active' },
    { rank: 3, name: 'Lucknow Skill Centre', state: 'Uttar Pradesh', learners: '4,120', rate: 84, status: 'Active' },
    { rank: 4, name: 'Bhopal Rural Centre', state: 'Madhya Pradesh', learners: '3,980', rate: 80, status: 'Active' },
    { rank: 5, name: 'Jaipur Cooperative Hub', state: 'Rajasthan', learners: '3,760', rate: 78, status: 'Active' }
  ];

  const institutesList = [
    { id: 'inst-1', name: 'Ranchi Cooperative Training Centre', location: 'Ranchi, Jharkhand', activeTrainees: 5420, activeProgrammes: 6, attendanceRate: 92, status: 'Active', code: 'NCCT-JH-01' },
    { id: 'inst-2', name: 'Jamshedpur Cooperative Institute', location: 'Jamshedpur, Jharkhand', activeTrainees: 2840, activeProgrammes: 4, attendanceRate: 74, status: 'Needs Attention', code: 'NCCT-JH-02' },
    { id: 'inst-3', name: 'Dhanbad Training Centre', location: 'Dhanbad, Jharkhand', activeTrainees: 1950, activeProgrammes: 3, attendanceRate: 88, status: 'Active', code: 'NCCT-JH-03' },
    { id: 'inst-4', name: 'Patna Cooperative Training Institute', location: 'Patna, Bihar', activeTrainees: 4980, activeProgrammes: 5, attendanceRate: 88, status: 'Active', code: 'NCCT-BR-01' },
    { id: 'inst-5', name: 'Lucknow Institute of Cooperative Management', location: 'Lucknow, Uttar Pradesh', activeTrainees: 4120, activeProgrammes: 5, attendanceRate: 84, status: 'Active', code: 'NCCT-UP-01' }
  ];

  const programmesList = [
    { id: 'prog-1', name: 'PACS Management Programme', enrolled: 1240, completed: 1016, completionRate: 82, certRate: 91, status: 'Active', batches: 8 },
    { id: 'prog-2', name: 'PACS Accounting & Bookkeeping', enrolled: 2150, completed: 1892, completionRate: 88, certRate: 94, status: 'Active', batches: 14 },
    { id: 'prog-3', name: 'Digital Tools & MIS for PACS', enrolled: 1820, completed: 1547, completionRate: 85, certRate: 89, status: 'Active', batches: 12 },
    { id: 'prog-4', name: 'Rural Credit Appraisal & Recovery', enrolled: 960, completed: 748, completionRate: 78, certRate: 86, status: 'Active', batches: 6 },
    { id: 'prog-5', name: 'Cooperative Governance & By-laws', enrolled: 1400, completed: 1260, completionRate: 90, certRate: 95, status: 'Active', batches: 9 }
  ];

  const traineesList = [
    {
      id: 'rohit-kumar',
      name: 'Rohit Kumar',
      location: 'Ranchi, Jharkhand',
      institute: 'Ranchi Cooperative Training Centre',
      programme: 'PACS Management Programme',
      status: 'Active',
      certsCount: 4,
      skillsCount: 7,
      careerReadiness: 78,
      attendance: 92,
      avatar: '/assets/rohit_kumar.jpg',
      email: 'rohit.kumar@example.com',
      enrolledOn: '12 Aug 2025'
    },
    {
      id: 'priya-kumari',
      name: 'Priya Kumari',
      location: 'Ranchi, Jharkhand',
      institute: 'Ranchi Cooperative Training Centre',
      programme: 'Cooperative Governance & By-laws',
      status: 'Active',
      certsCount: 3,
      skillsCount: 6,
      careerReadiness: 85,
      attendance: 96,
      avatar: '/assets/priya_kumari.jpg',
      email: 'priya.kumari@example.com',
      enrolledOn: '04 Aug 2025'
    },
    {
      id: 'amit-verma',
      name: 'Amit Verma',
      location: 'Patna, Bihar',
      institute: 'Patna Cooperative Training Institute',
      programme: 'Rural Credit Appraisal & Recovery',
      status: 'Active',
      certsCount: 2,
      skillsCount: 5,
      careerReadiness: 72,
      attendance: 84,
      avatar: '/assets/amit_verma.jpg',
      email: 'amit.verma@example.com',
      enrolledOn: '18 Jul 2025'
    },
    {
      id: 'neha-singh',
      name: 'Neha Singh',
      location: 'Lucknow, Uttar Pradesh',
      institute: 'Lucknow Institute of Cooperative Management',
      programme: 'Digital Tools & MIS for PACS',
      status: 'Active',
      certsCount: 3,
      skillsCount: 6,
      careerReadiness: 82,
      attendance: 90,
      avatar: '/assets/neha_singh.jpg',
      email: 'neha.singh@example.com',
      enrolledOn: '24 Jun 2025'
    },
    {
      id: 'saurav-patel',
      name: 'Saurav Patel',
      location: 'Bhopal, Madhya Pradesh',
      institute: 'Bhopal Rural Centre',
      programme: 'PACS Management Programme',
      status: 'Completed',
      certsCount: 3,
      skillsCount: 7,
      careerReadiness: 80,
      attendance: 88,
      avatar: '/assets/saurav_patel.jpg',
      email: 'saurav.patel@example.com',
      enrolledOn: '12 May 2025'
    }
  ];

  // Filtered trainees
  const filteredTrainees = useMemo(() => {
    return traineesList.filter(t => {
      if (traineeSearch.trim()) {
        const q = traineeSearch.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.location.toLowerCase().includes(q) && !t.programme.toLowerCase().includes(q)) return false;
      }
      if (filterInstitute !== 'All' && !t.institute.includes(filterInstitute)) return false;
      if (filterProgramme !== 'All' && !t.programme.includes(filterProgramme)) return false;
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      return true;
    });
  }, [traineesList, traineeSearch, filterInstitute, filterProgramme, filterStatus]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner matching admin.png */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#033322] via-[#054E33] to-[#0A6444] text-white shadow-sm border border-emerald-900/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[170px]">
          
          {/* Banner Left Copy */}
          <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-center space-y-2 z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              NCCT Administration
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Monitor training, certification, skill development and employment outcomes across the cooperative ecosystem.
            </p>
          </div>

          {/* Banner Right Image + Quote Card */}
          <div className="lg:col-span-4 relative min-h-[140px] lg:min-h-full overflow-hidden flex items-center justify-end">
            <img
              src="/assets/ncct_building_banner.jpg"
              alt="National Council for Cooperative Training (NCCT)"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 mix-blend-luminosity"
              onError={(e) => {
                e.target.src = '/assets/exact_building_photo.jpg';
              }}
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#054E33] via-transparent to-black/20 pointer-events-none" />

            {/* Quote Pill Card from reference */}
            <div className="relative m-4 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white max-w-[280px] shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/80 flex items-center justify-center shrink-0 text-white">
                <BarChart3 size={20} />
              </div>
              <p className="text-xs italic font-medium leading-snug">
                “Empowering cooperatives through skills, knowledge and opportunities”
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* TOP 4 STAT CARDS matching admin.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          number="50,000+"
          label="Registered Trainees"
          trend="↑ 12% vs last month"
          colorScheme="blue"
        />
        <StatCard
          icon={Building2}
          number="500+"
          label="Training Institutes"
          trend="↑ 8% vs last month"
          colorScheme="emerald"
        />
        <StatCard
          icon={Award}
          number="86,420"
          label="Certificates Issued (95% Success)"
          trend="↑ 18% vs last month"
          colorScheme="purple"
        />
        <StatCard
          icon={Briefcase}
          number="12,460"
          label="Job-ready Candidates"
          trend="↑ 22% vs last month"
          colorScheme="amber"
        />
      </div>

      {/* SECONDARY METRICS SUB-BAR */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center divide-x divide-gray-100">
          <div>
            <div className="text-base font-extrabold text-slate-900">3,280</div>
            <div className="text-[11px] font-semibold text-slate-500">Certified Candidates</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900">820</div>
            <div className="text-[11px] font-semibold text-slate-500">Partner Organizations</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900">1,240</div>
            <div className="text-[11px] font-semibold text-slate-500">Open Vacancies</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-emerald-800">3,820</div>
            <div className="text-[11px] font-semibold text-slate-500">Total Applications</div>
          </div>
        </div>
      </div>

      {/* ADMIN SUB-NAVIGATION BAR */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-2.5">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'training', label: 'Training (128 Batches)', icon: Layers },
              { id: 'trainees', label: 'Trainees', icon: Users },
              { id: 'institutes', label: 'Institutes (500+)', icon: Building2 },
              { id: 'courses', label: 'Programmes', icon: BookOpen },
              { id: 'assessments', label: 'Assessments', icon: CheckSquare },
              { id: 'attendance', label: 'Attendance (Kiosk)', icon: Clock },
              { id: 'employment', label: 'Employment', icon: Briefcase },
              { id: 'analytics', label: 'Skill Analytics', icon: PieChart }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExportReportModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1"
            >
              <Download size={13} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB CONTENT SWITCHING */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'training' ? (

        /* VIEW: TRAINING OVERVIEW */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-2xl font-black text-slate-900">128</div>
              <div className="text-xs font-bold text-slate-600">Active Batches Across India</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">98% on-schedule delivery</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-2xl font-black text-emerald-800">4,820</div>
              <div className="text-xs font-bold text-slate-600">Currently Training</div>
              <div className="text-[11px] text-slate-400 mt-1">Classroom & practical ERP labs</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-2xl font-black text-purple-700">2,340</div>
              <div className="text-xs font-bold text-slate-600">Completed This Quarter</div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1">95.4% certified successfully</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Active State Training Activity</h3>
              <span className="text-xs font-bold text-emerald-800">National Council for Cooperative Training</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">State / Union Territory</th>
                    <th className="p-3">Active Centres</th>
                    <th className="p-3">Ongoing Batches</th>
                    <th className="p-3">Trainees Enrolled</th>
                    <th className="p-3">Avg Attendance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { state: 'Jharkhand', centres: 18, batches: 24, trainees: 10210, att: 92, status: 'On Track' },
                    { state: 'Bihar', centres: 24, batches: 32, trainees: 14200, att: 88, status: 'On Track' },
                    { state: 'Uttar Pradesh', centres: 42, batches: 56, trainees: 22400, att: 84, status: 'On Track' },
                    { state: 'Madhya Pradesh', centres: 22, batches: 28, trainees: 11800, att: 80, status: 'On Track' },
                    { state: 'Rajasthan', centres: 16, batches: 20, trainees: 8600, att: 78, status: 'Review Needed' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{row.state}</td>
                      <td className="p-3 text-slate-700">{row.centres}</td>
                      <td className="p-3 text-slate-700">{row.batches}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{row.trainees.toLocaleString()}</td>
                      <td className="p-3 font-bold text-emerald-800">{row.att}%</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.status === 'On Track' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : activeTab === 'trainees' ? (

        /* VIEW: TRAINEE MANAGEMENT */
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">National Trainee Registry</h2>
              <p className="text-xs text-slate-500">Centralized visibility across trainees, attendance, assessments, and verified credentials.</p>
            </div>
            <button
              onClick={() => showToast('Connecting to National Registry Export...', 'info')}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export Trainees List</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={traineeSearch}
                  onChange={(e) => setTraineeSearch(e.target.value)}
                  placeholder="Search trainee, location, programme..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <select
                  value={filterInstitute}
                  onChange={(e) => setFilterInstitute(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="All">All Institutes</option>
                  <option value="Ranchi">Ranchi Cooperative Training Centre</option>
                  <option value="Patna">Patna Training Centre</option>
                  <option value="Lucknow">Lucknow Skill Centre</option>
                  <option value="Bhopal">Bhopal Rural Centre</option>
                </select>
              </div>

              <div>
                <select
                  value={filterProgramme}
                  onChange={(e) => setFilterProgramme(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="All">All Programmes</option>
                  <option value="PACS Management">PACS Management</option>
                  <option value="Governance">Governance</option>
                  <option value="Digital Tools">Digital Tools</option>
                  <option value="Rural Credit">Rural Credit</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trainees Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-4">Trainee</th>
                    <th className="p-4">Training Centre</th>
                    <th className="p-4">Enrolled Programme</th>
                    <th className="p-4">Attendance</th>
                    <th className="p-4">Certificates</th>
                    <th className="p-4">Verified Skills</th>
                    <th className="p-4">Career Readiness</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrainees.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-xl object-cover border border-emerald-700/20" />
                          <div>
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-[10px] text-slate-400">{t.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">{t.institute}</td>
                      <td className="p-4 font-semibold text-slate-800">{t.programme}</td>
                      <td className="p-4 font-bold text-emerald-800">{t.attendance}%</td>
                      <td className="p-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {t.certsCount} Verified
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {t.skillsCount} Skills
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-emerald-800">{t.careerReadiness}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedTraineeModal(t)}
                          className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-slate-100 font-bold text-[11px] text-slate-700"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : activeTab === 'institutes' ? (

        /* VIEW: INSTITUTES MANAGEMENT */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Training Institutes & Centres ({institutesList.length})</h2>
              <p className="text-xs text-slate-500">Accredited institutes under National Council for Cooperative Training (NCCT).</p>
            </div>
            <button
              onClick={() => setAddCentreModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Register Training Centre</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutesList.map(inst => (
              <div key={inst.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {inst.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inst.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      {inst.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{inst.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {inst.location}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center text-xs">
                  <div>
                    <div className="font-black text-slate-900">{inst.activeTrainees}</div>
                    <div className="text-[10px] text-slate-400">Trainees</div>
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{inst.activeProgrammes}</div>
                    <div className="text-[10px] text-slate-400">Courses</div>
                  </div>
                  <div>
                    <div className="font-black text-emerald-800">{inst.attendanceRate}%</div>
                    <div className="text-[10px] text-slate-400">Attendance</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button onClick={() => showToast(`Viewing trainees for ${inst.name}`, 'info')} className="font-bold text-slate-700 hover:text-emerald-800">
                    View Trainees →
                  </button>
                  <button onClick={() => showToast(`Viewing audit report for ${inst.name}`, 'info')} className="px-2.5 py-1 rounded-lg border border-gray-200 text-slate-700 hover:bg-slate-50 font-bold">
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : activeTab === 'courses' ? (

        /* VIEW: PROGRAMME MANAGEMENT */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">National Training Programmes ({programmesList.length})</h2>
              <p className="text-xs text-slate-500">Certified syllabus for Primary Agricultural Credit Societies (PACS) and cooperatives.</p>
            </div>
            <button
              onClick={() => setAddProgrammeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Training Programme</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">Programme Title</th>
                  <th className="p-4">Active Batches</th>
                  <th className="p-4">Enrolled Trainees</th>
                  <th className="p-4">Completed</th>
                  <th className="p-4">Completion Rate</th>
                  <th className="p-4">Certification Rate</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {programmesList.map(prog => (
                  <tr key={prog.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{prog.name}</td>
                    <td className="p-4 text-slate-700">{prog.batches} Batches</td>
                    <td className="p-4 font-mono font-bold text-slate-900">{prog.enrolled.toLocaleString()}</td>
                    <td className="p-4 text-slate-700">{prog.completed.toLocaleString()}</td>
                    <td className="p-4 font-bold text-emerald-800">{prog.completionRate}%</td>
                    <td className="p-4 font-bold text-purple-700">{prog.certRate}%</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => showToast(`Opening batch management for ${prog.name}`, 'info')} className="px-2.5 py-1 rounded-lg border border-gray-200 text-slate-700 font-bold hover:bg-slate-100">
                        Manage Batches
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : activeTab === 'attendance' ? (

        /* VIEW: ATTENDANCE MONITORING (Kiosk Connected) */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Kiosk Biometric Attendance Monitoring</h2>
              <p className="text-xs text-slate-500">Live synchronization from Smart Doorway Attendance Kiosks across 500+ centres.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Kiosk Network Live (99.8% Online)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-black text-slate-900">85%</div>
              <div className="text-xs font-semibold text-slate-500">Overall Attendance</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-black text-emerald-800">92%</div>
              <div className="text-xs font-semibold text-slate-500">Today's Attendance</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-black text-amber-700">5%</div>
              <div className="text-xs font-semibold text-slate-500">Absent Today</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-black text-blue-700">3%</div>
              <div className="text-xs font-semibold text-slate-500">On Sanctioned Leave</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Attendance Events from Kiosks</h3>
            <div className="space-y-2 text-xs">
              {[
                { trainee: 'Rohit Kumar', centre: 'Ranchi Cooperative Training Centre', method: 'Face INT8 (<78ms)', time: '09:02 AM', status: 'Present' },
                { trainee: 'Priya Kumari', centre: 'Ranchi Cooperative Training Centre', method: 'NFC Card Tap', time: '09:05 AM', status: 'Present' },
                { trainee: 'Amit Verma', centre: 'Patna Training Centre', method: '2D Dynamic QR', time: '09:12 AM', status: 'Present' },
                { trainee: 'Neha Singh', centre: 'Lucknow Skill Centre', method: 'Face INT8 (<80ms)', time: '09:15 AM', status: 'Present' }
              ].map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{ev.trainee}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">{ev.centre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-slate-500">{ev.method}</span>
                    <span className="font-bold text-slate-700">{ev.time}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : (

        /* ---------------------------------------------------- */
        /* DEFAULT VIEW: OVERVIEW (Matching admin.png exactly) */
        /* ---------------------------------------------------- */
        <>
          {/* Row 1: Learner Growth Trend + Course Completion Rate + Employment Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Learner Growth Trend (Col 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Learner Growth Trend
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                  {['7D', '30D', '3M', '1Y'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-2 py-0.5 rounded transition ${
                        timeframe === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Line Chart */}
              <div className="h-44 w-full relative pt-2">
                <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#047857" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line x1="30" y1="20" x2="390" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="30" y1="60" x2="390" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="30" y1="100" x2="390" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="30" y1="130" x2="390" y2="130" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Area */}
                  <path
                    d="M 35 125 Q 80 110, 120 95 T 200 85 T 280 65 T 350 45 T 385 30 L 385 130 L 35 130 Z"
                    fill="url(#growthGrad)"
                  />

                  {/* Line */}
                  <path
                    d="M 35 125 Q 80 110, 120 95 T 200 85 T 280 65 T 350 45 T 385 30"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Data points */}
                  <circle cx="35" cy="125" r="3" fill="#047857" />
                  <circle cx="120" cy="95" r="3" fill="#047857" />
                  <circle cx="200" cy="85" r="3" fill="#047857" />
                  <circle cx="280" cy="65" r="3" fill="#047857" />
                  <circle cx="385" cy="30" r="3.5" fill="#047857" />
                </svg>

                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-2 mt-1">
                  <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Oct</span>
                </div>
              </div>
            </div>

            {/* Course Completion Rate (Col 3) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Course Completion Rate
              </h3>

              <div className="my-auto flex flex-col items-center">
                <ProgressRing
                  percentage={68}
                  size={110}
                  strokeWidth={11}
                  color="#047857"
                  trackColor="#E2E8F0"
                  label="Overall"
                />
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Completed
                  </span>
                  <span className="font-bold text-slate-900">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    In Progress
                  </span>
                  <span className="font-bold text-slate-900">22%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Not Started
                  </span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
              </div>
            </div>

            {/* Employment Outcomes (Col 4) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Employment Outcomes
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Apr – Sep</span>
              </div>

              {/* Grouped Bar Chart */}
              <div className="h-40 flex items-end justify-between gap-3 px-2 pt-2 border-b border-gray-200">
                {[
                  { m: 'Apr', pl: 40, int: 55 },
                  { m: 'May', pl: 55, int: 70 },
                  { m: 'Jun', pl: 65, int: 80 },
                  { m: 'Jul', pl: 75, int: 90 },
                  { m: 'Aug', pl: 85, int: 95 },
                  { m: 'Sep', pl: 95, int: 110 }
                ].map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center h-28">
                      <div
                        className="w-2.5 bg-emerald-600 rounded-t-sm"
                        style={{ height: `${(d.pl / 110) * 100}%` }}
                        title={`Placements: ${d.pl * 15}`}
                      ></div>
                      <div
                        className="w-2.5 bg-blue-500 rounded-t-sm"
                        style={{ height: `${(d.int / 110) * 100}%` }}
                        title={`Interview Calls: ${d.int * 25}`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{d.m}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span> Placements
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Interview Calls
                </span>
              </div>
            </div>

          </div>

          {/* Row 2: Top 5 Centres + Learners by State + Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Centre Performance Table (Col 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Centre Performance (Top 5)
                </h3>
                <span onClick={() => setActiveTab('institutes')} className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                  View All →
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Centre Name</th>
                      <th className="py-2 px-2">State</th>
                      <th className="py-2 px-2">Learners</th>
                      <th className="py-2 px-2">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topCentres.map((c) => (
                      <tr key={c.rank} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-2 font-mono text-slate-400">{c.rank}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-900">{c.name}</td>
                        <td className="py-2.5 px-2 text-slate-500">{c.state}</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-800">{c.learners}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${c.rate}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-700 text-[11px]">{c.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Learners by State (Col 3) with standalone clean India map */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Learners by State
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer">
                  View Map →
                </span>
              </div>

              {/* India Map graphic from reference */}
              <div className="flex items-center justify-center py-2">
                <img
                  src="/assets/india_map.png"
                  alt="India Map - Cooperative Learners Distribution"
                  className="h-44 w-auto object-contain"
                />
              </div>

              {/* Map Legend */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#034C31]"></span>
                  <span>&gt; 20K</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#056B46]"></span>
                  <span>10K – 20K</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]"></span>
                  <span>5K – 10K</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#6EE7B7]"></span>
                  <span>1K – 5K</span>
                </div>
              </div>
            </div>

            {/* Recent Activities (Col 4) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Activities
                </h3>
                <span className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                  View All →
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { title: '1,250 new learners registered', time: '2 hours ago', icon: Users, color: 'bg-blue-50 text-blue-700' },
                  { title: 'PACS Operations course updated', time: '4 hours ago', icon: FileText, color: 'bg-emerald-50 text-emerald-700' },
                  { title: '320 certificates issued', time: '6 hours ago', icon: Award, color: 'bg-purple-50 text-purple-700' },
                  { title: 'New centre onboarded – Dhanbad', time: '8 hours ago', icon: Building2, color: 'bg-amber-50 text-amber-700' },
                  { title: 'Placement drive completed – Ranchi', time: '10 hours ago', icon: Briefcase, color: 'bg-emerald-50 text-emerald-800' }
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${act.color} flex items-center justify-center shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                        <p className="text-[10px] text-slate-400">{act.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Row 3: Assessment Analytics + Certification Breakdown + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Assessment Analytics (Col 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Assessment Analytics
                </h3>
                <span onClick={() => setActiveTab('assessments')} className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                  View All →
                </span>
              </div>

              {/* Grouped Bar Chart */}
              <div className="h-44 flex items-end justify-between gap-2 px-2 pt-2 border-b border-gray-200">
                {[
                  { name: 'PACS Ops', att: 18, pass: 16 },
                  { name: 'Credit Mgmt', att: 15, pass: 13 },
                  { name: 'Coop Gov', att: 12, pass: 11 },
                  { name: 'Digital Tools', att: 10, pass: 9 },
                  { name: 'Rural Finance', att: 9, pass: 8 }
                ].map((s, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center h-28">
                      <div className="w-2.5 bg-emerald-600 rounded-t-sm" style={{ height: `${(s.att / 20) * 100}%` }}></div>
                      <div className="w-2.5 bg-blue-500 rounded-t-sm" style={{ height: `${(s.pass / 20) * 100}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium truncate max-w-[45px] text-center">{s.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span> Attempted
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Passed
                </span>
              </div>
            </div>

            {/* Certification Breakdown (Col 3) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Certification Breakdown
              </h3>

              <div className="my-auto flex flex-col items-center">
                <ProgressRing
                  percentage={95}
                  size={110}
                  strokeWidth={11}
                  color="#10B981"
                  trackColor="#E2E8F0"
                  label="86,420"
                />
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> PACS Operations
                  </span>
                  <span className="font-bold text-slate-900">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> Credit & Loan
                  </span>
                  <span className="font-bold text-slate-900">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span> Governance
                  </span>
                  <span className="font-bold text-slate-900">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Digital Tools
                  </span>
                  <span className="font-bold text-slate-900">16%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Col 4) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-3 flex-1">
                <button
                  onClick={() => setActiveTab('trainees')}
                  className="p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 flex flex-col items-start justify-between text-left transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Users size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">View Trainees</div>
                    <div className="text-[10px] text-slate-500">Registry search</div>
                  </div>
                </button>

                <button
                  onClick={() => setAddCentreModalOpen(true)}
                  className="p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 flex flex-col items-start justify-between text-left transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Add Centre</div>
                    <div className="text-[10px] text-slate-500">Onboard institute</div>
                  </div>
                </button>

                <button
                  onClick={() => setExportReportModalOpen(true)}
                  className="p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex flex-col items-start justify-between text-left transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileText size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Generate Report</div>
                    <div className="text-[10px] text-slate-500">Download analytics</div>
                  </div>
                </button>

                <button
                  onClick={() => setAddProgrammeModalOpen(true)}
                  className="p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 flex flex-col items-start justify-between text-left transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Plus size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Add Programme</div>
                    <div className="text-[10px] text-slate-500">New qualification</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Row 4: KaushalAI Insights + Alerts & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* KaushalAI Insights Panel (Col 6) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    KaushalAI Insights
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Administrative Intelligence
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1">
                  <div className="font-bold text-slate-800">Certification Velocity</div>
                  <p className="text-[11px] text-slate-600">12% increase in certification completion this month across computerized PACS batches.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1">
                  <div className="font-bold text-slate-800">Top Skill Gap Identified</div>
                  <p className="text-[11px] text-slate-600">Digital skills & MIS reporting remain the most critical skill gaps in state cooperatives.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1">
                  <div className="font-bold text-slate-800">Top Performing Centre</div>
                  <p className="text-[11px] text-slate-600">Ranchi Training Centre achieved the highest trainee completion rate (92%) this quarter.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1">
                  <div className="font-bold text-slate-800">Job Placement Pool</div>
                  <p className="text-[11px] text-slate-600">320 trainees are currently eligible and matched for recommended PACS Manager roles.</p>
                </div>
              </div>
            </div>

            {/* Alerts & Actions (Col 6) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Administrative Alerts & Actions
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">4 Action Items</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { text: '12 certificates awaiting verification signature', action: 'Verify Batch', color: 'text-purple-700' },
                  { text: '3 training centres require attendance inspection', action: 'Inspect Centre', color: 'text-amber-700' },
                  { text: '42 trainees below attendance threshold (75%)', action: 'Send Warning', color: 'text-rose-700' },
                  { text: '18 programmes approaching completion deadline', action: 'Review Schedule', color: 'text-blue-700' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-slate-700 font-medium truncate">{item.text}</span>
                    <button
                      onClick={() => showToast(`Action executed: '${item.action}'`, 'success')}
                      className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] shrink-0"
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TRAINEE DOSSIER INSPECTION */}
      {/* ---------------------------------------------------- */}
      {selectedTraineeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Central Trainee Registry • {selectedTraineeModal.name}</span>
              <button onClick={() => setSelectedTraineeModal(null)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <img src={selectedTraineeModal.avatar} alt={selectedTraineeModal.name} className="w-14 h-14 rounded-2xl object-cover" />
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedTraineeModal.name}</h4>
                  <p className="text-slate-500">{selectedTraineeModal.location} • Enrolled {selectedTraineeModal.enrolledOn}</p>
                  <p className="text-emerald-800 font-semibold mt-0.5">{selectedTraineeModal.institute}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-gray-200 text-center">
                <div>
                  <div className="font-black text-slate-900">{selectedTraineeModal.certsCount}</div>
                  <div className="text-[10px] text-slate-400">Certificates</div>
                </div>
                <div>
                  <div className="font-black text-slate-900">{selectedTraineeModal.skillsCount}</div>
                  <div className="text-[10px] text-slate-400">Verified Skills</div>
                </div>
                <div>
                  <div className="font-black text-emerald-800">{selectedTraineeModal.careerReadiness}%</div>
                  <div className="text-[10px] text-slate-400">Career Readiness</div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Programme:</span>
                  <span className="font-bold text-slate-800">{selectedTraineeModal.programme}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Attendance Rate:</span>
                  <span className="font-bold text-emerald-800">{selectedTraineeModal.attendance}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Primary Certificate:</span>
                  <span className="font-mono font-bold text-purple-700">SS2025PAC500873</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTraineeModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    showToast(`Official verification dossier dispatched for ${selectedTraineeModal.name}`, 'success');
                    setSelectedTraineeModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold"
                >
                  Download Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD TRAINING PROGRAMME */}
      {/* ---------------------------------------------------- */}
      {addProgrammeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Add Accredited Training Programme</span>
              <button onClick={() => setAddProgrammeModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              showToast('✓ Training Programme successfully registered with NCCT!', 'success');
              setAddProgrammeModalOpen(false);
            }} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Programme Title</label>
                <input required placeholder="e.g. PACS Leadership & Cooperative Governance" className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Hours)</label>
                  <input required placeholder="e.g. 240 Hours" className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Sector</label>
                  <select className="w-full p-2 border rounded-lg bg-slate-50">
                    <option>PACS</option>
                    <option>Dairy Cooperatives</option>
                    <option>Fisheries Cooperatives</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setAddProgrammeModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg">Register Programme</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REGISTER TRAINING CENTRE */}
      {/* ---------------------------------------------------- */}
      {addCentreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Register Training Institute / Centre</span>
              <button onClick={() => setAddCentreModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              showToast('✓ Training Centre successfully accredited and onboarded!', 'success');
              setAddCentreModalOpen(false);
            }} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Centre / Institute Name</label>
                <input required placeholder="e.g. Bokaro Cooperative Training Institute" className="w-full p-2 border rounded-lg bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input required placeholder="e.g. Jharkhand" className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Centre Code</label>
                  <input required placeholder="e.g. NCCT-JH-04" className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setAddCentreModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg">Onboard Centre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EXPORT DATA REPORT */}
      {/* ---------------------------------------------------- */}
      {exportReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Export Official NCCT Analytics</span>
              <button onClick={() => setExportReportModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">Select the report format for the comprehensive national cooperative skilling and employment dataset:</p>
              <div className="space-y-2">
                <button onClick={() => { showToast('NCCT Annual Report PDF downloaded', 'success'); setExportReportModalOpen(false); }} className="w-full p-2.5 rounded-xl border border-gray-200 text-left hover:bg-slate-50 font-bold flex items-center justify-between">
                  <span>Executive PDF Summary Report</span>
                  <Download size={14} />
                </button>
                <button onClick={() => { showToast('Complete National CSV Dataset exported', 'success'); setExportReportModalOpen(false); }} className="w-full p-2.5 rounded-xl border border-gray-200 text-left hover:bg-slate-50 font-bold flex items-center justify-between">
                  <span>Complete Trainee & Kiosk CSV Dataset</span>
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
