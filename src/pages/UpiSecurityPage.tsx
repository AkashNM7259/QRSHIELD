import React, { useState } from 'react';
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
  UserCheck,
  UserX,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { UpiAnalysisResult } from '../types';

export const UpiSecurityPage: React.FC = () => {
  const [upiInput, setUpiInput] = useState<string>(
    'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR'
  );
  const [analysis, setAnalysis] = useState<UpiAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInspect = async (rawUri?: string) => {
    const uri = (rawUri || upiInput).trim();
    if (!uri) return;
    setLoading(true);
    try {
      const res = await api.analyzeUpi(uri);
      setAnalysis(res);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleInspect();
  }, []);

  const sampleScenarios = [
    {
      label: 'Tampered Starbucks Stand',
      uri: 'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR',
      badge: 'Fraudulent VPA Mismatch'
    },
    {
      label: 'Verified Apollo Pharmacy',
      uri: 'upi://pay?pa=apollopharmacy.pay@icici&pn=Apollo%20Pharmacy&mc=5912&cu=INR',
      badge: 'Merchant Whitelisted'
    },
    {
      label: 'Suspicious Preset Sum (₹50k)',
      uri: 'upi://pay?pa=vendor.support@okhdfcbank&pn=Electronics%20Depot&am=50000.00&cu=INR',
      badge: 'High Collect Amount'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Header */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-chrome-400/30 text-xs font-mono text-laser-500 uppercase">
          <CreditCard className="w-3.5 h-3.5" /> NPCI Unified Payments Protocol Inspection
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display">
          UPI Payment Security & Fraud Inspector
        </h1>
        <p className="text-xs text-chrome-400">
          Verify payee identity bindings, detect counter QR sticker replacement attacks, and prevent fraudulent collect requests before authorization.
        </p>
      </div>

      {/* Mandatory Regulatory Anti-Fraud Directive */}
      <div className="p-4 rounded-2xl bg-obsidian-850 border border-laser-500/50 text-chrome-200 text-xs flex items-start gap-3 shadow-laser-red/10">
        <AlertTriangle className="w-5 h-5 text-laser-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-laser-400 uppercase tracking-wide">
            CRITICAL ANTI-FRAUD DIRECTIVE: Never Enter Your UPI PIN to Receive Money
          </div>
          <p className="text-chrome-400 text-[11px] leading-relaxed">
            Entering your UPI PIN always DEBITS funds from your bank balance. QRShield strictly inspects payment parameters for safety and NEVER requests your PIN, OTP, password, or banking credentials.
          </p>
        </div>
      </div>

      {/* UPI URI Input Bar */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={upiInput}
            onChange={(e) => setUpiInput(e.target.value)}
            placeholder="e.g. upi://pay?pa=merchant@okaxis&pn=Business%20Name&am=150.00&cu=INR"
            className="flex-1 px-4 py-3 rounded-xl bg-obsidian-950 border border-chrome-400/25 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
          />
          {/* Primary Action Button: Laser Crimson Red */}
          <button
            onClick={() => handleInspect()}
            disabled={loading || !upiInput.trim()}
            className="px-6 py-3 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Inspecting...' : 'Verify UPI Safety'}
          </button>
        </div>

        {/* Quick Test Vectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-chrome-500 font-mono text-[11px]">Test Vectors:</span>
          {sampleScenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setUpiInput(s.uri);
                handleInspect(s.uri);
              }}
              className="px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-chrome-400/20 hover:border-chrome-200 text-chrome-300 text-[11px] font-mono transition-colors"
            >
              {s.label} ({s.badge})
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Details */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Status Alert */}
          {analysis.isNameMismatch ? (
            <div className="p-6 rounded-2xl bg-laser-500/15 border-2 border-laser-500 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-laser-red/20">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-laser-500">
                  <UserX className="w-8 h-8 text-laser-500" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-laser-400 font-bold">
                    CRITICAL SECURITY THREAT
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-display">
                    Payee Identity Conflict (VPA Mismatch)
                  </h3>
                  <p className="text-xs text-chrome-300 mt-1 max-w-xl">
                    The displayed store name asserts <span className="font-bold underline text-white">{analysis.payeeName}</span>, but payments are routed to personal / unverified account <span className="font-mono font-bold text-laser-400">{analysis.vpa}</span>.
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-laser-500 text-white font-mono font-bold text-xs shadow-laser-red shrink-0">
                DO NOT PAY
              </div>
            </div>
          ) : analysis.isRegisteredMerchant ? (
            <div className="p-6 rounded-2xl bg-obsidian-850 border border-chrome-400/40 text-chrome-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-chrome-edge">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-chrome-400/30">
                  <UserCheck className="w-8 h-8 text-chrome-300" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-chrome-400 font-bold">
                    CRYPTOGRAPHICALLY VERIFIED
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-display">
                    Authentic Verified Merchant Account
                  </h3>
                  <p className="text-xs text-chrome-400 mt-1">
                    Matched registered business entity: <span className="font-semibold text-white">{analysis.registeredMerchantName}</span>
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-obsidian-800 border border-chrome-400/50 text-chrome-200 font-mono font-bold text-xs shrink-0">
                VERIFIED SAFE
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-obsidian-850 border border-chrome-400/25 text-chrome-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-obsidian-900 border border-chrome-400/20">
                  <HelpCircle className="w-6 h-6 text-chrome-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Unregistered Commercial / P2P Account
                  </h3>
                  <p className="text-xs text-chrome-500 mt-0.5">
                    This account is not currently present in the QRShield business registry. Exercise standard verification.
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-obsidian-950 border border-chrome-400/20 font-mono text-xs text-chrome-400 shrink-0">
                UNREGISTERED
              </div>
            </div>
          )}

          {/* Parsed UPI Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Payee Name */}
            <div className="p-4 rounded-xl glass-card">
              <div className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider mb-1">
                Payee Display Name (pn)
              </div>
              <div className="text-base font-bold text-chrome-100 truncate">
                {analysis.payeeName}
              </div>
              <div className="text-[11px] text-chrome-500 mt-1 font-mono">
                {analysis.isNameMismatch ? '⚠️ Discrepancy with receiving account' : 'Declared recipient identifier'}
              </div>
            </div>

            {/* Payee VPA */}
            <div className="p-4 rounded-xl glass-card">
              <div className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider mb-1">
                Destination UPI ID / VPA (pa)
              </div>
              <div className="text-base font-mono font-bold text-laser-500 truncate">
                {analysis.vpa || 'Not Specified'}
              </div>
              <div className="text-[11px] text-chrome-500 mt-1 font-mono">
                {analysis.isSuspiciousHandle ? '⚠️ Non-standard routing PSP handle' : 'Verified bank routing format'}
              </div>
            </div>

            {/* Pre-set Amount */}
            <div className="p-4 rounded-xl glass-card">
              <div className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider mb-1">
                Pre-Set Sum (am)
              </div>
              <div className="text-base font-mono font-bold text-chrome-100 flex items-center">
                <IndianRupee className="w-4 h-4 mr-0.5 text-chrome-400" />
                {analysis.amount ? `${analysis.amount} ${analysis.currency}` : 'Dynamic / Customer Enters Amount'}
              </div>
              <div className="text-[11px] text-chrome-500 mt-1 font-mono">
                {analysis.amount ? 'Preset amount locked in QR' : 'Standard open bill payment'}
              </div>
            </div>
          </div>

          {/* Safety Protocols & Heuristics */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Transaction Integrity Protocols
            </h3>

            <div className="space-y-2">
              {analysis.safetyAdvice.map((advice, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/15 flex items-start gap-3 text-xs text-chrome-300"
                >
                  <span className="w-5 h-5 rounded-full bg-obsidian-800 border border-chrome-400/25 text-laser-500 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{advice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
