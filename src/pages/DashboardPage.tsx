import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FolderLock,
  Activity,
  TrendingUp,
  RefreshCw,
  QrCode,
  ChevronRight
} from 'lucide-react';
import { DashboardStats, ScanResult } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onScanClick: () => void;
  onSelectScan: (scan: ScanResult) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onScanClick,
  onSelectScan,
  onNavigateTab
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-obsidian-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-obsidian-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-obsidian-800 rounded-2xl animate-pulse" />
          <div className="h-72 bg-obsidian-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const total = stats.totalScans || 1;
  const safePercent = Math.round((stats.safeCount / total) * 100);
  const suspPercent = Math.round((stats.suspiciousCount / total) * 100);
  const riskPercent = Math.round((stats.highRiskCount / total) * 100);
  const maxWeekly = Math.max(...stats.weeklyActivity.map(w => w.safe + w.threat), 10);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display tracking-wide">
              Security Operations Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-obsidian-800 text-laser-500 border border-laser-500/40">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-chrome-400 mt-1">
            Real-time telemetry, threat distribution and destination tamper audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-obsidian-800 border border-chrome-400/25 hover:border-chrome-100 text-chrome-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            title="Refresh Dashboard Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-laser-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Primary Action Button: Laser Crimson Red */}
          <button
            onClick={onScanClick}
            className="px-4 py-2 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Scans */}
        <div className="p-4 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-chrome-400 text-xs font-mono">
            <span>TOTAL SCANS</span>
            <Activity className="w-4 h-4 text-chrome-300" />
          </div>
          <div className="text-3xl font-mono font-bold text-chrome-100 mt-2">
            {stats.totalScans}
          </div>
          <div className="text-[11px] text-chrome-500 mt-1 flex items-center gap-1">
            <span className="text-chrome-300 font-mono flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18%
            </span>
            <span>vs last 7d</span>
          </div>
        </div>

        {/* Safe Destinations (Muted Silver) */}
        <div className="p-4 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-chrome-300 text-xs font-mono">
            <span>SAFE DESTINATIONS</span>
            <ShieldCheck className="w-4 h-4 text-chrome-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-chrome-200 mt-2">
            {stats.safeCount}
          </div>
          <div className="text-[11px] text-chrome-500 mt-1">
            {safePercent}% verified clean
          </div>
        </div>

        {/* Suspicious Flags (Crimson Outline Style) */}
        <div className="p-4 rounded-2xl glass-card border border-laser-500/40">
          <div className="flex items-center justify-between text-laser-400 text-xs font-mono">
            <span>SUSPICIOUS FLAGS</span>
            <AlertTriangle className="w-4 h-4 text-laser-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-laser-400 mt-2">
            {stats.suspiciousCount}
          </div>
          <div className="text-[11px] text-chrome-500 mt-1">
            Requires inspection
          </div>
        </div>

        {/* High-Risk Threats (Strong Laser Red) */}
        <div className="p-4 rounded-2xl glass-card border border-laser-500 bg-laser-500/10 shadow-laser-red/10">
          <div className="flex items-center justify-between text-laser-500 text-xs font-mono">
            <span>HIGH-RISK THREATS</span>
            <ShieldAlert className="w-4 h-4 text-laser-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-laser-500 mt-2">
            {stats.highRiskCount}
          </div>
          <div className="text-[11px] text-laser-400 mt-1">
            Immediate block enforced
          </div>
        </div>

        {/* Registered Assets */}
        <div className="p-4 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-chrome-400 text-xs font-mono">
            <span>REGISTERED VAULT</span>
            <FolderLock className="w-4 h-4 text-chrome-300" />
          </div>
          <div className="text-3xl font-mono font-bold text-chrome-100 mt-2">
            {stats.registeredCount}
          </div>
          <div className="text-[11px] text-chrome-500 mt-1">
            Whitelisted merchant stands
          </div>
        </div>
      </div>

      {/* Middle Section: Weekly Activity & Risk Severity Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Scan Activity Chart (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
                Weekly Threat & Telemetry Activity
              </h3>
              <p className="text-[11px] text-chrome-500 font-mono">
                Clean verified scans vs intercepted threat vectors
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-chrome-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-chrome-400" /> Safe Scans
              </span>
              <span className="flex items-center gap-1.5 text-laser-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-laser-500" /> Intercepted Threats
              </span>
            </div>
          </div>

          {/* Activity Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {stats.weeklyActivity.map((day) => {
                const safeHeight = Math.max(10, Math.round((day.safe / maxWeekly) * 160));
                const threatHeight = Math.max(4, Math.round((day.threat / maxWeekly) * 160));

                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1 h-40">
                      {/* Safe Bar: Chrome Metallic */}
                      <div
                        style={{ height: `${safeHeight}px` }}
                        className="w-full max-w-[18px] bg-gradient-to-t from-chrome-600 to-chrome-300 rounded-t-md opacity-80 group-hover:opacity-100 transition-all relative"
                        title={`${day.day}: ${day.safe} Safe Scans`}
                      />
                      {/* Threat Bar: Laser Crimson Red */}
                      <div
                        style={{ height: `${threatHeight}px` }}
                        className="w-full max-w-[18px] bg-gradient-to-t from-laser-700 to-laser-500 rounded-t-md opacity-90 group-hover:opacity-100 transition-all shadow-laser-red/10 relative"
                        title={`${day.day}: ${day.threat} Intercepted Threats`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-chrome-500 uppercase">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Risk Distribution Donut & Health Verdict (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Risk Severity Ratio
            </h3>
            <p className="text-[11px] text-chrome-500 font-mono">
              Proportion of scan risk classes
            </p>

            {/* Visual Risk Segment Bar */}
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full bg-obsidian-950 rounded-full overflow-hidden flex p-0.5 border border-chrome-400/20">
                <div
                  style={{ width: `${Math.max(5, safePercent)}%` }}
                  className="bg-chrome-400 rounded-l-full transition-all"
                  title={`Safe: ${safePercent}%`}
                />
                <div
                  style={{ width: `${suspPercent}%` }}
                  className="bg-laser-400 transition-all"
                  title={`Suspicious: ${suspPercent}%`}
                />
                <div
                  style={{ width: `${riskPercent}%` }}
                  className="bg-laser-500 rounded-r-full transition-all shadow-laser-red"
                  title={`Dangerous: ${riskPercent}%`}
                />
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-chrome-400" />
                    <span className="text-chrome-300">Clean / Verified</span>
                  </div>
                  <span className="font-mono font-bold text-chrome-200">{safePercent}%</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-laser-400" />
                    <span className="text-chrome-300">Suspicious Anomaly</span>
                  </div>
                  <span className="font-mono font-bold text-laser-400">{suspPercent}%</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-laser-500" />
                    <span className="text-chrome-300">Critical Danger</span>
                  </div>
                  <span className="font-mono font-bold text-laser-500">{riskPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Health Badge */}
          <div className="p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/15">
            <div className="text-[10px] font-mono uppercase text-laser-500 font-bold tracking-wider mb-1">
              Active Defense Status
            </div>
            <div className="text-xs text-chrome-300">
              Zero sandbox breakout attempts detected. Real-time protection active.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Scans & Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Scans Table (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
                Recent QR Inspections
              </h3>
              <p className="text-[11px] text-chrome-500 font-mono">
                Click any record to inspect forensics in the safe inspection panel
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('scan-history')}
              className="text-xs font-mono text-laser-500 hover:underline flex items-center gap-1"
            >
              <span>View Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-obsidian-700 text-[10px] font-mono uppercase tracking-wider text-chrome-500">
                  <th className="py-2.5 px-3">QR Type & App</th>
                  <th className="py-2.5 px-3">Entity & Destination</th>
                  <th className="py-2.5 px-3">Security Level</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-750 text-xs">
                {stats.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-chrome-500 font-mono">
                      No scans performed yet. Click 'Launch Scanner' to begin.
                    </td>
                  </tr>
                ) : (
                  stats.recentScans.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => onSelectScan(scan)}
                      className="hover:bg-obsidian-750 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white text-xs">{scan.qrAppType || scan.contentType}</div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-obsidian-950 text-chrome-400 border border-chrome-800 mt-0.5 inline-block">
                          {scan.appProvider || scan.contentType}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-medium text-laser-400 text-xs truncate">{scan.entityName || scan.contentType}</div>
                        <div className="text-chrome-400 font-mono text-[10px] truncate mt-0.5">{scan.rawData}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-white text-xs">
                          {scan.securityPercentage ?? Math.max(0, 100 - scan.riskScore)}% SECURE
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          (scan.securityPercentage ?? (100 - scan.riskScore)) >= 70
                            ? 'bg-obsidian-800 text-chrome-300 border border-chrome-500/30'
                            : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40
                            ? 'bg-obsidian-800 text-laser-400 border border-laser-500/50'
                            : 'bg-laser-500/20 text-laser-500 border border-laser-500 shadow-laser-red/10'
                        }`}>
                          {(scan.securityPercentage ?? (100 - scan.riskScore)) >= 70 ? 'SECURED' : (scan.securityPercentage ?? (100 - scan.riskScore)) >= 40 ? 'SUSPICIOUS' : 'UNSECURED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectScan(scan);
                          }}
                          className="px-2 py-1 rounded bg-obsidian-800 border border-chrome-400/20 hover:border-laser-500 text-[11px] text-chrome-300 hover:text-white"
                        >
                          Forensics
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Security Alerts Feed (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Security Operations Feed
            </h3>
            <span className="w-2 h-2 rounded-full bg-laser-500 animate-ping" />
          </div>

          <div className="space-y-3">
            {stats.latestAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-obsidian-950 border border-chrome-400/10 hover:border-chrome-400/25 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    alert.severity === 'high'
                      ? 'bg-laser-500/20 text-laser-500 border border-laser-500/40'
                      : 'bg-obsidian-800 text-chrome-300 border border-chrome-400/30'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-[10px] font-mono text-chrome-500">{alert.time}</span>
                </div>
                <p className="text-xs font-medium text-chrome-300">
                  {alert.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
