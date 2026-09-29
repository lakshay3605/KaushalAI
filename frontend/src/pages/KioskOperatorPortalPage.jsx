import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Users, BookOpen, CheckCircle2, Award, UserPlus, BookMarked, 
  FileEdit, Cloud, RefreshCw, ChevronRight, Clock, MapPin, 
  Building, Check, X, ShieldCheck, Wifi, WifiOff, FileText, Camera,
  QrCode, Search, Smartphone, Battery, HardDrive, AlertTriangle,
  Calendar, Eye, Send, ArrowRight, UserCheck, CheckSquare, Zap,
  SlidersHorizontal, Sparkles
} from 'lucide-react';
import { addToOfflineQueue, getOfflineQueue } from '../api';

export default function KioskOperatorPortalPage() {
  const { 
    isOffline, setIsOffline, pendingSyncCount, refreshSyncCount, 
    handleSyncOffline, showToast, currentUser 
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'attendance';
  const setActiveTab = (tab) => {
    if (tab === 'attendance') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

  // Modals & Check-in Overlays
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedTraineeModal, setSelectedTraineeModal] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [enrolModalOpen, setEnrolModalOpen] = useState(false);
  const [issueCertModalOpen, setIssueCertModalOpen] = useState(false);
  const [lastMarkedSuccess, setLastMarkedSuccess] = useState(null);

  // Search input inside Search Trainee mode
  const [traineeQuery, setTraineeQuery] = useState('');

  // History Filter
  const [historyFilter, setHistoryFilter] = useState('Today');

  // Device status mock
  const [batteryLevel] = useState(82);
  const [lastSyncTime, setLastSyncTime] = useState('09:38 AM');

  // Local pending queue state for demonstrability
  const [localPendingCount, setLocalPendingCount] = useState(0);

  // Auto-scan effect for Camera Modal
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (cameraModalOpen) {
      setIsScanningFace(true);

      // Start webcam
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          showToast("Camera access denied or unavailable", "error");
        });

      const timer = setTimeout(() => {
        setIsScanningFace(false);
        const rohit = {
          traineeId: 'SS202500873',
          name: 'Rohit Kumar',
          programme: 'PACS Management Programme',
          phone: '+91 98765 43210',
          avatar: '/assets/rohit_kumar.jpg'
        };
        markAttendanceForTrainee(rohit, 'Camera INT8');
        setCameraModalOpen(false);
      }, 3500); // Made it 3.5s so they have time to see themselves on camera
      return () => clearTimeout(timer);
    } else {
      // Stop webcam when modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [cameraModalOpen]);

  // ----------------------------------------------------
  // DATA MODEL: Today's Attendance Records
  // ----------------------------------------------------
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 'att-2',
      traineeId: 'SS202500912',
      name: 'Priya Kumari',
      programme: 'Cooperative Governance',
      time: '09:38 AM',
      method: 'Camera INT8',
      status: 'Present',
      avatar: '/assets/priya_kumari.jpg',
      attendanceRate: 96,
      modulesCompleted: 10,
      totalModules: 12,
      assessmentsCompleted: 4,
      totalAssessments: 4,
      certificatesCount: 3
    },
    {
      id: 'att-3',
      traineeId: 'SS202501024',
      name: 'Amit Verma',
      programme: 'Credit & Loan Management',
      time: '09:25 AM',
      method: 'QR Code',
      status: 'Present',
      avatar: '/assets/amit_verma.jpg',
      attendanceRate: 84,
      modulesCompleted: 6,
      totalModules: 10,
      assessmentsCompleted: 2,
      totalAssessments: 3,
      certificatesCount: 2
    },
    {
      id: 'att-4',
      traineeId: 'SS202501189',
      name: 'Neha Singh',
      programme: 'Digital Tools for PACS',
      time: '09:15 AM',
      method: 'Camera INT8',
      status: 'Present',
      avatar: '/assets/neha_singh.jpg',
      attendanceRate: 90,
      modulesCompleted: 9,
      totalModules: 10,
      assessmentsCompleted: 3,
      totalAssessments: 3,
      certificatesCount: 3
    },
    {
      id: 'att-5',
      traineeId: 'SS202501250',
      name: 'Saurav Patel',
      programme: 'PACS Management Programme',
      time: '09:50 AM',
      method: 'Manual Check',
      status: 'Late',
      avatar: '/assets/saurav_patel.jpg',
      attendanceRate: 88,
      modulesCompleted: 12,
      totalModules: 12,
      assessmentsCompleted: 4,
      totalAssessments: 4,
      certificatesCount: 3
    },
    {
      id: 'att-6',
      traineeId: 'SS202501330',
      name: 'Ramesh Kumar',
      programme: 'PACS Operations',
      time: '10:02 AM',
      method: 'QR Code',
      status: 'Present',
      avatar: '/assets/rohit_kumar.jpg',
      attendanceRate: 82,
      modulesCompleted: 7,
      totalModules: 12,
      assessmentsCompleted: 2,
      totalAssessments: 4,
      certificatesCount: 1
    }
  ]);

  // Master Trainee Directory for Search & Scanning
  const masterTrainees = [
    {
      traineeId: 'SS202500873',
      name: 'Rohit Kumar',
      programme: 'PACS Management Programme',
      phone: '+91 98351 44820',
      avatar: '/assets/rohit_kumar.jpg',
      attendanceRate: 85,
      learningRate: 68,
      assessments: '3/4',
      certificates: 4
    },
    {
      traineeId: 'SS202500912',
      name: 'Priya Kumari',
      programme: 'Cooperative Governance & By-laws',
      phone: '+91 94311 88392',
      avatar: '/assets/priya_kumari.jpg',
      attendanceRate: 96,
      learningRate: 88,
      assessments: '4/4',
      certificates: 3
    },
    {
      traineeId: 'SS202501024',
      name: 'Amit Verma',
      programme: 'Credit & Loan Management',
      phone: '+91 98350 12948',
      avatar: '/assets/amit_verma.jpg',
      attendanceRate: 84,
      learningRate: 60,
      assessments: '2/3',
      certificates: 2
    },
    {
      traineeId: 'SS202501189',
      name: 'Neha Singh',
      programme: 'Digital Tools for PACS',
      phone: '+91 97210 55431',
      avatar: '/assets/neha_singh.jpg',
      attendanceRate: 90,
      learningRate: 92,
      assessments: '3/3',
      certificates: 3
    },
    {
      traineeId: 'SS202501250',
      name: 'Saurav Patel',
      programme: 'PACS Management Programme',
      phone: '+91 98260 44923',
      avatar: '/assets/saurav_patel.jpg',
      attendanceRate: 88,
      learningRate: 100,
      assessments: '4/4',
      certificates: 3
    }
  ];

  // Helper to get formatted current time
  const getCurrentFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to mark attendance with duplicate prevention
  const markAttendanceForTrainee = (trainee, method) => {
    const todayDate = new Date().toDateString();
    
    // Check if already marked today
    const alreadyMarked = attendanceRecords.find(a => a.traineeId === trainee.traineeId);
    if (alreadyMarked) {
      showToast(`Notice: Attendance already recorded today for ${trainee.name} at ${alreadyMarked.time} (${alreadyMarked.method}). Duplicate check-in prevented.`, 'info');
      return false;
    }

    const checkInTime = getCurrentFormattedTime();
    const newRecord = {
      id: `att-${Date.now()}`,
      traineeId: trainee.traineeId,
      name: trainee.name,
      programme: trainee.programme,
      time: checkInTime,
      method: method,
      status: 'Present',
      avatar: trainee.avatar,
      attendanceRate: trainee.attendanceRate || 85,
      modulesCompleted: 8,
      totalModules: 12,
      assessmentsCompleted: 3,
      totalAssessments: 4,
      certificatesCount: trainee.certificates || 2,
      date: todayDate,
      syncStatus: isOffline ? 'pending_sync' : 'synced'
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);

    // Handle offline buffering
    if (isOffline) {
      addToOfflineQueue({
        event_id: `ATT-${Date.now()}`,
        type: 'ATTENDANCE_CHECKIN',
        traineeId: trainee.traineeId,
        name: trainee.name,
        timestamp: new Date().toISOString(),
        method: method
      });
      setLocalPendingCount(prev => prev + 1);
      refreshSyncCount();
      showToast(`✓ Attendance marked for ${trainee.name}! (Buffered in Edge Storage - Offline)`, 'info');
    } else {
      showToast(`✓ Attendance marked for ${trainee.name} (${method}) • Reflected centrally on NCCT Admin!`, 'success');
    }

    setLastMarkedSuccess(newRecord);
    return true;
  };

  // Manual trigger sync
  const triggerManualSync = () => {
    if (isOffline) {
      showToast('Device is currently offline. Synchronization will occur automatically once network connectivity is restored.', 'info');
      return;
    }

    handleSyncOffline();
    setLocalPendingCount(0);
    setLastSyncTime(getCurrentFormattedTime());
    showToast('✓ All local attendance records successfully synchronized with KaushalAI Central System!', 'success');
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!traineeQuery.trim()) return masterTrainees;
    const q = traineeQuery.toLowerCase();
    return masterTrainees.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.traineeId.toLowerCase().includes(q) || 
      t.programme.toLowerCase().includes(q) ||
      t.phone.includes(q)
    );
  }, [traineeQuery, masterTrainees]);

  // Statistics calculation
  const totalTrainees = 124;
  const presentCount = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length + 102; // Realistic demo scale
  const absentCount = 12;
  const leaveCount = 4;
  const attendanceRate = Math.round((presentCount / totalTrainees) * 100);

  return (
    <div className="space-y-6">

      {/* TOP BANNER matching kiosk.png with clean standalone photo */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#033322] via-[#054E33] to-[#0A6444] text-white shadow-sm border border-emerald-900/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[170px]">
          
          {/* Banner Left Copy */}
          <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-center space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100">
                Hardware-Agnostic Edge Kiosk
              </span>
              <span className="text-[10px] text-emerald-200">
                Ranchi Cooperative Centre (NCCT-JH-RNC-04)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Kiosk / Centre Operator Portal
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Register learners, manage training, conduct assessments, record attendance and issue certificates at your cooperative training centre.
            </p>
          </div>

          {/* Banner Right Image + Quote Card */}
          <div className="lg:col-span-4 relative min-h-[140px] lg:min-h-full overflow-hidden flex items-center justify-end">
            <img
              src="/assets/kiosk_operator_hero.jpg"
              alt="Centre Operator at Work"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 mix-blend-luminosity"
              onError={(e) => {
                e.target.src = '/assets/exact_building_photo.jpg';
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#054E33] via-transparent to-black/20 pointer-events-none" />

            {/* Quote Pill Card from reference */}
            <div className="relative m-4 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white max-w-[280px] shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/80 flex items-center justify-center shrink-0 text-white">
                <Users size={20} />
              </div>
              <p className="text-xs italic font-medium leading-snug">
                “Bringing skilling opportunities to every cooperative, every village”
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* TOP STATUS BAR: CENTRE IDENTITY + OFFLINE/ONLINE NETWORK SWITCH */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left: Centre info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">Ranchi Cooperative Training Centre</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-gray-200">
                NCCT-JH-RNC-04
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Operator: <span className="font-semibold text-slate-700">Amit Kumar (Centre Operator)</span> • Ranchi, Jharkhand
            </p>
          </div>
        </div>

        {/* Right: Network Status + Demo Offline Switch */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isOffline 
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}></span>
            <span>{isOffline ? '● Offline Mode' : '● Online'}</span>
          </div>

          {/* Interactive Network Toggle Button for SIH evaluation */}
          <button
            onClick={() => {
              const nextState = !isOffline;
              setIsOffline(nextState);
              if (nextState) {
                showToast('Edge offline resilience activated. Attendance will be buffered in local storage.', 'info');
              } else {
                showToast('Network connection restored. Syncing offline records to central server...', 'success');
                triggerManualSync();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
              isOffline
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {isOffline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOffline ? 'Restore Online Connection' : 'Simulate Offline Mode'}</span>
          </button>
        </div>

      </div>

      {/* OFFLINE RESILIENCE ALERT BANNER (Visible when offline) */}
      {isOffline && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300/80 flex items-start gap-3 shadow-xs animate-in slide-in-from-top duration-200">
          <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900">Offline-First Edge Architecture Active</h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Attendance records will be securely stored on this device ({localPendingCount + pendingSyncCount} records pending sync) and synchronized automatically when the connection returns. Zero data loss guaranteed.
            </p>
          </div>
          <button
            onClick={triggerManualSync}
            className="px-3 py-1.5 rounded-xl bg-amber-700 text-white text-[11px] font-bold shrink-0 hover:bg-amber-800"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* TOP 4 STAT CARDS matching kiosk.png and user requirements */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Trainees */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{totalTrainees}</div>
            <div className="text-xs font-semibold text-slate-600">Total Trainees</div>
            <div className="text-[11px] font-bold text-blue-700 mt-0.5">Ranchi Centre Active</div>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{presentCount}</div>
            <div className="text-xs font-semibold text-slate-600">Present Today</div>
            <div className="text-[11px] font-bold text-emerald-700 mt-0.5">Attendance Rate: {attendanceRate}%</div>
          </div>
        </div>

        {/* Card 3: Absent */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{absentCount}</div>
            <div className="text-xs font-semibold text-slate-600">Absent Today</div>
            <div className="text-[11px] font-bold text-amber-700 mt-0.5">Follow-up notifications sent</div>
          </div>
        </div>

        {/* Card 4: On Leave */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-3.5 hover:shadow-xs transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{leaveCount}</div>
            <div className="text-xs font-semibold text-slate-600">On Leave</div>
            <div className="text-[11px] font-bold text-purple-700 mt-0.5">Sanctioned Leaves</div>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: PRIMARY CHECK-IN AREA (MAIN FOCUS) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-b from-white to-slate-50/70 rounded-3xl border-2 border-emerald-700/30 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Primary Check-In Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            MARK ATTENDANCE
          </h2>
          <p className="text-xs text-slate-500">
            Select the fastest verification method for the trainee. All records write to the local edge queue and synchronize with the NCCT Admin Dashboard.
          </p>
        </div>

        {/* 3 Main Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          
          {/* Action 1: Scan QR */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="group p-6 rounded-2xl bg-white border-2 border-emerald-600/30 hover:border-emerald-700 hover:shadow-md transition text-center flex flex-col items-center justify-between gap-4 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-800 group-hover:text-white transition flex items-center justify-center shadow-xs">
              <QrCode size={34} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition">
                Scan QR Code
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Scan trainee ID card or phone QR in &lt;1 second
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold w-full shadow-2xs">
              Open Scanner →
            </span>
          </button>

          {/* Action 2: Camera Check-In */}
          <button
            onClick={() => setCameraModalOpen(true)}
            className="group p-6 rounded-2xl bg-white border-2 border-blue-600/30 hover:border-blue-700 hover:shadow-md transition text-center flex flex-col items-center justify-between gap-4 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white transition flex items-center justify-center shadow-xs">
              <Camera size={34} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-800 transition">
                Camera Check-In
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Position face inside frame for instant biometric match
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-bold w-full shadow-2xs">
              Start Camera →
            </span>
          </button>

          {/* Action 3: Search Trainee */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="group p-6 rounded-2xl bg-white border-2 border-purple-600/30 hover:border-purple-700 hover:shadow-md transition text-center flex flex-col items-center justify-between gap-4 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white transition flex items-center justify-center shadow-xs">
              <Search size={34} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-800 transition">
                Search Trainee
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Lookup by name, Trainee ID (SS2025...), or phone
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold w-full shadow-2xs">
              Search & Mark →
            </span>
          </button>

        </div>

        {/* Last Marked Notification Strip (if triggered) */}
        {lastMarkedSuccess && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check size={20} />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950">✓ Attendance Marked Successfully</span>
                <p className="text-emerald-800 mt-0.5">
                  <span className="font-bold">{lastMarkedSuccess.name}</span> ({lastMarkedSuccess.traineeId}) • {lastMarkedSuccess.programme} • {lastMarkedSuccess.time}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTraineeModal(lastMarkedSuccess)}
              className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-[11px] font-bold shrink-0"
            >
              View Profile
            </button>
          </div>
        )}

      </div>

      {/* QUICK ACTIONS ROW (From reference kiosk.png) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-600/40 hover:bg-emerald-50/20 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Register New Learner</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-800 transition" />
          </button>

          <button
            onClick={() => showToast('Opening Course Enrollment Directory...', 'info')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-blue-600/40 hover:bg-blue-50/20 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Enrol in Course</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-700 transition" />
          </button>

          <button
            onClick={() => showToast('Opening Assessment Invigilation Terminal...', 'info')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-600/40 hover:bg-purple-50/20 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileEdit size={16} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Take Assessment</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-700 transition" />
          </button>

          <button
            onClick={() => showToast('Connecting to NCCT Private Key Signature Engine...', 'info')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-amber-600/40 hover:bg-amber-50/20 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Award size={16} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Issue Certificate</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700 transition" />
          </button>

          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-slate-400 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users size={16} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">View Learner Records</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 transition" />
          </button>

          <button
            onClick={triggerManualSync}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-600/40 hover:bg-emerald-50/20 text-left transition flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <RefreshCw size={16} className={isOffline ? '' : 'animate-spin-hover'} />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Sync Offline Data</span>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-800 transition" />
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION: Today's Attendance Table (Col 8) + Right Operational Panels (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Today's Attendance Table (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today's Attendance ({attendanceRecords.length} Recorded)
              </h3>
              <p className="text-xs text-slate-500">
                Live stream of biometric, QR and manual verifications at Ranchi Centre.
              </p>
            </div>

            {/* Attendance History Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['Today', 'Yesterday', 'This Week', 'This Month'].map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1 rounded-lg transition ${
                    historyFilter === f ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Trainee</th>
                    <th className="p-3.5">Trainee ID</th>
                    <th className="p-3.5">Programme</th>
                    <th className="p-3.5">Check-in Time</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={rec.avatar}
                            alt={rec.name}
                            className="w-9 h-9 rounded-xl object-cover border border-emerald-700/20"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{rec.name}</div>
                            <div className="text-[10px] text-slate-400">Attendance: {rec.attendanceRate}%</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-700">{rec.traineeId}</td>
                      <td className="p-3.5 text-slate-700 max-w-[150px] truncate">{rec.programme}</td>
                      <td className="p-3.5 font-bold text-slate-900">{rec.time}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium font-mono">
                          {rec.method}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status === 'Present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          rec.status === 'Late' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-50 text-slate-700 border border-gray-200'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedTraineeModal(rec)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-slate-100 font-bold text-[11px] text-slate-700 transition"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Device Status, Offline Sync, Today's Schedule, Alerts (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Hardware-Agnostic Device Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Device / Kiosk Status
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Hardware-Agnostic Edge
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Smartphone size={14} /> Device Model:
                </span>
                <span className="font-bold text-slate-800">Centre Tablet #01 (Android 14)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Battery size={14} /> Battery:
                </span>
                <span className="font-bold text-emerald-700">{batteryLevel}% (Plugged in)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <HardDrive size={14} /> Edge Storage:
                </span>
                <span className="font-bold text-slate-800">68% Available (SQLite)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wifi size={14} /> Network:
                </span>
                <span className={`font-bold ${isOffline ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {isOffline ? 'Offline (Buffered)' : 'Online (Direct)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock size={14} /> Last Synced:
                </span>
                <span className="font-mono text-slate-800">{lastSyncTime}</span>
              </div>
            </div>

            {/* Sync Now Button */}
            <div className="pt-1">
              <button
                onClick={triggerManualSync}
                className="w-full py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <RefreshCw size={13} className={isOffline ? '' : 'animate-spin-hover'} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Today's Schedule Card (From reference kiosk.png) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Today's Schedule
              </h3>
              <span className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                View All →
              </span>
            </div>

            <div className="space-y-3">
              {[
                { time: '10:00 AM – 11:00 AM', title: 'PACS Operations Training', room: 'Room 2A', count: '25 Learners', icon: Users, color: 'text-emerald-800 bg-emerald-50' },
                { time: '11:30 AM – 12:30 PM', title: 'Assessment Session', room: 'Computer Lab', count: '18 Learners', icon: FileEdit, color: 'text-purple-700 bg-purple-50' },
                { time: '02:00 PM – 03:00 PM', title: 'Digital Tools (MIS)', room: 'Room 1B', count: '20 Learners', icon: BookOpen, color: 'text-blue-700 bg-blue-50' },
                { time: '03:30 PM – 04:30 PM', title: 'Certificate Distribution', room: 'Main Hall', count: '12 Learners', icon: Award, color: 'text-amber-700 bg-amber-50' }
              ].map((sch, i) => {
                const Icon = sch.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-gray-100">
                    <div className={`w-8 h-8 rounded-xl ${sch.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400">{sch.time} • {sch.room}</div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{sch.title}</h4>
                      <p className="text-[10px] text-emerald-800 font-semibold">{sch.count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Centre Operational Alerts */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Centre Alerts
              </h3>
              <span className="text-[10px] font-bold text-amber-700">3 Notifications</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                <span className="text-slate-700 font-medium">3 trainees have low attendance (&lt;75%)</span>
                <button onClick={() => showToast('SMS reminder dispatched to 3 trainees', 'success')} className="text-emerald-800 font-bold hover:underline shrink-0 text-[11px]">
                  Alert Trainees
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                <span className="text-slate-700 font-medium">2 trainees have not checked in today</span>
                <button onClick={() => showToast('Attendance notice sent to batch coordinator', 'info')} className="text-emerald-800 font-bold hover:underline shrink-0 text-[11px]">
                  Follow Up
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                <span className="text-slate-700 font-medium">1 assessment scheduled for 11:30 AM</span>
                <button onClick={() => showToast('Assessment room unlocked', 'info')} className="text-emerald-800 font-bold hover:underline shrink-0 text-[11px]">
                  Prepare Lab
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: QR CODE CHECK-IN SCANNER */}
      {/* ---------------------------------------------------- */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={18} />
                <span className="text-sm font-bold">QR Attendance Scanner</span>
              </div>
              <button onClick={() => setQrModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              
              {/* Scanner Viewfinder Box */}
              <div className="relative w-64 h-64 mx-auto rounded-2xl bg-black overflow-hidden flex items-center justify-center border-2 border-emerald-500 shadow-inner">
                {/* Simulated Camera Feed */}
                <img
                  src="/assets/rohit_kumar.jpg"
                  alt="Camera Frame Target"
                  className="w-full h-full object-cover opacity-60"
                />

                {/* Animated Scan Line */}
                <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />

                {/* Corner reticles */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                <div className="absolute bottom-4 inset-x-0 text-center">
                  <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Align trainee QR within frame
                  </span>
                </div>
              </div>

              {/* Simulation Quick Trigger */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-500">Tap to simulate trainee badge scan:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      const rohit = masterTrainees[0];
                      markAttendanceForTrainee(rohit, 'QR Code');
                      setQrModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                  >
                    Scan Rohit Kumar (SS202500873)
                  </button>
                  <button
                    onClick={() => {
                      const priya = masterTrainees[1];
                      markAttendanceForTrainee(priya, 'QR Code');
                      setQrModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-gray-300 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    Scan Priya Kumari
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: CAMERA CHECK-IN (SIMULATED INT8 BIOMETRIC) */}
      {/* ---------------------------------------------------- */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="p-4 bg-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} />
                <span className="text-sm font-bold">Camera Facial Check-In</span>
              </div>
              <button onClick={() => setCameraModalOpen(false)} className="text-blue-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              
              {/* Camera Frame */}
              <div className="relative w-64 h-64 mx-auto rounded-full bg-black overflow-hidden flex items-center justify-center border-4 border-blue-500 shadow-xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Fallback image if camera fails */}
                <img
                  src="/assets/rohit_kumar.jpg"
                  alt="Camera Fallback"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />

                {/* Face Guide Oval */}
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-300 animate-pulse" />
                
                {/* Scanning Animation */}
                {isScanningFace && (
                  <div className="absolute inset-0 bg-blue-500/20">
                    <div className="w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)] animate-bounce" style={{ animationDuration: '1.5s' }}></div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {isScanningFace ? "Analyzing biometrics..." : "Face Detected!"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Identity Match Simulated • Hardware-agnostic camera check-in
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  disabled={isScanningFace}
                  className={`w-full py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm ${
                    isScanningFace ? 'bg-blue-400 cursor-not-allowed' : 'bg-emerald-600'
                  }`}
                >
                  {isScanningFace ? 'Scanning...' : 'Verified: Rohit Kumar'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: SEARCH TRAINEE ATTENDANCE */}
      {/* ---------------------------------------------------- */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="p-4 bg-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search size={18} />
                <span className="text-sm font-bold">Search & Mark Attendance</span>
              </div>
              <button onClick={() => setSearchModalOpen(false)} className="text-purple-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={traineeQuery}
                  onChange={(e) => setTraineeQuery(e.target.value)}
                  placeholder="Type name (e.g. Rohit Kumar), ID (SS202500873), or phone..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-700/20"
                />
              </div>

              {/* Trainee Results List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {searchResults.map(t => {
                  const isMarked = attendanceRecords.some(a => a.traineeId === t.traineeId);

                  return (
                    <div key={t.traineeId} className="p-3 rounded-xl border border-gray-200 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.traineeId} • {t.programme}</div>
                          <div className="text-[10px] text-emerald-800 font-semibold">{t.phone}</div>
                        </div>
                      </div>

                      <div>
                        {isMarked ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            ✓ Present
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              markAttendanceForTrainee(t, 'Manual Check');
                              setSearchModalOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px]"
                          >
                            Mark Present
                          </button>
                        )}
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
      {/* MODAL 4: TRAINEE QUICK DOSSIER */}
      {/* ---------------------------------------------------- */}
      {selectedTraineeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Trainee Quick Profile</span>
              <button onClick={() => setSelectedTraineeModal(null)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedTraineeModal.avatar}
                  alt={selectedTraineeModal.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-700/20"
                />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedTraineeModal.name}</h4>
                  <p className="text-[11px] text-slate-500">{selectedTraineeModal.programme}</p>
                  <p className="text-emerald-800 font-mono font-bold text-[10px] mt-0.5">Trainee ID: {selectedTraineeModal.traineeId}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-gray-200 text-center">
                <div>
                  <div className="font-black text-emerald-800 text-base">{selectedTraineeModal.attendanceRate}%</div>
                  <div className="text-[10px] text-slate-400">Attendance</div>
                </div>
                <div>
                  <div className="font-black text-slate-900 text-base">{selectedTraineeModal.learningRate || 68}%</div>
                  <div className="text-[10px] text-slate-400">Learning Progress</div>
                </div>
                <div>
                  <div className="font-black text-purple-700 text-base">{selectedTraineeModal.certificatesCount || selectedTraineeModal.certificates || 4}</div>
                  <div className="text-[10px] text-slate-400">Certificates</div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Centre:</span>
                  <span className="font-bold text-slate-800">Ranchi Cooperative Training Centre</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Today's Check-in:</span>
                  <span className="font-bold text-emerald-800">{selectedTraineeModal.time || '09:42 AM'} ({selectedTraineeModal.method || 'QR Code'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Primary Credential:</span>
                  <span className="font-mono text-purple-700 font-bold">SS2025PAC500873</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTraineeModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: REGISTER NEW LEARNER */}
      {/* ---------------------------------------------------- */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-sm font-bold">Register New Cooperative Learner</span>
              <button onClick={() => setRegisterModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              showToast('✓ Learner successfully registered at Ranchi Cooperative Centre!', 'success');
              setRegisterModalOpen(false);
            }} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input required placeholder="e.g. Ramesh Kumar" className="w-full p-2.5 border rounded-xl bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input required placeholder="e.g. 98351 00000" className="w-full p-2.5 border rounded-xl bg-slate-50" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Aadhaar (Last 4 digits)</label>
                  <input required placeholder="e.g. 8839" className="w-full p-2.5 border rounded-xl bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Course / Programme</label>
                <select className="w-full p-2.5 border rounded-xl bg-slate-50">
                  <option>PACS Management Programme</option>
                  <option>PACS Accounting & Bookkeeping</option>
                  <option>Digital Tools & MIS for PACS</option>
                  <option>Cooperative Governance & Management</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setRegisterModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-xl">Register Learner</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
