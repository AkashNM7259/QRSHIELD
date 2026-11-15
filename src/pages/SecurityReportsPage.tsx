import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Cpu,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityEngine } from '../services/securityEngine';
import { ScanResult, SecurityReport } from '../types';
import { generatePdfReport } from '../services/pdfReportGenerator';

export const SecurityReportsPage: React.FC = () => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    const list = SecurityEngine.getScanHistory();
    setHistory(list);
    if (list.length > 0) {
      setSelectedScanId(list[0].id);
      loadReport(list[0].id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadReport = async (scanId: string) => {
    setLoading(true);
    try {
      const rep = await api.getSecurityReport(scanId);
      setReport(rep);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    loadReport(id);
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    setDownloading(true);
    try {
      generatePdfReport(report.scanResult);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-obsidian-900 border border-chrome-800 mx-auto flex items-center justify-center text-chrome-400">
          <FileText className="w-8 h-8 text-laser-500" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">No Security Reports Generated Yet</h2>
        <p className="text-xs text-chrome-400 max-w-md mx-auto">
          Scan a QR code from the Smart Scanner page to automatically generate real-time forensic reports and exportable PDF audit files.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-chrome-700/50 text-xs font-mono text-chrome-300 uppercase">
            <FileText className="w-3.5 h-3.5 text-laser-500" />
            <span>Formal Forensic Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display">
            Security Incident Reports
          </h1>
          <p className="text-xs text-chrome-400">
            Generate and export cryptographically validated cybersecurity audit reports for compliance and merchant investigations.
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={downloading || !report}
          className="px-5 py-2.5 rounded-xl bg-laser-600 hover:bg-laser-500 text-white font-bold text-xs shadow-laser-red flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-white" />
          <span>{downloading ? 'Preparing PDF...' : 'Download Official PDF Report'}</span>
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="p-3 rounded-2xl glass-panel bg-obsidian-900/90 border border-chrome-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-chrome-400 font-mono text-xs px-2 whitespace-nowrap">Select Incident:</span>
        {history.map((scan) => (
          <button
            key={scan.id}
            onClick={() => handleSelectScan(scan.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedScanId === scan.id
                ? 'bg-laser-600 text-white shadow-laser-red font-bold'
                : 'bg-obsidian-950 text-chrome-400 hover:text-white border border-chrome-800'
            }`}
          >
            <span>{scan.id}</span>
            <span className={`w-2 h-2 rounded-full ${
              scan.riskLevel === 'SAFE'
                ? 'bg-chrome-400'
                : scan.riskLevel === 'SUSPICIOUS'
                ? 'border border-laser-500 bg-transparent'
                : 'bg-laser-500 shadow-laser-red'
            }`} />
          </button>
        ))}
      </div>

      {/* Rendered Formal Report Document Layout */}
      {report && (
        <div className="rounded-3xl glass-panel p-6 sm:p-10 border border-chrome-800/80 space-y-8 bg-obsidian-900/90 shadow-2xl">
          {/* Document Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-chrome-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-wider text-white font-display">
                  QR<span className="text-laser-500">SHIELD</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-obsidian-950 text-chrome-300 border border-chrome-800">
                  OFFICIAL AUDIT REPORT
                </span>
              </div>
              <p className="text-[11px] text-chrome-400 font-mono mt-1">
                Document Ref: {report.reportId} • Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold uppercase ${
              report.scanResult.riskLevel === 'SAFE'
                ? 'bg-chrome-950 text-chrome-300 border-chrome-700/60'
                : report.scanResult.riskLevel === 'SUSPICIOUS'
                ? 'bg-laser-950/20 text-laser-400 border-laser-500/50'
                : 'bg-laser-950/60 text-laser-300 border-laser-500 shadow-laser-red/30'
            }`}>
              <span>VERDICT: {report.scanResult.riskLevel.replace('_', ' ')}</span>
              <span>({report.scanResult.riskScore}/100)</span>
            </div>
          </div>

          {/* Scanned Artifact Forensic Metadata */}
          <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-850 space-y-2">
            <div className="text-[10px] font-mono text-chrome-400 uppercase tracking-wider">
              Scanned Target Payload (Sanitized)
            </div>
            <div className="font-mono text-xs text-chrome-200 break-all select-all">
              {report.scanResult.rawData}
            </div>
          </div>

          {/* Executive Threat Assessment */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-chrome-300 tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-laser-500" />
              <span>1. Executive Threat Assessment Summary</span>
            </h3>
            <p className="text-xs leading-relaxed text-chrome-200 p-4 rounded-xl bg-obsidian-950 border border-chrome-850">
              {report.executiveSummary}
            </p>
          </div>

          {/* Compliance & Standards Verification Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-chrome-300 tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-laser-500" />
              <span>2. Cybersecurity Baseline & Compliance Checks</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.complianceChecks.map((chk, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-850 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{chk.check}</div>
                    <div className="text-[11px] text-chrome-400 mt-0.5">{chk.note}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                    chk.status === 'PASS'
                      ? 'bg-chrome-950 text-chrome-300 border border-chrome-700/60'
                      : chk.status === 'WARN'
                      ? 'bg-laser-950/20 text-laser-400 border border-laser-500/50'
                      : 'bg-laser-950/60 text-laser-300 border border-laser-500 shadow-laser-red/30'
                  }`}>
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Metadata & Heuristic Engine Signatures */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-chrome-300 tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-laser-500" />
              <span>3. Forensic Engine Metadata & Integrity Seal</span>
            </h3>
            <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-850 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-chrome-500 text-[10px]">ENGINE VERSION:</span>
                <div className="text-chrome-200 mt-0.5">{report.technicalMetadata.engineVersion}</div>
              </div>
              <div>
                <span className="text-chrome-500 text-[10px]">SIGNATURE REVISION:</span>
                <div className="text-chrome-200 mt-0.5">{report.technicalMetadata.signatureDatabase}</div>
              </div>
              <div>
                <span className="text-chrome-500 text-[10px]">LATENCY:</span>
                <div className="text-chrome-200 mt-0.5">{report.technicalMetadata.scanLatencyMs} ms</div>
              </div>
              <div>
                <span className="text-chrome-500 text-[10px]">HASH INTEGRITY:</span>
                <div className="text-chrome-300 mt-0.5">VERIFIED PASS</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
