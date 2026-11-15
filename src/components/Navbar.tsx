import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Wifi,
  Cpu,
  Menu,
  LogOut,
  UserCheck
} from 'lucide-react';
import { api, ApiStatus } from '../services/api';
import { AuthUser } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeTab,
  setActiveTab,
  authUser,
  onLogout
}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>(api.getStatus());

  useEffect(() => {
    return api.subscribe((status) => setApiStatus(status));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-obsidian-900/90 backdrop-blur-xl border-b border-chrome-400/15 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-obsidian-800 border border-chrome-400/20 text-chrome-300 hover:text-white hover:border-laser-500 transition-colors lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveTab('hero')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-chrome-200 via-chrome-500 to-obsidian-800 p-0.5 shadow-chrome-edge group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-obsidian-900 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-laser-500 drop-shadow-[0_0_8px_rgba(255,0,51,0.6)]" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-chrome-100 font-display">
                QR<span className="text-laser-500 text-glow-laser">SHIELD</span>
              </span>
            </div>
            <span className="text-[10px] text-chrome-500 tracking-tight hidden sm:inline font-mono">
              AI-Powered QR Fraud Detection System
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Engine Status & Primary Scan Action */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Backend Status Indicator */}
        <div
          onClick={() => setActiveTab('settings')}
          className={`cursor-pointer px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
            apiStatus.isLive && !apiStatus.isDemoMode
              ? 'bg-obsidian-800 text-chrome-200 border-chrome-400/40 shadow-chrome-edge'
              : 'bg-obsidian-850 text-laser-400 border-laser-500/40 hover:border-laser-500 shadow-laser-red/10'
          }`}
          title={apiStatus.isLive ? 'Connected to Python REST API (port 5000)' : 'Local Heuristic Engine Active. Click to configure.'}
        >
          {apiStatus.isLive && !apiStatus.isDemoMode ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-chrome-200" />
              <span className="hidden md:inline">API CONNECTED</span>
              <span className="md:hidden">LIVE</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-laser-500 animate-pulse" />
              <span className="hidden md:inline">LOCAL SECURITY ENGINE</span>
              <span className="md:hidden">LOCAL</span>
            </>
          )}
        </div>

        {/* Primary Action Button: Laser Crimson Red */}
        <button
          onClick={() => setActiveTab('scanner')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-laser-500 hover:bg-laser-600 text-white text-xs font-bold shadow-laser-red transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>Scan QR Code</span>
        </button>

        {/* Authenticated Operator Profile & Logout */}
        {authUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-chrome-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {authUser.name}
              </span>
              <span className="text-[10px] font-mono text-laser-400 leading-tight">
                {authUser.role || 'Security Analyst'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-laser-950/60 border border-chrome-700/60 hover:border-laser-500 text-chrome-300 hover:text-laser-400 transition-colors"
              title="Log Out of Security Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
