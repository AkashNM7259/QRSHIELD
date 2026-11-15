import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  GlobeLock,
  CreditCard,
  History
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'url-analysis', label: 'URL', icon: GlobeLock },
    { id: 'scanner', label: 'Scan', icon: QrCode, isPrimary: true },
    { id: 'upi-security', label: 'UPI', icon: CreditCard },
    { id: 'scan-history', label: 'History', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian-950/95 backdrop-blur-2xl border-t border-chrome-400/15 px-2 py-2 lg:hidden flex items-center justify-around shadow-obsidian-glass">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        if (t.isPrimary) {
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="relative -top-5 flex flex-col items-center group focus:outline-none"
            >
              <div className="w-14 h-14 rounded-full bg-laser-500 p-0.5 shadow-laser-red flex items-center justify-center transform active:scale-95 transition-transform">
                <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center">
                  <Icon className="w-7 h-7 text-laser-500 drop-shadow-[0_0_8px_rgba(255,0,51,0.6)]" />
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-laser-500 mt-1">
                {t.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              isActive ? 'text-laser-500 font-semibold' : 'text-chrome-500 hover:text-chrome-300'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-mono">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
