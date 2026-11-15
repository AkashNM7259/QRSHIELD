import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers
} from 'lucide-react';
import { HolographicShield3D } from '../components/HolographicShield3D';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('analyst@qrshield.io');
  const [password, setPassword] = useState<string>('qrshield123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      setErrorMessage('Please enter your full name to create an analyst account.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const res = await api.register(name.trim(), email.trim(), password.trim());
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMessage(res.error || 'Failed to create account.');
        }
      } else {
        const res = await api.login(email.trim(), password.trim());
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMessage(res.error || 'Invalid credentials.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.login('analyst@qrshield.io', 'qrshield123');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch {
      const fallbackUser: AuthUser = {
        name: 'Lead Security Analyst',
        email: 'analyst@qrshield.io',
        role: 'Lead Security Analyst',
        clearance: 'Level 3 - Threat Forensics',
        token: `qrs-demo-${Date.now()}`
      };
      localStorage.setItem('qrshield_auth_user', JSON.stringify(fallbackUser));
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-obsidian-950 text-chrome-200 flex flex-col justify-between cyber-grid selection:bg-laser-600/30 selection:text-laser-400 relative overflow-hidden">
      {/* Background Cyber Glow Orbs */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-laser-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-10 w-[400px] h-[400px] bg-laser-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-chrome-800/40 bg-obsidian-900/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chrome-200 via-chrome-500 to-obsidian-800 p-0.5 shadow-chrome-edge">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-laser-500 drop-shadow-[0_0_8px_rgba(255,0,51,0.6)]" />
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold tracking-wider text-chrome-100 font-display">
              QR<span className="text-laser-500 text-glow-laser">SHIELD</span>
            </div>
            <p className="text-[10px] text-chrome-500 font-mono tracking-tight">
              AI-Powered QR Threat Detection System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-laser-500 animate-ping" />
          <span className="text-xs font-mono text-chrome-400">
            PORTAL SECURITY PROTOCOL ACTIVE
          </span>
        </div>
      </header>

      {/* Central Login Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md bg-obsidian-900/90 border border-chrome-400/25 rounded-3xl p-6 sm:p-8 shadow-obsidian-glass backdrop-blur-2xl space-y-6">
          {/* Logo & 3D Shield Emblem */}
          <div className="text-center space-y-2">
            <div className="relative inline-block mx-auto mb-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-obsidian-800 via-chrome-600 to-laser-500 p-0.5 shadow-laser-red/20 flex items-center justify-center">
                <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center">
                  <Shield className="w-8 h-8 text-laser-500 drop-shadow-[0_0_12px_rgba(255,0,51,0.8)]" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Security Access Portal
            </h1>
            <p className="text-xs text-chrome-400">
              Scan Smart. Detect Threats. Stay Protected.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-obsidian-950 rounded-xl border border-chrome-800">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
                !isRegisterMode
                  ? 'bg-laser-500 text-white shadow-laser-red'
                  : 'text-chrome-400 hover:text-white'
              }`}
            >
              Operator Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
                isRegisterMode
                  ? 'bg-laser-500 text-white shadow-laser-red'
                  : 'text-chrome-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-laser-950/60 border border-laser-500/70 text-laser-300 text-xs flex items-start gap-2 shadow-laser-red/10 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-laser-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-chrome-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Akash Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider">
                Email / Operator ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-chrome-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@qrshield.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider">
                  Security Passcode
                </label>
                {!isRegisterMode && (
                  <span className="text-[10px] text-chrome-500 hover:text-laser-400 cursor-pointer font-mono transition-colors">
                    Default: qrshield123
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-chrome-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-chrome-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-chrome-400 hover:text-chrome-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-laser-600 rounded bg-obsidian-950 border-chrome-800"
                />
                <span>Remember session</span>
              </label>

              <span className="text-[11px] font-mono text-laser-500 hover:underline cursor-pointer">
                TLS Encrypted
              </span>
            </div>

            {/* Primary Action Button: Laser Crimson Red */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isRegisterMode ? 'Create Analyst Account' : 'Authenticate & Enter Console'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-2 border-t border-chrome-800/60 space-y-3">
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 border border-chrome-400/30 hover:border-laser-500 text-chrome-200 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-all group"
            >
              <Zap className="w-3.5 h-3.5 text-laser-500 group-hover:animate-pulse" />
              <span>One-Click Analyst Access (Quick Demo)</span>
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-chrome-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-chrome-400" /> Zero Leaks
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-chrome-400" /> NPCI Verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-laser-500" /> SHA-256 Anchored
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs font-mono text-chrome-600 border-t border-chrome-800/30 bg-obsidian-900/40 relative z-10">
        QRShield Forensic Command Center • Obsidian Black × Chrome Silver × Laser Crimson Red
      </footer>
    </div>
  );
};

