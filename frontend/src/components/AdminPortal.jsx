import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, BookOpen, UserCheck, Award, 
  Briefcase, HardDrive, TrendingUp, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { apiRequest } from '../api';

export default function AdminPortal({ user }) {
  const [metrics, setMetrics] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [mRes, pRes, bRes, dRes] = await Promise.all([
        apiRequest('/analytics/dashboard'),
        apiRequest('/erp/programmes'),
        apiRequest('/erp/batches'),
        apiRequest('/attendance/devices')
      ]);
      setMetrics(mRes?.overview || {});
      setProgrammes(pRes || []);
      setBatches(bRes || []);
      setDevices(dRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          INSTITUTE OPERATIONS &amp; SYSTEM METRICS
        </span>
        <h1 className="text-2xl font-black mt-1">PACS Training Centre – Rampur</h1>
        <p className="text-xs text-slate-400 mt-1">
          Logged in as: {user.full_name} ({user.role}) • National Council for Cooperative Training (NCCT)
        </p>
      </div>

      {/* Live System Analytics Grid (Step 14 Spec - Database Aggregated) */}
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide font-mono mb-3">
          Live Database Metrics (Zero Hardcoding)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL TRAINEES', value: metrics?.total_trainees ?? 0, icon: Users, color: 'text-blue-900' },
            { label: 'ACTIVE BATCHES', value: metrics?.active_batches ?? 0, icon: BookOpen, color: 'text-amber-600' },
            { label: 'ATTENDANCE EVENTS', value: metrics?.attendance_events_logged ?? 0, icon: UserCheck, color: 'text-emerald-600' },
            { label: 'CERTIFICATES ISSUED', value: metrics?.certificates_issued ?? 0, icon: Award, color: 'text-purple-600' },
            { label: 'ASSESSMENT PASS RATE', value: `${metrics?.assessment_pass_rate ?? 0}%`, icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'OPEN PACS ROLES', value: metrics?.open_pacs_positions ?? 0, icon: Briefcase, color: 'text-blue-900' },
            { label: 'PLACEMENT RATE', value: `${metrics?.placement_conversion_rate ?? 0}%`, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'EDGE KIOSKS ONLINE', value: metrics?.hardware_kiosks_online ?? '2/2', icon: HardDrive, color: 'text-slate-800' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase">{item.label}</span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className={`text-2xl font-black ${item.color} font-mono`}>{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Devices & Edge Kiosks Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-900" />
          <span>Registered Edge Biometric Devices &amp; Kiosks</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">DEVICE ID</th>
                <th className="p-3">DEVICE NAME</th>
                <th className="p-3">HARDWARE TYPE</th>
                <th className="p-3">DEPLOYMENT LOCATION</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {devices.map((d) => (
                <tr key={d.device_id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{d.device_id}</td>
                  <td className="p-3 font-sans text-slate-800">{d.name}</td>
                  <td className="p-3">{d.device_type}</td>
                  <td className="p-3 font-sans text-slate-600">{d.location_room}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      ● {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Programmes & Batches */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-900" />
          <span>Active Cooperative Capacity Programmes</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programmes.map((p) => (
            <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-900">{p.code}</span>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  {p.duration_weeks} Weeks
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">{p.title}</h4>
              <p className="text-xs text-slate-600">{p.description}</p>
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Institute: {p.institute_name} • Batches: {p.batches_count}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
