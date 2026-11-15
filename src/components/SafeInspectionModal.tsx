import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Lock,
  ArrowRight,
  EyeOff,
  FileText,
  QrCode,
  Info,
  Layers
} from 'lucide-react';
import { ScanResult } from '../types';
import { HolographicShield3D } from './HolographicShield3D';
import { RiskGauge } from './RiskGauge';
import { generatePdfReport } from '../services/pdfReportGenerator';

interface SafeInspectionModalProps {
  scan: ScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SafeInspectionModal: React.FC<SafeInspectionModalProps> = ({
  scan,
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !scan) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scan.rawData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      generatePdfReport(scan);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark Obsidian Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-obsidian-950/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl bg-obsidian-850 border border-chrome-400/25 rounded-2xl shadow-obsidian-glass overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-chrome-400/15 bg-obsidian-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              scan.riskLevel === 'SAFE'
                ? 'bg-obsidian-800 text-chrome-300 border-chrome-400/30'
                : 'bg-laser-500/10 text-laser-500 border-laser-500/40 shadow-laser-red/10'
            }`}>
              {scan.riskLevel === 'HIGH_RISK' && <ShieldAlert className="w-5 h-5 text-laser-500" />}
              {scan.riskLevel === 'SUSPICIOUS' && <AlertTriangle className="w-5 h-5 text-laser-400" />}
              {scan.riskLevel === 'SAFE' && <ShieldCheck className="w-5 h-5 text-chrome-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-chrome-100 tracking-wide font-display">
                  Safe Inspection Forensics
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-chrome-300 border border-chrome-400/30 uppercase">
                  {scan.contentType}
                </span>
              </div>
              <p className="text-xs text-chrome-500 font-mono">
                Asset ID: {scan.id} • {new Date(scan.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-chrome-400 hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* USER-REQUESTED HIGHLIGHT: WHAT TYPE OF QR CODE IT IS & SECURITY PERCENTAGE */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border border-laser-500/50 shadow-laser-red/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-laser-500 animate-ping" />
                  Identified QR Code Type & Platform
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
                  <span>{scan.qrAppType || (scan.contentType === 'UPI' ? 'UPI Payment QR' : scan.contentType === 'URL' ? 'Website URL QR' : 'Decoded QR Asset')}</span>
                </div>
                <div className="text-xs text-chrome-300 font-mono">
                  App Platform: <strong className="text-white">{scan.appProvider || scan.contentType}</strong> • Recipient / Entity: <strong className="text-laser-400">{scan.entityName || scan.contentType}</strong>
                </div>
              </div>

              {/* SECURITY PERCENTAGE BADGE */}
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-widest">
                  Security Protection Level
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-2xl sm:text-3xl font-black font-mono ${
                    (scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                      ? 'text-white'
                      : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                      ? 'text-laser-400'
                      : 'text-laser-500'
                  }`}>
                    {scan.securityPercentage ?? Math.max(0, 100 - scan.riskScore)}%
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                    (scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                      ? 'bg-chrome-950 text-chrome-200 border border-chrome-700'
                      : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                      ? 'bg-laser-950/40 text-laser-300 border border-laser-500/60'
                      : 'bg-laser-950 text-laser-400 border border-laser-500 animate-pulse'
                  }`}>
                    {(scan.securityPercentage ?? (100 - scan.riskScore)) >= 70 ? 'SECURED' : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40 ? 'SUSPICIOUS' : 'UNSECURED / DANGEROUS'}
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL PERCENTAGE PROGRESS BAR */}
            <div className="space-y-1.5">
              <div className="w-full bg-obsidian-950 rounded-full h-3 border border-chrome-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    (scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                      ? 'bg-gradient-to-r from-chrome-500 to-white shadow-chrome-edge'
                      : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                      ? 'bg-gradient-to-r from-laser-800 to-laser-500'
                      : 'bg-laser-500 shadow-laser-red'
                  }`}
                  style={{ width: `${Math.max(5, scan.securityPercentage ?? (100 - scan.riskScore))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-chrome-400">
                <span>0% Unsecured Threat</span>
                <span className="font-bold text-white">
                  {(scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                    ? '✓ SAFE: Verified secure to scan & proceed'
                    : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                    ? '⚠️ WARNING: Potential risks detected - Proceed with caution'
                    : '🚨 CRITICAL: High threat detected - DO NOT OPEN / PAY'}
                </span>
                <span>100% Fully Secure</span>
              </div>
            </div>
          </div>

          {/* Top Grid: 3D Chrome Shield & Risk Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-4 rounded-xl bg-obsidian-900/60 border border-chrome-400/15">
            {/* 3D Shield Preview */}
            <div className="md:col-span-4 flex items-center justify-center min-h-[200px]">
              <HolographicShield3D riskLevel={scan.riskLevel} size="sm" interactive={true} />
            </div>

            {/* Circular Risk Gauge */}
            <div className="md:col-span-3 flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-chrome-400/15 py-4 md:py-0">
              <span className="text-xs font-mono uppercase tracking-wider text-chrome-500 mb-2">
                Composite Risk
              </span>
              <RiskGauge score={scan.riskScore} riskLevel={scan.riskLevel} size="md" />
            </div>

            {/* AI Summary Breakdown */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-laser-500 font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-laser-500 animate-pulse" />
                Forensic Verdict Analysis
              </div>
              <p className="text-xs leading-relaxed text-chrome-300">
                {scan.aiSummary}
              </p>
              {scan.qrVerification && (
                <div className="mt-3 p-2.5 rounded-lg bg-obsidian-800 border border-chrome-400/15 text-xs">
                  <span className="text-chrome-500 font-mono">Tamper Status: </span>
                  <span className={`font-mono font-bold ${
                    scan.qrVerification.status === 'VERIFIED'
                      ? 'text-chrome-300'
                      : 'text-laser-500'
                  }`}>
                    {scan.qrVerification.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Decoded QR Code Identity & Detailed Information Breakdown */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-obsidian-900 border border-chrome-700/60 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-chrome-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-laser-500" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Decoded QR Code Identity & Extracted Details
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-chrome-950 text-chrome-300 border border-chrome-700/60">
                {scan.categoryDescription || scan.contentType}
              </span>
            </div>

            {/* Primary Identified Name Display */}
            <div className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider">Resource / Entity Name</span>
                <div className="text-sm sm:text-base font-bold text-white font-display mt-0.5">
                  {scan.entityName || (scan.contentType === 'URL' ? 'Web Destination' : scan.contentType === 'UPI' ? 'UPI Payment Stand' : 'Scanned Asset')}
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider">Classification</span>
                <div className="text-xs font-mono text-laser-400 font-semibold mt-0.5">
                  {scan.contentType} • {scan.riskLevel.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Detailed Parameters Grid */}
            {scan.entityDetails && Object.keys(scan.entityDetails).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Object.entries(scan.entityDetails).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-obsidian-950/80 border border-chrome-850 flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-wider">{key}</span>
                    <span className="text-xs font-mono font-semibold text-chrome-100 break-all mt-1">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-obsidian-950 border border-chrome-850">
                  <span className="text-[10px] font-mono text-chrome-400 uppercase">Target Payload</span>
                  <div className="text-xs font-mono text-chrome-100 break-all mt-1">{scan.rawData}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-obsidian-950 border border-chrome-850">
                  <span className="text-[10px] font-mono text-chrome-400 uppercase">Analysis Engine</span>
                  <div className="text-xs font-mono text-chrome-100 mt-1">QRShield Neural Forensics</div>
                </div>
              </div>
            )}
          </div>

          {/* Sanitized Extracted Payload Panel (Never auto-opens) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-laser-500" />
                Extracted QR Payload (Passive Protected Sandbox)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-laser-500 font-mono flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Auto-execution neutralized
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-obsidian-800 border border-chrome-400/25 hover:border-chrome-200 text-xs text-chrome-300 hover:text-white flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-chrome-200" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/20 font-mono text-xs text-chrome-200 break-all select-all leading-relaxed shadow-inner">
              {scan.rawData}
            </div>
          </div>

          {/* Threat Indicators List */}
          {scan.threatIndicators.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold text-laser-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-laser-500" />
                Active Threat Indicators ({scan.threatIndicators.length})
              </h4>
              <div className="space-y-2">
                {scan.threatIndicators.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-laser-500/10 border border-laser-500/35 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-laser-300">{t.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-laser-500/20 text-laser-400 border border-laser-500/40">
                          {t.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-chrome-400 mt-1">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Safety Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-chrome-400" />
              Recommended Safety Protocols
            </h4>
            <div className="p-4 rounded-xl bg-obsidian-800/80 border border-chrome-400/15 space-y-2">
              {scan.recommendedActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-chrome-300">
                  <span className="w-5 h-5 rounded-full bg-obsidian-950 border border-chrome-400/30 text-chrome-200 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-chrome-400/15 bg-obsidian-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-obsidian-800 border border-chrome-400/30 text-xs font-semibold text-chrome-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-3">
            {scan.contentType === 'URL' && onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('url-analysis');
                }}
                className="px-4 py-2 rounded-xl bg-obsidian-800 border border-chrome-400/30 hover:border-chrome-100 text-xs font-semibold text-chrome-200 flex items-center gap-1.5 transition-all"
              >
                <span>Deep URL Forensics</span>
                <ArrowRight className="w-3.5 h-3.5 text-laser-500" />
              </button>
            )}

            {scan.contentType === 'UPI' && onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('upi-security');
                }}
                className="px-4 py-2 rounded-xl bg-obsidian-800 border border-chrome-400/30 hover:border-chrome-100 text-xs font-semibold text-chrome-200 flex items-center gap-1.5 transition-all"
              >
                <span>Deep UPI Inspection</span>
                <ArrowRight className="w-3.5 h-3.5 text-laser-500" />
              </button>
            )}

            {/* Primary Action Button: Laser Crimson Red */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
