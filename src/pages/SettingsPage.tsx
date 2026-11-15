import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Wifi,
  WifiOff,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Terminal,
  Volume2,
  VolumeX,
  Trash2,
  Camera
} from 'lucide-react';
import { api, ApiStatus } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>(api.getStatus());
  const [baseUrlInput, setBaseUrlInput] = useState<string>(apiStatus.baseUrl);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);

  // User preferences
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [autoOpenForensics, setAutoOpenForensics] = useState<boolean>(true);

  useEffect(() => {
    return api.subscribe((status) => {
      setApiStatus(status);
      setBaseUrlInput(status.baseUrl);
    });
  }, []);

  const handleSaveUrl = () => {
    api.setBaseUrl(baseUrlInput);
    handlePingTest();
  };

  const handlePingTest = async () => {
    setIsTesting(true);
    setPingSuccess(null);
    try {
      const isAlive = await api.checkHealth();
      setPingSuccess(isAlive);
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleDemoMode = (active: boolean) => {
    api.setDemoMode(active);
  };

  const handleClearCache = () => {
    if (confirm('Reset local storage cache (history, registered QRs, and configuration)?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-chrome-700/50 text-xs font-mono text-chrome-300 uppercase">
          <Settings className="w-3.5 h-3.5 text-laser-500" />
          <span>Engine System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display">
          System & API Configuration
        </h1>
        <p className="text-xs text-chrome-400">
          Configure REST API endpoints, switch between live Python backend and client-side heuristic engine, and tune inspection preferences.
        </p>
      </div>

      {/* Backend API Connection Panel */}
      <div className="p-6 rounded-2xl glass-panel bg-obsidian-900/90 border border-chrome-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-chrome-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              apiStatus.isLive && !apiStatus.isDemoMode
                ? 'bg-chrome-950 text-chrome-200 border-chrome-700/60'
                : 'bg-laser-950/20 text-laser-400 border-laser-500/40'
            }`}>
              {apiStatus.isLive && !apiStatus.isDemoMode ? <Wifi className="w-5 h-5 text-chrome-300" /> : <WifiOff className="w-5 h-5 text-laser-400" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-display">
                Python REST API Gateway
              </h3>
              <p className="text-xs text-chrome-400 font-mono">
                Status:{' '}
                <span className={apiStatus.isLive && !apiStatus.isDemoMode ? 'text-chrome-200 font-bold' : 'text-laser-400 font-bold'}>
                  {apiStatus.isLive && !apiStatus.isDemoMode ? 'LIVE BACKEND CONNECTED' : 'DEMO MODE (LOCAL HEURISTIC ENGINE ACTIVE)'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePingTest}
              disabled={isTesting}
              className="px-3.5 py-1.5 rounded-xl bg-obsidian-950 hover:bg-obsidian-900 border border-chrome-700 text-xs font-mono text-chrome-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-laser-500' : 'text-chrome-400'}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* API Base URL Setting */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-mono text-chrome-300">
            Backend API Base URL (VITE_API_BASE_URL)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              placeholder="http://localhost:5000"
              className="flex-1 px-4 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
            />
            <button
              onClick={handleSaveUrl}
              className="px-5 py-2.5 rounded-xl bg-laser-600 hover:bg-laser-500 text-white text-xs font-bold shadow-laser-red transition-all"
            >
              Save URL & Ping
            </button>
          </div>
          {pingSuccess === true && (
            <div className="text-[11px] font-mono text-chrome-300 flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-chrome-400" />
              <span>Successfully reached {apiStatus.baseUrl}/api/health!</span>
            </div>
          )}
          {pingSuccess === false && (
            <div className="text-[11px] font-mono text-laser-400 flex items-center gap-1 pt-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Could not reach backend server at {apiStatus.baseUrl}. Local Heuristic Engine is handling security analyses.</span>
            </div>
          )}
        </div>

        {/* Explicit Demo Mode Toggle */}
        <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-laser-500" />
              <span>Force Explicit Demo Mode (Local Security Engine)</span>
            </div>
            <p className="text-[11px] text-chrome-400 mt-0.5">
              When enabled, QRShield executes high-precision client-side heuristic inspection without requiring an active Python server.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={apiStatus.isDemoMode}
              onChange={(e) => handleToggleDemoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-obsidian-900 border border-chrome-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-chrome-200 after:border-chrome-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-laser-600 peer-checked:border-laser-500"></div>
          </label>
        </div>

        {/* Instructions to Run Backend */}
        <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-800 text-xs font-mono space-y-2 text-left">
          <div className="flex items-center gap-2 text-chrome-200 font-bold">
            <Terminal className="w-4 h-4 text-laser-500" />
            <span>How to launch the Python REST API:</span>
          </div>
          <div className="p-2.5 rounded-lg bg-obsidian-900 text-chrome-200 select-all border border-chrome-800">
            python backend/app.py
          </div>
          <p className="text-[11px] text-chrome-400">
            Runs the Flask security inspection server on <code className="text-laser-400">http://localhost:5000</code>.
          </p>
        </div>
      </div>

      {/* General Inspection Preferences */}
      <div className="p-6 rounded-2xl glass-panel bg-obsidian-900/90 border border-chrome-800/80 space-y-4 text-left">
        <h3 className="text-sm font-bold text-white tracking-wide font-display">
          Scanning & Audio Preferences
        </h3>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-850 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">
                Auto-Trigger Safe Inspection Panel on Scan
              </div>
              <div className="text-[11px] text-chrome-400">
                Immediately launches sandbox forensics when a QR code is recognized.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoOpenForensics}
              onChange={(e) => setAutoOpenForensics(e.target.checked)}
              className="w-4 h-4 accent-laser-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-850 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">
                Audio Tone Feedback on Decoded Asset
              </div>
              <div className="text-[11px] text-chrome-400">
                Plays a subtle high-frequency chime when QR decoding succeeds.
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioFeedback}
              onChange={(e) => setAudioFeedback(e.target.checked)}
              className="w-4 h-4 accent-laser-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone: Cache Reset */}
      <div className="p-6 rounded-2xl bg-laser-950/20 border border-laser-500/40 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-laser-300 font-display">
            Reset All Forensic Storage
          </h3>
          <p className="text-xs text-chrome-400 mt-0.5">
            Clears registered QR entries, history records, and custom API settings from browser storage.
          </p>
        </div>

        <button
          onClick={handleClearCache}
          className="px-4 py-2 rounded-xl bg-laser-950/40 hover:bg-laser-900/60 border border-laser-500/60 text-xs font-mono text-laser-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset All Data</span>
        </button>
      </div>
    </div>
  );
};
