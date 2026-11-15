import React, { useState } from 'react';
import {
  GlobeLock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Server,
  Network
} from 'lucide-react';
import { api } from '../services/api';
import { UrlAnalysisResult } from '../types';

export const UrlAnalysisPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89');
  const [analysis, setAnalysis] = useState<UrlAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleAnalyze = async (targetUrl?: string) => {
    const url = (targetUrl || urlInput).trim();
    if (!url) return;
    setLoading(true);
    try {
      const res = await api.analyzeUrl(url);
      setAnalysis(res);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleAnalyze();
  }, []);

  const sampleUrls = [
    { label: 'Phishing IP Host', url: 'http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89' },
    { label: 'Crypto Shortener', url: 'https://bit.ly/airdrop-free-crypto-bonus' },
    { label: 'Brand Typosquat', url: 'https://login-paytm-secure.xyz/verify' },
    { label: 'Official Store', url: 'https://checkout.decathlon.in/store/402/express' }
  ];

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'MALICIOUS':
        return {
          label: 'CRITICAL DANGER',
          color: 'bg-laser-500/15 text-laser-500 border-laser-500 shadow-laser-red/10',
          icon: ShieldAlert
        };
      case 'SUSPICIOUS':
        return {
          label: 'MEDIUM RISK (SUSPICIOUS)',
          color: 'bg-obsidian-800 text-laser-400 border-laser-500/50',
          icon: AlertTriangle
        };
      case 'SAFE':
        return {
          label: 'LOW RISK (VERIFIED)',
          color: 'bg-obsidian-800 text-chrome-300 border-chrome-400/40 shadow-chrome-edge',
          icon: ShieldCheck
        };
      default:
        return {
          label: 'UNKNOWN / UNVERIFIED',
          color: 'bg-obsidian-800 text-chrome-500 border-chrome-500/30',
          icon: HelpCircle
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-chrome-400/30 text-xs font-mono text-laser-500 uppercase">
          <GlobeLock className="w-3.5 h-3.5" /> Web Destination Forensics
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display">
          URL Security Analysis
        </h1>
        <p className="text-xs text-chrome-400">
          Inspect extracted web destinations for deceptive homographs, typosquatting, hidden redirect trails, and offshore malicious IP infrastructure.
        </p>
      </div>

      {/* URL Input Bar */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-chrome-500" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste or enter URL to inspect (e.g. https://... or http://...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-obsidian-950 border border-chrome-400/25 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
            />
          </div>
          {/* Primary Action Button: Laser Crimson Red */}
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !urlInput.trim()}
            className="px-6 py-3 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Inspecting...' : 'Deep Inspect URL'}
          </button>
        </div>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-chrome-500 font-mono text-[11px]">Presets:</span>
          {sampleUrls.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setUrlInput(s.url);
                handleAnalyze(s.url);
              }}
              className="px-2.5 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-chrome-400/20 hover:border-chrome-200 text-chrome-300 text-[11px] font-mono transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Verdict Ribbon */}
          {(() => {
            const v = getVerdictBadge(analysis.safetyVerdict);
            const Icon = v.icon;
            return (
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${v.color}`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-obsidian-900 border border-current">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono tracking-wide">{v.label}</span>
                      <span className="text-xs font-mono opacity-80">
                        Score: {analysis.domainReputation}/100
                      </span>
                    </div>
                    <p className="text-xs text-chrome-300 mt-0.5">
                      {analysis.safetyVerdict === 'MALICIOUS'
                        ? 'High probability of credential fraud, malware delivery, or phishing.'
                        : analysis.safetyVerdict === 'SUSPICIOUS'
                        ? 'Anomalous domain parameters identified. Caution required.'
                        : 'Domain exhibits standard cryptographic trust credentials.'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-chrome-200 font-semibold">{analysis.domain}</div>
                  <div className="text-[10px] opacity-70">Protocol: {analysis.protocol.toUpperCase()}</div>
                </div>
              </div>
            );
          })()}

          {/* Forensic Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* HTTPS Status */}
            <div className="p-4 rounded-xl glass-card">
              <div className="flex items-center justify-between text-xs font-mono text-chrome-500 mb-1">
                <span>TRANSPORT ENCRYPTION</span>
                {analysis.isHttps ? <Lock className="w-4 h-4 text-chrome-300" /> : <Unlock className="w-4 h-4 text-laser-500" />}
              </div>
              <div className={`text-base font-bold font-mono ${analysis.isHttps ? 'text-chrome-200' : 'text-laser-500'}`}>
                {analysis.isHttps ? 'HTTPS SECURED' : 'UNENCRYPTED (HTTP)'}
              </div>
              <p className="text-[11px] text-chrome-400 mt-1">
                {analysis.isHttps
                  ? 'Active TLS cryptographic transport layer.'
                  : 'Cleartext protocol. Sensitive credentials can be intercepted.'}
              </p>
            </div>

            {/* URL Shortener Check */}
            <div className="p-4 rounded-xl glass-card">
              <div className="flex items-center justify-between text-xs font-mono text-chrome-500 mb-1">
                <span>SHORTENER WRAPPER</span>
                <Network className="w-4 h-4 text-chrome-300" />
              </div>
              <div className={`text-base font-bold font-mono ${analysis.isShortened ? 'text-laser-400' : 'text-chrome-200'}`}>
                {analysis.isShortened ? 'OBFUSCATED SHORTENER' : 'DIRECT DOMAIN'}
              </div>
              <p className="text-[11px] text-chrome-400 mt-1">
                {analysis.isShortened
                  ? 'Real destination masked behind redirection service.'
                  : 'Destination hostname exposed directly.'}
              </p>
            </div>

            {/* Direct IP Check */}
            <div className="p-4 rounded-xl glass-card">
              <div className="flex items-center justify-between text-xs font-mono text-chrome-500 mb-1">
                <span>HOST CLASSIFICATION</span>
                <Server className="w-4 h-4 text-chrome-300" />
              </div>
              <div className={`text-base font-bold font-mono ${analysis.isIpAddress ? 'text-laser-500' : 'text-chrome-200'}`}>
                {analysis.isIpAddress ? 'RAW IP ADDRESS' : 'REGISTERED FQDN'}
              </div>
              <p className="text-[11px] text-chrome-400 mt-1">
                {analysis.isIpAddress
                  ? 'Bypasses standard DNS registration; typical of temporary phishing pods.'
                  : 'Standard Domain Name System hierarchy.'}
              </p>
            </div>

            {/* Punycode / Homograph */}
            <div className="p-4 rounded-xl glass-card">
              <div className="flex items-center justify-between text-xs font-mono text-chrome-500 mb-1">
                <span>HOMOGRAPH SPOOFING</span>
                <ShieldAlert className="w-4 h-4 text-chrome-300" />
              </div>
              <div className={`text-base font-bold font-mono ${analysis.hasPunycode ? 'text-laser-500' : 'text-chrome-200'}`}>
                {analysis.hasPunycode ? 'PUNYCODE DETECTED' : 'ASCII CLEAN'}
              </div>
              <p className="text-[11px] text-chrome-400 mt-1">
                {analysis.hasPunycode
                  ? 'Uses deceptive foreign glyphs mimicking authentic character shapes.'
                  : 'Standard Latin character set without lookalike spoofing.'}
              </p>
            </div>
          </div>

          {/* Identified Indicators & Warnings */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Detailed Forensic Findings ({analysis.threatFlags.length})
            </h3>

            {analysis.threatFlags.length === 0 ? (
              <div className="p-4 rounded-xl bg-obsidian-800 border border-chrome-400/30 text-chrome-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chrome-300" />
                <span>Zero negative threat heuristics flagged for this destination.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {analysis.threatFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/15 flex items-start gap-3"
                  >
                    <XCircle className="w-4 h-4 text-laser-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-chrome-200">{flag}</div>
                      <p className="text-[11px] text-chrome-500 mt-0.5">
                        Heuristic flag derived from URL syntax, WHOIS age, or protocol attributes.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redirect Chain Trace */}
          <div className="p-6 rounded-2xl glass-panel space-y-3">
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Simulated Redirection Path
            </h3>
            <p className="text-xs text-chrome-500 font-mono">
              Tracing hop sequence from origin QR link to resolved endpoint
            </p>

            <div className="space-y-2 pt-2">
              {analysis.redirectChain.map((hop, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-obsidian-950 border border-chrome-400/20 flex items-center gap-3 font-mono text-xs text-chrome-200"
                >
                  <span className="w-5 h-5 rounded-full bg-obsidian-800 border border-chrome-400/30 text-laser-500 text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="truncate">{hop}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
