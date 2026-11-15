import React from 'react';
import {
  Shield,
  ShieldCheck,
  QrCode,
  GlobeLock,
  CreditCard,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { HolographicShield3D } from '../components/HolographicShield3D';

interface HeroLandingPageProps {
  onScanClick: () => void;
  onExploreFeatures: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HeroLandingPage: React.FC<HeroLandingPageProps> = ({
  onScanClick,
  onExploreFeatures,
  onNavigateTab
}) => {
  return (
    <div className="relative overflow-hidden space-y-16 lg:space-y-24 py-4">
      {/* Background Subtle Laser Crimson Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[550px] h-[320px] bg-laser-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-[280px] h-[280px] bg-laser-500/8 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* 3D HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-850 border border-chrome-400/30 shadow-chrome-edge">
              <span className="w-2 h-2 rounded-full bg-laser-500 animate-ping" />
              <span className="text-xs font-mono font-semibold text-chrome-200 tracking-wider uppercase">
                AI Threat Intelligence Engine Armed
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] font-display">
              Your QR. <br />
              <span className="text-metallic-chrome text-glow-chrome">
                Your Security.
              </span> <br />
              <span className="text-laser-500 text-glow-laser">Our Intelligence.</span>
            </h1>

            <p className="text-base sm:text-lg text-chrome-400 max-w-2xl leading-relaxed font-light">
              Scan any QR code. Discover hidden threats. Protect your digital identity and payments with real-time heuristic forensics, anti-tamper destination checks, and automated UPI payment verification.
            </p>

            {/* CTA Buttons (Primary: Laser Crimson, Secondary: Chrome Outline) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onScanClick}
                className="px-7 py-3.5 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-sm shadow-laser-red flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <QrCode className="w-5 h-5 text-white" />
                <span>Scan QR Code Now</span>
              </button>

              <button
                onClick={onExploreFeatures}
                className="px-6 py-3.5 rounded-xl bg-obsidian-800/90 hover:bg-obsidian-750 border border-chrome-400/40 hover:border-chrome-100 text-chrome-200 font-semibold text-sm transition-all flex items-center gap-2 group"
              >
                <span>Explore Security Features</span>
                <ArrowRight className="w-4 h-4 text-laser-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Quick Metrics Ribbon (Futuristic Automotive Dashboard Style) */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-chrome-400/15 max-w-lg">
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-chrome-100">99.8%</div>
                <div className="text-[11px] text-chrome-500 font-mono mt-0.5">Phishing Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-laser-500">&lt; 42ms</div>
                <div className="text-[11px] text-chrome-500 font-mono mt-0.5">Forensic Latency</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-chrome-300">0 PIN</div>
                <div className="text-[11px] text-chrome-500 font-mono mt-0.5">Zero Leakage Risk</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Chrome Shield Visual with Central Laser QR */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative">
              <HolographicShield3D riskLevel="SAFE" interactive={true} size="lg" />

              {/* Holographic Security Overlay Badges */}
              <div className="absolute -bottom-2 -left-4 sm:left-2 p-3 rounded-xl bg-obsidian-850/90 backdrop-blur-md border border-chrome-400/30 shadow-obsidian-glass flex items-center gap-3 animate-float">
                <div className="w-9 h-9 rounded-lg bg-obsidian-950 border border-chrome-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-chrome-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-chrome-200">Anti-Tamper Vault</div>
                  <div className="text-[10px] text-laser-500 font-mono">Registry Verified</div>
                </div>
              </div>

              <div className="absolute -top-4 -right-2 sm:right-0 p-3 rounded-xl bg-obsidian-850/90 backdrop-blur-md border border-laser-500/35 shadow-laser-red/10 flex items-center gap-3 animate-float [animation-delay:2s]">
                <div className="w-9 h-9 rounded-lg bg-laser-500/15 border border-laser-500/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-laser-500" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-chrome-200">Neural Heuristics</div>
                  <div className="text-[10px] text-chrome-400 font-mono">Deep URL Filter</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono font-bold text-laser-500 tracking-widest uppercase">
            Defense Operations Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display">
            Comprehensive Defense Against Next-Gen QR Attacks
          </h2>
          <p className="text-sm text-chrome-400">
            From deceptive phishing redirection to physical QR sticker counter swapping, QRShield inspects payloads prior to execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: URL Analysis */}
          <div
            onClick={() => onNavigateTab('url-analysis')}
            className="p-6 rounded-2xl glass-card cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-obsidian-950 border border-chrome-400/25 flex items-center justify-center text-chrome-300 mb-4 group-hover:border-laser-500 group-hover:text-laser-500 transition-colors">
              <GlobeLock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-chrome-100 mb-2 group-hover:text-laser-500 transition-colors">
              URL Threat Intelligence
            </h3>
            <p className="text-xs text-chrome-400 leading-relaxed mb-4">
              Dissects domain reputation, punycode spoofing, IP hosting, unencrypted HTTP links, and redirects behind shorteners.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-chrome-300 group-hover:text-laser-500 transition-colors">
              <span>Inspect URL</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: UPI Security */}
          <div
            onClick={() => onNavigateTab('upi-security')}
            className="p-6 rounded-2xl glass-card cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-obsidian-950 border border-chrome-400/25 flex items-center justify-center text-chrome-300 mb-4 group-hover:border-laser-500 group-hover:text-laser-500 transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-chrome-100 mb-2 group-hover:text-laser-500 transition-colors">
              UPI Payment Protection
            </h3>
            <p className="text-xs text-chrome-400 leading-relaxed mb-4">
              Detects payee name vs VPA identity mismatches, unverified handles, and preset fraudulent collect amounts.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-chrome-300 group-hover:text-laser-500 transition-colors">
              <span>Inspect UPI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Tamper Verification */}
          <div
            onClick={() => onNavigateTab('qr-verification')}
            className="p-6 rounded-2xl glass-card cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-obsidian-950 border border-chrome-400/25 flex items-center justify-center text-chrome-300 mb-4 group-hover:border-laser-500 group-hover:text-laser-500 transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-chrome-100 mb-2 group-hover:text-laser-500 transition-colors">
              Sticker Tamper Defense
            </h3>
            <p className="text-xs text-chrome-400 leading-relaxed mb-4">
              Authenticates scanned payload destinations against the cryptographic merchant registry to detect counter sticker swaps.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-chrome-300 group-hover:text-laser-500 transition-colors">
              <span>Verify Tamper</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Reports */}
          <div
            onClick={() => onNavigateTab('security-reports')}
            className="p-6 rounded-2xl glass-card cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-obsidian-950 border border-chrome-400/25 flex items-center justify-center text-chrome-300 mb-4 group-hover:border-laser-500 group-hover:text-laser-500 transition-colors">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-chrome-100 mb-2 group-hover:text-laser-500 transition-colors">
              Forensic Audit Reports
            </h3>
            <p className="text-xs text-chrome-400 leading-relaxed mb-4">
              Instant generation of verifiable PDF security audit reports detailing risk scores, technical IOCs, and remediation steps.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-chrome-300 group-hover:text-laser-500 transition-colors">
              <span>View Reports</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* INSPECTION WORKFLOW SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <div className="p-8 rounded-3xl glass-panel relative overflow-hidden border border-chrome-400/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-mono text-laser-500 uppercase font-bold tracking-wider">
                Inspection Protocol
              </span>
              <h3 className="text-2xl font-bold text-white font-display">
                Zero-Trust Sandboxed QR Ingestion
              </h3>
              <p className="text-xs text-chrome-400 leading-relaxed">
                Standard scanners automatically launch browser URLs or payment apps. QRShield intercepts the raw payload, applies sandbox sanitization, and prevents automatic execution.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-obsidian-900 border border-chrome-400/15">
                <div className="text-chrome-300 font-mono text-xs font-bold mb-1">01 / CAPTURE</div>
                <div className="text-sm font-semibold text-chrome-100 mb-1">Raw Payload Decode</div>
                <div className="text-[11px] text-chrome-500">High-speed client WebRTC or image parsing without auto-redirect.</div>
              </div>

              <div className="p-4 rounded-xl bg-obsidian-900 border border-chrome-400/15">
                <div className="text-laser-500 font-mono text-xs font-bold mb-1">02 / DEEP ANALYZE</div>
                <div className="text-sm font-semibold text-chrome-100 mb-1">Heuristic Engine</div>
                <div className="text-[11px] text-chrome-500">Scores domain reputation, VPA matches, and registry hashes.</div>
              </div>

              <div className="p-4 rounded-xl bg-obsidian-900 border border-chrome-400/15">
                <div className="text-chrome-300 font-mono text-xs font-bold mb-1">03 / VERDICT</div>
                <div className="text-sm font-semibold text-chrome-100 mb-1">Safe Inspection</div>
                <div className="text-[11px] text-chrome-500">3D risk shield, actionable safety advice, and PDF audit download.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
