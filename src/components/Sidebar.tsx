import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  GlobeLock,
  CreditCard,
  ShieldAlert,
  FolderLock,
  History,
  FileText,
  Settings,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'hero', label: '3D Overview', icon: Sparkles },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Smart QR Scanner', icon: QrCode, highlight: true },
    { id: 'url-analysis', label: 'URL Security Analysis', icon: GlobeLock },
    { id: 'upi-security', label: 'UPI Payment Security', icon: CreditCard },
    { id: 'qr-verification', label: 'QR Tamper Verification', icon: ShieldAlert },
    { id: 'registered-qrs', label: 'Registered QR Codes', icon: FolderLock },
    { id: 'scan-history', label: 'Scan History', icon: History },
    { id: 'security-reports', label: 'Security Reports', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 lg:w-72 bg-obsidian-950/95 lg:bg-obsidian-900/80 backdrop-blur-2xl border-r border-chrome-400/15 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding in Sidebar */}
        <div className="p-5 border-b border-chrome-400/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-chrome-200 via-chrome-500 to-obsidian-800 p-0.5 shadow-chrome-edge">
              <div className="w-full h-full bg-obsidian-950 rounded-[6px] flex items-center justify-center font-bold text-laser-500 font-display text-xs">
                QS
              </div>
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wider text-chrome-100 font-display">QRSHIELD CONSOLE</h2>
              <p className="text-[10px] text-chrome-500 font-mono">Cybersecurity Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-chrome-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-chrome-500">
            Navigation Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-laser-500/20 to-transparent text-white border-l-2 border-laser-500 shadow-[inset_0_0_12px_rgba(255,0,51,0.15)]'
                    : 'text-chrome-400 hover:text-white hover:bg-obsidian-800/80 border-l-2 border-transparent'
                } ${item.highlight && !isActive ? 'border border-laser-500/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-laser-500' : 'text-chrome-500 group-hover:text-chrome-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-laser-500" />}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
