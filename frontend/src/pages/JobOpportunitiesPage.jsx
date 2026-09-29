import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageBanner from '../components/common/PageBanner';
import StatCard from '../components/common/StatCard';
import { 
  Briefcase, Building2, MapPin, Users, Search, Bookmark, 
  ArrowRight, CheckCircle2, Clock, Calendar, Check, Star, ShieldCheck
} from 'lucide-react';

export default function JobOpportunitiesPage() {
  const { appliedJobIds, toggleApplyJob, bookmarkedJobIds, toggleBookmarkJob, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const jobsList = [
    {
      id: 'job-1',
      title: 'PACS Accountant',
      org: 'Jharkhand Rajya Sahakari Bank',
      loc: 'Ranchi, Jharkhand',
      type: 'Full Time',
      salary: '₹3 – 4 LPA',
      posted: 'Posted 3 days ago',
      featured: true,
      category: 'Accounting',
      logo: '🌾'
    },
    {
      id: 'job-2',
      title: 'Cooperative Field Officer',
      org: 'District Cooperative Office, Dumka',
      loc: 'Dumka, Jharkhand',
      type: 'Full Time',
      salary: '₹4 – 6 LPA',
      posted: 'Posted 5 days ago',
      category: 'Operations',
      logo: '🏛️'
    },
    {
      id: 'job-3',
      title: 'Rural Banking Executive',
      org: 'NABARD (Partner Organization)',
      loc: 'Hazaribagh, Jharkhand',
      type: 'Full Time',
      salary: '₹3 – 5 LPA',
      posted: 'Posted 1 week ago',
      category: 'Banking',
      logo: '🏦'
    },
    {
      id: 'job-4',
      title: 'Data Entry Operator',
      org: 'Primary Agricultural Credit Society (PACS)',
      loc: 'Godda, Jharkhand',
      type: 'Full Time',
      salary: '₹2 – 3 LPA',
      posted: 'Posted 1 week ago',
      category: 'Data & IT',
      logo: '🌲'
    },
    {
      id: 'job-5',
      title: 'Cooperative Society Manager',
      org: 'Multi-State Cooperative Society',
      loc: 'Delhi, NCR',
      type: 'Full Time',
      salary: '₹6 – 8 LPA',
      posted: 'Posted 2 weeks ago',
      category: 'Management',
      logo: '🥛'
    }
  ];

  const filteredJobs = jobsList.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.org.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.loc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || j.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || j.loc.includes(selectedLocation);
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner matching Job oppurtunity.png */}
      <PageBanner
        title="Job Opportunities"
        subtitle="Connect with cooperatives, banks and partner organizations for a better future."
        rightCardTitle="From Learning to Livelihood"
        rightCardText="Explore verified job opportunities from cooperatives and partner organizations across India."
        rightCardIcon={Briefcase}
      />

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          number="120+"
          label="Job Opportunities"
          colorScheme="emerald"
        />
        <StatCard
          icon={Building2}
          number="85+"
          label="Hiring Cooperatives"
          colorScheme="purple"
        />
        <StatCard
          icon={MapPin}
          number="20+"
          label="States"
          colorScheme="amber"
        />
        <StatCard
          icon={Users}
          number="5000+"
          label="Trained Candidates Placed"
          colorScheme="blue"
        />
      </div>

      {/* Search & Filter Bar matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, cooperative, location or keyword..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <button
            onClick={() => showToast(`Filtering search for '${searchTerm}'`, 'info')}
            className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-2xs"
          >
            Search
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Job Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Accounting">Accounting</option>
              <option value="Operations">Operations</option>
              <option value="Banking">Banking</option>
              <option value="Management">Management</option>
              <option value="Data & IT">Data & IT</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium"
            >
              <option value="All">All India</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Bihar">Bihar</option>
              <option value="Delhi">Delhi, NCR</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Experience Level
            </label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium">
              <option>Any</option>
              <option>Fresher / Entry</option>
              <option>1-3 Years</option>
              <option>3+ Years</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Salary Range
            </label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium">
              <option>Any</option>
              <option>₹2 – 4 LPA</option>
              <option>₹4 – 6 LPA</option>
              <option>₹6+ LPA</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Job Type
            </label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-slate-700 font-medium">
              <option>Any</option>
              <option>Full Time</option>
              <option>Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Job Listings + Right Trackers & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Job Cards List (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Latest Job Opportunities ({filteredJobs.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Sort by: Latest</span>
          </div>

          <div className="space-y-3.5">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobIds.includes(job.id);
              const isBookmarked = bookmarkedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-700/40 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-center text-2xl shrink-0">
                      {job.logo}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {job.featured && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Featured
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900">
                          {job.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {job.org}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {job.loc}
                        </span>
                        <span>•</span>
                        <span>{job.type}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-800">{job.salary}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className="text-[11px] text-slate-400">
                      {job.posted}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleApplyJob(job.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                          isApplied 
                            ? 'bg-slate-100 text-slate-600 cursor-default' 
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                      >
                        <span>{isApplied ? 'Applied ✓' : 'Apply Now'}</span>
                        {!isApplied && <ArrowRight size={13} />}
                      </button>

                      <button
                        onClick={() => toggleBookmarkJob(job.id)}
                        className={`p-2 rounded-xl border transition ${
                          isBookmarked 
                            ? 'border-amber-400 bg-amber-50 text-amber-600' 
                            : 'border-gray-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Save Job"
                      >
                        <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Application Tracker & Improve Chances (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Application Tracker Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Application Tracker
              </h3>
              <button 
                onClick={() => showToast('Opening complete application tracker', 'info')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 text-center">
                <div className="text-xl font-black text-slate-900">5</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Applied</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                <div className="text-xl font-black text-blue-700">2</div>
                <div className="text-[11px] text-blue-600 font-medium mt-0.5">Under Review</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                <div className="text-xl font-black text-amber-700">1</div>
                <div className="text-[11px] text-amber-600 font-medium mt-0.5">Interview Scheduled</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                <div className="text-xl font-black text-emerald-700">1</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Selected</div>
              </div>
            </div>
          </div>

          {/* Improve Your Chances Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Improve Your Chances
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                <span>Complete all your courses and certifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                <span>Build a strong skill profile</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                <span>Keep your profile updated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                <span>Take recommended assessments</span>
              </div>
            </div>

            <div className="h-32 rounded-xl overflow-hidden bg-slate-100">
              <img src="/assets/rohit_kumar.jpg" alt="Profile readiness" className="w-full h-full object-cover object-top" />
            </div>
          </div>

          {/* Recommended for You */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Recommended for You
              </h3>
              <span className="text-[11px] text-emerald-800 font-bold">View All →</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Credit Officer</h4>
                  <p className="text-[10px] text-slate-500">State Cooperative Bank • ₹4-6 LPA</p>
                </div>
                <button
                  onClick={() => showToast('Application submitted for Credit Officer', 'success')}
                  className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Apply
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Project Assistant</h4>
                  <p className="text-[10px] text-slate-500">NCDC • ₹3-5 LPA</p>
                </div>
                <button
                  onClick={() => showToast('Application submitted for Project Assistant', 'success')}
                  className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
