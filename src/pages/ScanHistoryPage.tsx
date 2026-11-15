import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { SecurityEngine } from '../services/securityEngine';
import { ScanResult } from '../types';

interface ScanHistoryPageProps {
  onSelectScan: (scan: ScanResult) => void;
}

export const ScanHistoryPage: React.FC<ScanHistoryPageProps> = ({ onSelectScan }) => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'>('ALL');

  const loadHistory = () => {
    const list = SecurityEngine.getScanHistory();
    setHistory(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this scan record from forensic history?')) {
      SecurityEngine.deleteScan(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all forensic scan history?')) {
      SecurityEngine.clearHistory();
      loadHistory();
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `QRShield_Forensics_Export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = history.filter((item) => {
    const matchesFilter = selectedFilter === 'ALL' || item.riskLevel === selectedFilter;
    const matchesSearch =
      item.rawData.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contentType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-chrome-700/50 text-xs font-mono text-chrome-300 uppercase">
            <History className="w-3.5 h-3.5 text-laser-500" />
            <span>Incident Audit Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display">
            Forensic Scan History
          </h1>
          <p className="text-xs text-chrome-400">
            Audit trail of intercepted QR payloads, threat scores, and heuristic forensics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-chrome-700 text-xs font-mono text-chrome-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-chrome-300" />
            <span>Export JSON</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-laser-950/30 hover:bg-laser-950/60 border border-laser-500/50 text-xs font-mono text-laser-400 hover:text-laser-300 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="p-4 rounded-2xl glass-panel bg-obsidian-900/90 border border-chrome-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-chrome-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payload, ID, or type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'SAFE', 'SUSPICIOUS', 'HIGH_RISK'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                selectedFilter === lvl
                  ? 'bg-laser-600 text-white shadow-laser-red font-bold'
                  : 'bg-obsidian-950 text-chrome-400 hover:text-white border border-chrome-800/80'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* History Records Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-chrome-800/80 bg-obsidian-900/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-chrome-800 bg-obsidian-950 text-[10px] font-mono uppercase tracking-wider text-chrome-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">QR Type & Platform</th>
                <th className="py-3 px-4">Entity & Payload</th>
                <th className="py-3 px-4">Security Level</th>
                <th className="py-3 px-4">Security Verdict</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chrome-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-chrome-500 font-mono">
                    No matching scan history records found.
                  </td>
                </tr>
              ) : (
                filtered.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-obsidian-850/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono text-chrome-400 whitespace-nowrap text-[11px]">
                      {new Date(scan.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white text-xs">{scan.qrAppType || (scan.contentType === 'UPI' ? 'UPI Payment QR' : scan.contentType === 'URL' ? 'Website URL QR' : scan.contentType)}</div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-chrome-950 text-chrome-400 border border-chrome-800 uppercase mt-0.5 inline-block">
                        {scan.appProvider || scan.contentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="font-semibold text-laser-400 truncate text-xs">{scan.entityName || scan.contentType}</div>
                      <div className="truncate text-chrome-400 font-mono text-[11px] mt-0.5">{scan.rawData}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-white text-xs">
                        {scan.securityPercentage ?? Math.max(0, 100 - scan.riskScore)}% SECURE
                      </div>
                      <span className="text-[10px] text-chrome-500 font-mono">
                        (Risk: {scan.riskScore}/100)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
                        (scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                          ? 'bg-chrome-950 text-chrome-300 border border-chrome-700/60'
                          : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                          ? 'bg-laser-950/20 text-laser-400 border border-laser-500/60'
                          : 'bg-laser-950/60 text-laser-300 border border-laser-500 shadow-laser-red/30'
                      }`}>
                        {(scan.securityPercentage ?? (100 - scan.riskScore)) >= 70 ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-chrome-400" />
                            <span>SECURED</span>
                          </>
                        ) : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40 ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-laser-400" />
                            <span>SUSPICIOUS</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-laser-500" />
                            <span>UNSECURED</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectScan(scan);
                          }}
                          className="px-2.5 py-1 rounded bg-obsidian-950 border border-chrome-800 hover:border-laser-500 text-chrome-300 hover:text-laser-400 text-xs font-mono transition-colors"
                        >
                          Forensics
                        </button>
                        <button
                          onClick={(e) => handleDelete(scan.id, e)}
                          className="p-1 rounded text-chrome-500 hover:text-laser-400 hover:bg-obsidian-950 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
