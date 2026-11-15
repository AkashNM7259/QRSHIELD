import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskGaugeProps {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, riskLevel, size = 'md' }) => {
  const radius = size === 'sm' ? 36 : size === 'lg' ? 68 : 50;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Strict 3-color scheme: Safe = Muted Silver, Suspicious = Crimson Outline, Dangerous = Strong Laser-Red
  const getColor = () => {
    switch (riskLevel) {
      case 'HIGH_RISK':
        return {
          stroke: '#FF0033',
          bg: 'bg-laser-500/15',
          text: 'text-laser-500',
          border: 'border-laser-500 shadow-laser-red',
          label: 'CRITICAL DANGER'
        };
      case 'SUSPICIOUS':
        return {
          stroke: '#FF0033',
          bg: 'bg-obsidian-800',
          text: 'text-laser-400',
          border: 'border-laser-500/60 shadow-[0_0_15px_rgba(255,0,51,0.2)]',
          label: 'SUSPICIOUS'
        };
      case 'SAFE':
      default:
        return {
          stroke: '#A3A3A3',
          bg: 'bg-obsidian-800',
          text: 'text-chrome-400',
          border: 'border-chrome-500/40 shadow-chrome-edge',
          label: 'VERIFIED SAFE'
        };
    }
  };

  const c = getColor();
  const dimension = radius * 2 + strokeWidth * 2 + 10;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
        <svg
          className="transform -rotate-90"
          width={dimension}
          height={dimension}
        >
          {/* Background circle track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="rgba(192, 192, 192, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score indicator */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={c.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-extrabold ${size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl'} ${c.text}`}>
            {score}
          </span>
          <span className="text-[10px] font-mono text-chrome-500 uppercase tracking-widest">
            / 100
          </span>
        </div>
      </div>

      {/* Risk Category Pill */}
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border} flex items-center gap-1.5`}>
        {riskLevel === 'SAFE' && <ShieldCheck className="w-3.5 h-3.5 text-chrome-400" />}
        {riskLevel === 'SUSPICIOUS' && <AlertTriangle className="w-3.5 h-3.5 text-laser-400" />}
        {riskLevel === 'HIGH_RISK' && <ShieldAlert className="w-3.5 h-3.5 text-laser-500 animate-pulse" />}
        <span>{c.label}</span>
      </div>
    </div>
  );
};
