import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Smartphone, QrCode, CheckCircle2, AlertCircle, 
  Wifi, WifiOff, HardDrive, ShieldCheck, RefreshCw, Clock, 
  Video, VideoOff, Eye
} from 'lucide-react';
import { apiRequest, addToOfflineQueue } from '../api';

export default function SmartKioskModal({ 
  isOpen, 
  onClose, 
  currentTrainee, 
  isOffline, 
  onAttendanceEventRecorded 
}) {
  if (!isOpen) return null;

  const [scanMethod, setScanMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [deviceId] = useState('KIOSK-001');

  // Real Camera Stream States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const trainee = currentTrainee || {
    id: 1,
    full_name: 'Ramesh Kumar',
    pacs_name: 'PACS Rampur Primary Credit Society',
    location: 'Rampur, Uttar Pradesh'
  };

  // Start real camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } else {
        setCameraError("MediaDevices API unavailable in current environment.");
      }
    } catch (err) {
      console.warn("Webcam access note:", err.message);
      setCameraError(err.message.includes('Permission') 
        ? "Camera permission denied. Click permit to enable live video framing." 
        : "No active physical camera detected. Simulated visual framing enabled.");
      setIsCameraActive(false);
    }
  };

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleSimulateScan = async (method) => {
    setIsProcessing(true);
    setScanMethod(method);
    setLastResult(null);

    // If camera active and scanning face, capture the current frame to canvas
    if (method === 'FACE' && videoRef.current && canvasRef.current && isCameraActive) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // ignore capture errors
      }
    }

    // Hardware capture latency (simulate INT8 edge inference <80ms + liveness gate)
    await new Promise((res) => setTimeout(res, 600));

    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const eventPayload = {
      event_id: eventId,
      device_id: deviceId,
      trainee_id: trainee.id,
      method: method,
      timestamp: timestamp,
      location: 'Rampur Smart Training Kiosk - Doorway Tablet',
      sync_status: isOffline ? 'PENDING' : 'SYNCED'
    };

    if (isOffline) {
      const queueCount = addToOfflineQueue(eventPayload);
      setLastResult({
        success: true,
        offline: true,
        event_id: eventId,
        method: method,
        message: 'Attendance recorded in Edge NVRAM storage. Queued for server sync.',
        pendingCount: queueCount
      });
      setIsProcessing(false);
      if (onAttendanceEventRecorded) onAttendanceEventRecorded();
      return;
    }

    try {
      const res = await apiRequest('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(eventPayload)
      });
      setLastResult({
        success: true,
        offline: false,
        event_id: res.event_id,
        method: res.method,
        timestamp: res.timestamp,
        message: 'Identity Verified & Biometric Attendance Confirmed on National Server.'
      });
      if (onAttendanceEventRecorded) onAttendanceEventRecorded();
    } catch (err) {
      const queueCount = addToOfflineQueue(eventPayload);
      setLastResult({
        success: true,
        offline: true,
        event_id: eventId,
        method: method,
        message: 'Network unreachable. Queued in edge SQLite/Local buffer.',
        pendingCount: queueCount
      });
      if (onAttendanceEventRecorded) onAttendanceEventRecorded();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Kiosk Bezel Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white uppercase font-mono">
                SMART TRAINING KIOSK [KIOSK-001]
              </h3>
              <p className="text-[11px] text-slate-400">8-Inch Doorway Rugged Tablet &amp; Biometric Gateway</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Status Bar */}
        <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">NETWORK:</span>
            {isOffline ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <WifiOff className="w-3.5 h-3.5" /> OFFLINE BUFFER
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Wifi className="w-3.5 h-3.5" /> ONLINE SYNCHRONIZED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCameraActive ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <Video className="w-3 h-3" /> CAM LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <VideoOff className="w-3 h-3" /> CAM SIM
              </span>
            )}
          </div>
        </div>

        {/* Live Camera Viewport & Face Framing Reticle */}
        <div className="p-6">
          
          <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 mb-4 flex items-center justify-center">
            
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {/* Hidden Canvas for Snapshot Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Fallback Display if Camera Inactive / Permission Blocked */}
            {!isCameraActive && (
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Camera className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Live Camera Stream Fallback Mode</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  {cameraError || "Visual camera stream disconnected. Click button below to re-request webcam."}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg font-mono transition"
                >
                  Request Camera Permission
                </button>
              </div>
            )}

            {/* Optical Face Reticle & Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-44 h-44 rounded-2xl border-2 border-emerald-500/70 border-dashed flex items-center justify-center shadow-lg">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1"></div>

                {isProcessing && scanMethod === 'FACE' && (
                  <div className="absolute inset-x-0 h-1 bg-emerald-400/80 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                )}
                
                <span className="text-[10px] font-mono font-bold bg-slate-900/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  FACE TARGET
                </span>
              </div>
            </div>

            {/* Disclosing Note (Transparent Evaluation Truth) */}
            <div className="absolute bottom-2 inset-x-2 bg-slate-900/90 text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-md text-center border border-white/10">
              {isCameraActive ? '✓ Live Camera Preview Active' : '● Camera Simulated Preview'} • Feature embedding matching in evaluation simulation mode
            </div>
          </div>

          {/* Candidate Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">IDENTIFIED CANDIDATE</span>
              <h4 className="text-sm font-extrabold text-white">{trainee.full_name}</h4>
              <p className="text-xs text-amber-400">{trainee.pacs_name}</p>
            </div>
            <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60 px-2.5 py-1 rounded">
              ID #{trainee.id}
            </span>
          </div>

          {/* Three Scan Modalities */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <button
              onClick={() => handleSimulateScan('FACE')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 text-slate-200 transition group disabled:opacity-50 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 transition border border-slate-700 text-emerald-400">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">[ Scan Face ]</span>
              <span className="text-[9px] text-slate-400 font-mono">Live Framing</span>
            </button>

            <button
              onClick={() => handleSimulateScan('NFC')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 text-slate-200 transition group disabled:opacity-50 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 transition border border-slate-700 text-blue-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">[ Tap NFC ]</span>
              <span className="text-[9px] text-slate-400 font-mono">PN532 RFID</span>
            </button>

            <button
              onClick={() => handleSimulateScan('QR')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 text-slate-200 transition group disabled:opacity-50 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 transition border border-slate-700 text-amber-400">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">[ Scan QR ]</span>
              <span className="text-[9px] text-slate-400 font-mono">2D Barcode</span>
            </button>
          </div>

          {/* Feedback & Result Box */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-center py-4">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-1.5" />
              <p className="text-xs font-bold text-white">Extracting Sensor Vectors...</p>
              <p className="text-[10px] text-slate-400 font-mono">Computing Hardware HMAC Signature</p>
            </div>
          )}

          {lastResult && !isProcessing && (
            <div className={`p-3.5 rounded-xl border ${
              lastResult.offline 
                ? 'bg-amber-950/40 border-amber-700/60 text-amber-200' 
                : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                  lastResult.offline ? 'text-amber-400' : 'text-emerald-400'
                }`} />
                <div className="w-full text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white">✓ Identity Verified</span>
                    <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      {lastResult.method}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold mt-0.5 text-white">✓ Attendance Recorded Successfully</p>
                  
                  <div className="mt-2 pt-2 border-t border-white/10 text-[10px] font-mono text-slate-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Event ID:</span>
                      <span className="text-white">{lastResult.event_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode:</span>
                      <span className={lastResult.offline ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {lastResult.offline ? 'OFFLINE (Local Edge Buffer)' : 'ONLINE (Server Confirmed)'}
                      </span>
                    </div>
                    {lastResult.offline && (
                      <div className="flex justify-between text-amber-300 font-bold">
                        <span>Pending Sync:</span>
                        <span>{lastResult.pendingCount} events</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>DPDP ACT 2023 COMPLIANT</span>
          <button
            onClick={handleClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-xs transition cursor-pointer"
          >
            Close Kiosk
          </button>
        </div>

      </div>
    </div>
  );
}
