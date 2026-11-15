import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRightLeft,
  Store
} from 'lucide-react';
import { api } from '../services/api';
import { QRVerificationResult, RegisteredQR } from '../types';

interface QrVerificationPageProps {
  onNavigateTab: (tab: string) => void;
}

export const QrVerificationPage: React.FC<QrVerificationPageProps> = ({ onNavigateTab }) => {
  const [testPayload, setTestPayload] = useState<string>(
    'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR'
  );
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [registeredList, setRegisteredList] = useState<RegisteredQR[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRegistered = async () => {
    const list = await api.getRegisteredQrs();
    setRegisteredList(list);
  };

  const handleVerify = async (payloadToVerify?: string) => {
    const payload = (payloadToVerify || testPayload).trim();
    if (!payload) return;
    setLoading(true);
    try {
      const res = await api.verifyQr(payload);
      setVerificationResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistered();
    handleVerify();
  }, []);

  const sampleAttacks = [
    {
      label: 'Sticker Overlay Tamper (Starbucks)',
      payload: 'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR',
      expected: 'DESTINATION CHANGED'
    },
    {
      label: 'Authentic Decathlon Checkout',
      payload: 'https://checkout.decathlon.in/store/402/express',
      expected: 'VERIFIED'
    },
    {
      label: 'Random Unregistered URL',
      payload: 'https://my-personal-blog-982.net/article',
      expected: 'NOT REGISTERED'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-chrome-400/30 text-xs font-mono text-laser-500 uppercase">
            <ShieldAlert className="w-3.5 h-3.5" /> Physical & Digital Tamper Forensics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display">
            QR Destination Replacement Detection
          </h1>
          <p className="text-xs text-chrome-400">
            Audit scanned QR destinations against registered cryptographic merchant master records to catch counter sticker overlays.
          </p>
        </div>

        {/* Secondary Action: Chrome Outline on Obsidian Black */}
        <button
          onClick={() => onNavigateTab('registered-qrs')}
          className="px-4 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-chrome-400/40 hover:border-chrome-100 text-chrome-200 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Store className="w-4 h-4 text-laser-500" />
          <span>Register Business QR</span>
        </button>
      </div>

      {/* Verification Input & Presets */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider">
          Input Scanned QR Destination to Verify
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            placeholder="Paste URL or UPI destination..."
            className="flex-1 px-4 py-3 rounded-xl bg-obsidian-950 border border-chrome-400/25 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
          />
          {/* Primary Action Button: Laser Crimson Red */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || !testPayload.trim()}
            className="px-6 py-3 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Audit Tamper State'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-chrome-500 font-mono text-[11px]">Audit Presets:</span>
          {sampleAttacks.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setTestPayload(s.payload);
                handleVerify(s.payload);
              }}
              className="px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-chrome-400/20 hover:border-chrome-200 text-chrome-300 text-[11px] font-mono transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Main Visual State Banner */}
          {verificationResult.status === 'DESTINATION_CHANGED' && (
            <div className="p-6 rounded-2xl bg-laser-500/15 border-2 border-laser-500 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-laser-red/20">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-laser-500">
                  <ShieldAlert className="w-8 h-8 text-laser-500" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-laser-400 font-bold">
                    CRITICAL TAMPER ATTACK IDENTIFIED
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-display">
                    DESTINATION CHANGED (Sticker Overlay Swap)
                  </h3>
                  <p className="text-xs text-chrome-300 mt-1 max-w-2xl">
                    {verificationResult.mismatchDetails ||
                      'The scanned destination conflicts with the authentic merchant destination registered in the QRShield secure vault.'}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-laser-500 text-white font-mono font-bold text-xs shadow-laser-red shrink-0">
                TAMPER ALERT
              </div>
            </div>
          )}

          {verificationResult.status === 'VERIFIED' && (
            <div className="p-6 rounded-2xl bg-obsidian-850 border border-chrome-400/40 text-chrome-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chrome-edge">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-chrome-400/30">
                  <ShieldCheck className="w-8 h-8 text-chrome-300" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-chrome-400 font-bold">
                    SECURITY CHECK PASSED
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-display">
                    VERIFIED AUTHENTIC DESTINATION
                  </h3>
                  <p className="text-xs text-chrome-400 mt-1">
                    Scanned payload matches 100% of cryptographic registration hash for{' '}
                    <span className="font-semibold text-white">
                      {verificationResult.registeredRecord?.businessName}
                    </span>
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-obsidian-800 border border-chrome-400/40 text-chrome-200 font-mono font-bold text-xs shrink-0">
                VERIFIED
              </div>
            </div>
          )}

          {verificationResult.status === 'NOT_REGISTERED' && (
            <div className="p-5 rounded-2xl bg-obsidian-850 border border-chrome-400/25 text-chrome-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-obsidian-900 border border-chrome-400/20">
                  <HelpCircle className="w-6 h-6 text-chrome-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    NOT REGISTERED IN BUSINESS REGISTRY
                  </h3>
                  <p className="text-xs text-chrome-500 mt-0.5">
                    This destination has not been onboarded to the QRShield anti-tamper vault.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('registered-qrs')}
                className="px-3.5 py-1.5 rounded-xl bg-obsidian-950 border border-chrome-400/40 text-chrome-200 hover:border-chrome-100 text-xs font-mono hover:bg-obsidian-900 transition-colors"
              >
                Register Business Now
              </button>
            </div>
          )}

          {/* Destination Diff Comparison Panel */}
          {verificationResult.originalDestination && (
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-laser-500" />
                  Forensic Destination Diff Analysis
                </h3>
                <span className="text-[10px] font-mono text-chrome-500 uppercase">
                  SHA-256 Hash Compare
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registered Original Target (Chrome Silver Muted Clean) */}
                <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-400/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-chrome-300">
                    <span>AUTHENTIC REGISTERED TARGET</span>
                    <CheckCircle2 className="w-4 h-4 text-chrome-400" />
                  </div>
                  <div className="font-mono text-xs text-chrome-200 break-all p-3 rounded-lg bg-obsidian-900 border border-chrome-400/20">
                    {verificationResult.originalDestination}
                  </div>
                  <div className="text-[11px] text-chrome-500">
                    Business:{' '}
                    <span className="text-chrome-200 font-semibold">
                      {verificationResult.registeredRecord?.businessName}
                    </span>
                  </div>
                </div>

                {/* Scanned Tampered Target (Laser Crimson Highlight) */}
                <div className="p-4 rounded-xl bg-laser-500/10 border border-laser-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-laser-500">
                    <span>SCANNED ASSET TARGET</span>
                    <XCircle className="w-4 h-4 text-laser-500" />
                  </div>
                  <div className="font-mono text-xs text-white break-all p-3 rounded-lg bg-obsidian-950 border border-laser-500/30">
                    {verificationResult.scannedDestination}
                  </div>
                  <div className="text-[11px] text-laser-400 font-semibold font-mono">
                    Tamper Risk Score: {verificationResult.tamperRiskScore}/100
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registered Vault Summary */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
            Registered Merchant QR Vault ({registeredList.length})
          </h3>
          <button
            onClick={fetchRegistered}
            className="text-xs font-mono text-laser-500 hover:underline"
          >
            Refresh Vault
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {registeredList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setTestPayload(item.destination);
                handleVerify(item.destination);
              }}
              className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/15 hover:border-chrome-200 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-chrome-100">{item.businessName}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-obsidian-800 text-chrome-300 border border-chrome-400/30">
                    {item.status}
                  </span>
                </div>
                <div className="text-[11px] text-chrome-500">{item.qrName}</div>
              </div>
              <div className="text-[10px] font-mono text-chrome-300 truncate mt-2">
                {item.destination}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
