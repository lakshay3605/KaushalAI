import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, UserCheck, ShieldCheck, MapPin, 
  Search, CheckCircle2, Award, Clock, ArrowRight, ExternalLink 
} from 'lucide-react';
import { apiRequest } from '../api';

export default function RecruiterPortal({ user, onSelectCertificateForVerify }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidatesData, setCandidatesData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: 'PACS Data Entry & Accounting Assistant',
    pacs_name: user?.pacs_name || 'Rampur Primary Agricultural Credit Society',
    location: user?.location || 'Rampur, Uttar Pradesh',
    salary_range: '₹20,000 - ₹28,000 / month',
    description: 'Assist the Chief Accountant with daily Day-Book reconciliation, farmer KCC documentation, and fertilizer store vouchers.',
    required_skills: 'PACS Accounting, Day-Book Closing, NABARD Compliance',
    min_experience_years: 0.5
  });

  const loadRecruiterData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiRequest('/jobs'),
        apiRequest('/jobs/recruiter/applications')
      ]);
      setJobs(jobsRes || []);
      setApplications(appsRes || []);

      if (jobsRes && jobsRes.length > 0) {
        loadCandidatesForJob(jobsRes[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecruiterData();
  }, [user]);

  const loadCandidatesForJob = async (jobId) => {
    try {
      setSelectedJobId(jobId);
      const res = await apiRequest(`/jobs/${jobId}/candidates`);
      setCandidatesData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newJob.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      await apiRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...newJob,
          required_skills: skillsArray
        })
      });
      alert("New PACS position posted successfully!");
      setIsCreatingJob(false);
      loadRecruiterData();
    } catch (err) {
      alert("Error posting job: " + err.message);
    }
  };

  const updateAppStatus = async (appId, status) => {
    try {
      await apiRequest(`/jobs/applications/${appId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      loadRecruiterData();
      if (selectedJobId) loadCandidatesForJob(selectedJobId);
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Recruiter Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            COOPERATIVE EMPLOYMENT EXCHANGE • RECRUITER PORTAL
          </span>
          <h1 className="text-2xl font-black mt-1">{user.pacs_name}</h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-300" />
            <span>Recruiter: {user.full_name} • {user.location}</span>
          </p>
        </div>

        <button
          onClick={() => setIsCreatingJob(!isCreatingJob)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New PACS Job</span>
        </button>
      </div>

      {/* New Job Posting Form Modal */}
      {isCreatingJob && (
        <form onSubmit={handleCreateJob} className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Post New Cooperative Vacancy</h3>
            <button
              type="button"
              onClick={() => setIsCreatingJob(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Job Designation</label>
              <input
                type="text"
                value={newJob.title}
                onChange={e => setNewJob({...newJob, title: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Salary Range</label>
              <input
                type="text"
                value={newJob.salary_range}
                onChange={e => setNewJob({...newJob, salary_range: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cooperative / PACS Name</label>
              <input
                type="text"
                value={newJob.pacs_name}
                onChange={e => setNewJob({...newJob, pacs_name: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Operational Location</label>
              <input
                type="text"
                value={newJob.location}
                onChange={e => setNewJob({...newJob, location: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Mandatory Competencies (comma separated)</label>
              <input
                type="text"
                value={newJob.required_skills}
                onChange={e => setNewJob({...newJob, required_skills: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Job Responsibility Description</label>
              <textarea
                value={newJob.description}
                onChange={e => setNewJob({...newJob, description: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium h-20"
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Publish Job to 20 NCCT Training Institutes
          </button>
        </form>
      )}

      {/* Recruiter Workflow: Jobs & Candidate Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Job Selector */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Your Active Cooperative Postings</h3>
          <div className="space-y-3">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => loadCandidatesForJob(job.id)}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedJobId === job.id 
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-mono font-bold text-amber-700">{job.pacs_name}</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{job.title}</div>
                <div className="text-xs text-slate-500 mt-1">{job.salary_range} • {job.location}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Explainable Candidate Match List (Step 3 & 12 Spec) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-blue-900 uppercase">
                  DETERMINISTIC RANKER • EXPLAINABLE MATCH
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Ranked Candidates for: {candidatesData?.job?.title || 'Selected Job'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                {candidatesData?.candidates?.length || 0} Candidates Analyzed
              </span>
            </div>

            <div className="space-y-6">
              {candidatesData?.candidates?.map((cand) => (
                <div 
                  key={cand.trainee_id} 
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                        {cand.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base">{cand.full_name}</h4>
                          {cand.has_certificate && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>W3C CERTIFIED</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{cand.location} • {cand.phone}</p>
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="text-right sm:text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase block">OVERALL MATCH</span>
                      <span className="text-2xl font-black text-emerald-700">
                        {cand.match.overall_match}%
                      </span>
                    </div>
                  </div>

                  {/* Explainable 4-Factor Breakdown (Step 12 Spec) */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">SKILL MATCH</span>
                      <span className="font-extrabold text-blue-950 text-sm">{cand.match.skill_match}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">CERTIFICATION</span>
                      <span className="font-extrabold text-blue-950 text-sm">{cand.match.certification_match}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">LOCATION</span>
                      <span className="font-extrabold text-blue-950 text-sm">{cand.match.location_match}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">EXPERIENCE</span>
                      <span className="font-extrabold text-blue-950 text-sm">{cand.match.experience_match}%</span>
                    </div>
                  </div>

                  {/* Rationale Explanation */}
                  <p className="text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                    💡 <strong>Match Explanation:</strong> {cand.match.explanation}
                  </p>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-slate-400 mr-1">ACQUIRED:</span>
                    {cand.skills?.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        ✓ {s}
                      </span>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {cand.certificate_id && (
                        <button
                          onClick={() => onSelectCertificateForVerify(cand.certificate_id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                          <span>Verify Ed25519 Certificate ({cand.certificate_id})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">
                        Status: <strong className="text-slate-800">{cand.application_status}</strong>
                      </span>
                      {cand.application_id && cand.application_status !== 'SHORTLISTED' && (
                        <button
                          onClick={() => updateAppStatus(cand.application_id, 'SHORTLISTED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Shortlist Candidate
                        </button>
                      )}
                      {cand.application_id && cand.application_status === 'SHORTLISTED' && (
                        <button
                          onClick={() => updateAppStatus(cand.application_id, 'OFFERED')}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Issue PACS Appointment Letter
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
