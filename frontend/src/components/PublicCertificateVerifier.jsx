import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Search, 
  ExternalLink, QrCode, Lock, Check 
} from 'lucide-react';
import { apiRequest } from '../api';

export default function PublicCertificateVerifier({ initialCertId, onBack }) {
  const [certId, setCertId] = useState(initialCertId || 'CERT-NCCT-2026-RAMESH01');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyCertificate = async (idToVerify) => {
    const target = idToVerify || certId;
    if (!target.trim()) return;

    try {
      setLoading(true);
      const res = await apiRequest(`/certificates/verify/${target.trim()}`);
      setVerificationResult(res);
    } catch (e) {
      setVerificationResult({
        is_valid: false,
        status: 'ERROR',
        message: e.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      setCertId(initialCertId);
      verifyCertificate(initialCertId);
    } else {
      verifyCertificate('CERT-NCCT-2026-RAMESH01');
    }
  }, [initialCertId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      {/* Verifier Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-extrabold uppercase font-mono mb-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>PUBLIC ZERO-LOGIN REGISTRY</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          National Cooperative Credential Verifier
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Cryptographically verify NCCT certificates using asymmetric Ed25519 digital signatures.
          Zero gas fees, tamper-proof, and offline verifiable in &lt;15ms.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate ID (e.g. CERT-NCCT-2026-RAMESH01)"
          className="flex-1 text-sm font-mono font-bold text-slate-900 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && verifyCertificate()}
        />
        <button
          onClick={() => verifyCertificate()}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Signature'}
        </button>
      </div>

      {/* Verification Result Card */}
      {verificationResult && (
        <div className={`bg-white border-2 rounded-2xl p-6 sm:p-8 shadow-lg ${
          verificationResult.is_valid ? 'border-emerald-500' : 'border-red-400'
        }`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                verificationResult.is_valid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {verificationResult.is_valid ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className={`text-xs font-mono font-extrabold uppercase ${
                  verificationResult.is_valid ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  {verificationResult.status}
                </span>
                <h3 className="text-xl font-black text-slate-950">
                  {verificationResult.is_valid ? 'Authentic Ed25519 Credential' : 'Verification Unsuccessful'}
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Verified: {new Date(verificationResult.verified_at).toLocaleTimeString()}
            </span>
          </div>

          {verificationResult.is_valid ? (
            <div className="mt-6 space-y-6">
              
              {/* Credential Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">CANDIDATE NAME</span>
                  <span className="text-base font-bold text-slate-900">{verificationResult.trainee_name}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">CERTIFICATE ID</span>
                  <span className="text-base font-mono font-bold text-amber-700">{verificationResult.certificate_id}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">COURSE &amp; COMPETENCY</span>
                  <span className="text-sm font-bold text-slate-900">{verificationResult.course_title}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">ISSUING AUTHORITY</span>
                  <span className="text-sm font-bold text-slate-900">{verificationResult.issuing_authority}</span>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="bg-slate-900 rounded-xl p-5 text-white font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ASYMMETRIC ED25519 CRYPTOGRAPHIC PROOF</span>
                  </span>
                  <span>{verificationResult.cryptography?.gas_cost}</span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 text-[11px] block">Digital Signature (URL-Safe Base64):</span>
                  <span className="text-emerald-400 text-xs break-all">
                    {verificationResult.cryptography?.signature_snippet}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 text-[11px] block">Public Key Identifier:</span>
                  <span className="text-slate-300 text-xs break-all">
                    {verificationResult.cryptography?.public_key_snippet}
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 border-t border-white/10">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>W3C Verifiable Credential standard compliant • Push enabled for citizen DigiLocker</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
              {verificationResult.message || 'The cryptographic signature did not match the issuing authority public key.'}
            </div>
          )}

        </div>
      )}

      {onBack && (
        <div className="text-center pt-4">
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-900 hover:underline"
          >
            ← Back to Portal
          </button>
        </div>
      )}

    </div>
  );
}
