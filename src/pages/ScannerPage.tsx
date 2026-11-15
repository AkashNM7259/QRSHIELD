import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Keyboard,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  VideoOff,
  FileImage,
  Zap,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  Eye,
  Lock
} from 'lucide-react';
import jsQR from 'jsqr';
import { api } from '../services/api';
import { ScanResult } from '../types';

interface ScannerPageProps {
  onScanComplete: (result: ScanResult) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onScanComplete }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFacingMode, setSelectedFacingMode] = useState<'environment' | 'user'>('environment');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API (getUserMedia) is not supported by your current browser.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: selectedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access permission was denied. Please allow camera permissions in your browser or use the image upload option.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera sensor was detected on this device. Please upload a QR image instead.');
      } else {
        setCameraError(`Camera initialization failed: ${err.message || 'Unknown device error'}`);
      }
      setIsScanning(false);
    }
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          stopCamera();
          handleScannedData(code.data);
          return;
        }
      }
    }

    if (isScanning || streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(tickScan);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, selectedFacingMode]);

  const handleScannedData = async (rawData: string) => {
    setIsProcessing(true);
    try {
      const result = await api.scanQR(rawData);
      setLatestScan(result);
      onScanComplete(result);
    } catch (err) {
      console.error('Scan processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImagePreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleScannedData(code.data);
          } else {
            alert('No valid QR code could be decoded from this image. Please verify resolution and contrast.');
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const testPayloads = [
    {
      title: 'Google Pay (GPay) Official Stand',
      desc: 'Authentic store counter GPay QR (@okhdfcbank)',
      payload: 'upi://pay?pa=starbucks.bandra@okhdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR&am=280.00',
      badge: '98% Secure'
    },
    {
      title: 'PhonePe Merchant Payment Stand',
      desc: 'Official retail counter PhonePe QR (@ybl handle)',
      payload: 'upi://pay?pa=starbucks.bandra@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR&am=350.00',
      badge: '98% Secure'
    },
    {
      title: 'Paytm Soundbox Merchant Stand',
      desc: 'Authentic retail billing QR on Paytm (@paytm)',
      payload: 'upi://pay?pa=decathlon.sports@paytm&pn=Decathlon%20Sports&mc=5941&cu=INR&am=1299.00',
      badge: '95% Secure'
    },
    {
      title: 'Google Official Portal (Website QR)',
      desc: 'Clean global web portal with valid TLS encryption',
      payload: 'https://www.google.com',
      badge: '98% Secure'
    },
    {
      title: 'PhonePe Fake Sticker Replacement Attack',
      desc: 'Fraudulent overlay sticker stealing money to unverified personal VPA',
      payload: 'upi://pay?pa=fake.hacker@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR',
      badge: '5% Unsecured'
    },
    {
      title: 'Banking Credential Phishing IP Website',
      desc: 'Unencrypted direct IP connection mimicking State Bank KYC',
      payload: 'http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89',
      badge: '4% Unsecured'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-chrome-400/30 text-xs font-mono text-laser-500 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Zero-Execution Sandbox Ingestion
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-chrome-100 font-display">
          Smart QR Security Scanner
        </h1>
        <p className="text-xs text-chrome-400">
          Capture live QR codes, upload images, or test payload vectors. Scanned destinations are isolated and inspected before execution.
        </p>
      </div>

      {/* Mode Selector Tabs (Obsidian with Laser Crimson active state) */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-obsidian-950 border border-chrome-400/20 flex gap-1 shadow-obsidian-glass">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-laser-500 text-white shadow-laser-red'
                : 'text-chrome-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-laser-500 text-white shadow-laser-red'
                : 'text-chrome-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-laser-500 text-white shadow-laser-red'
                : 'text-chrome-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Manual Payload</span>
          </button>
        </div>
      </div>

      {/* Scanning Viewports */}
      <div className="relative rounded-3xl glass-panel p-4 sm:p-8 overflow-hidden min-h-[420px] flex flex-col items-center justify-center border border-chrome-400/25 shadow-obsidian-glass">
        <canvas ref={canvasRef} className="hidden" />

        {/* 1. Camera Viewport with Animated Laser Crimson Scanning Line */}
        {activeTab === 'camera' && (
          <div className="w-full max-w-md flex flex-col items-center space-y-4">
            {cameraError ? (
              <div className="p-6 rounded-2xl bg-obsidian-850 border border-laser-500/40 text-center space-y-3 max-w-sm">
                <VideoOff className="w-10 h-10 text-laser-500 mx-auto" />
                <h3 className="text-sm font-bold text-chrome-100">Camera Unavailable</h3>
                <p className="text-xs text-chrome-400">{cameraError}</p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-chrome-400/30 text-xs font-semibold text-white"
                  >
                    Retry Permission
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="text-xs text-laser-500 hover:underline font-mono"
                  >
                    Switch to Image Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden bg-obsidian-950 border-2 border-chrome-400/40 shadow-laser-red/10 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Cyber Reticle Corners: Laser Crimson Red */}
                <div className="absolute inset-6 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-laser-500 shadow-laser-red" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-laser-500 shadow-laser-red" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-laser-500 shadow-laser-red" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-laser-500 shadow-laser-red" />

                  {/* Laser Crimson Scanning Line */}
                  <div className="scanning-laser" />
                </div>

                {/* Subtitle Status */}
                <div className="absolute bottom-3 px-3 py-1 rounded-full bg-obsidian-950/90 backdrop-blur-sm border border-laser-500/40 text-[10px] font-mono text-chrome-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-laser-500 animate-ping" />
                  <span>Align QR Code Within Reticle</span>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            {!cameraError && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() =>
                    setSelectedFacingMode(selectedFacingMode === 'environment' ? 'user' : 'environment')
                  }
                  className="px-3 py-1.5 rounded-xl bg-obsidian-800 border border-chrome-400/30 hover:border-chrome-100 text-xs font-mono text-chrome-300 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-laser-500" />
                  <span>Switch Lens ({selectedFacingMode === 'environment' ? 'Rear' : 'Front'})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Image Upload Viewport */}
        {activeTab === 'upload' && (
          <div className="w-full max-w-lg space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('qr-file-input')?.click()}
              className="p-8 border-2 border-dashed border-chrome-400/30 hover:border-laser-500 rounded-2xl bg-obsidian-950/60 hover:bg-obsidian-900 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 text-center"
            >
              <input
                id="qr-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-obsidian-800 border border-chrome-400/30 flex items-center justify-center text-chrome-300">
                <FileImage className="w-6 h-6 text-laser-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-chrome-100">
                  Drag & drop QR image, or <span className="text-laser-500 underline">browse files</span>
                </h4>
                <p className="text-xs text-chrome-500 mt-1">
                  Supports PNG, JPG, WEBP, high resolution screenshot photos
                </p>
              </div>
            </div>

            {uploadedImagePreview && (
              <div className="p-3 rounded-xl bg-obsidian-900 border border-chrome-400/20 flex items-center gap-3">
                <img
                  src={uploadedImagePreview}
                  alt="QR Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-chrome-400/30"
                />
                <div className="flex-1 text-left">
                  <div className="text-xs font-semibold text-chrome-200">Image Loaded</div>
                  <div className="text-[10px] text-laser-500 font-mono">Analyzing payload...</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Manual String Input Viewport */}
        {activeTab === 'manual' && (
          <div className="w-full max-w-lg space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-chrome-300 uppercase tracking-wider">
                Raw Decoded QR String or URL
              </label>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. upi://pay?pa=merchant@okaxis&pn=Store... or https://..."
                rows={3}
                className="w-full p-3.5 rounded-xl bg-obsidian-950 border border-chrome-400/25 text-white font-mono text-xs focus:outline-none focus:border-laser-500 transition-colors"
              />
            </div>

            {/* Primary Action Button: Laser Crimson Red */}
            <button
              onClick={() => {
                if (manualInput.trim()) {
                  handleScannedData(manualInput.trim());
                }
              }}
              disabled={!manualInput.trim() || isProcessing}
              className="w-full py-3 rounded-xl bg-laser-500 hover:bg-laser-600 text-white font-bold text-xs shadow-laser-red flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>{isProcessing ? 'Analyzing Payload...' : 'Analyze Manually'}</span>
            </button>
          </div>
        )}
      </div>

      {/* LATEST DECODED QR CODE IDENTITY & DETAILED INFORMATION PANEL */}
      {latestScan && (
        <div className="p-6 rounded-2xl bg-obsidian-900 border border-laser-500/40 shadow-laser-red/10 space-y-5 animate-in fade-in slide-in-from-top-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-chrome-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-obsidian-950 border border-chrome-700/60">
                <QrCode className="w-5 h-5 text-laser-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">
                    Decoded QR Code Identity & Specifications
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-chrome-950 text-chrome-300 border border-chrome-700/60">
                    {latestScan.categoryDescription || latestScan.contentType}
                  </span>
                </div>
                <p className="text-xs text-chrome-400 font-mono">
                  Asset ID: {latestScan.id} • Scanned at {new Date(latestScan.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 ${
                latestScan.riskLevel === 'SAFE'
                  ? 'bg-chrome-950 text-chrome-300 border border-chrome-700/60'
                  : latestScan.riskLevel === 'SUSPICIOUS'
                  ? 'bg-laser-950/30 text-laser-400 border border-laser-500/60'
                  : 'bg-laser-950/60 text-laser-300 border border-laser-500 shadow-laser-red/30'
              }`}>
                {latestScan.riskLevel === 'SAFE' && <ShieldCheck className="w-3.5 h-3.5 text-chrome-400" />}
                {latestScan.riskLevel === 'SUSPICIOUS' && <ShieldAlert className="w-3.5 h-3.5 text-laser-400" />}
                {latestScan.riskLevel === 'HIGH_RISK' && <ShieldAlert className="w-3.5 h-3.5 text-laser-500" />}
                <span>{latestScan.securityPercentage ?? Math.max(0, 100 - latestScan.riskScore)}% SECURE</span>
              </span>

              <button
                onClick={() => onScanComplete(latestScan)}
                className="px-3.5 py-1.5 rounded-xl bg-laser-600 hover:bg-laser-500 text-white font-bold text-xs shadow-laser-red flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Deep Forensics</span>
              </button>
            </div>
          </div>

          {/* USER-REQUESTED HIGHLIGHT: WHAT TYPE OF QR CODE IT IS & SECURITY PERCENTAGE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border border-laser-500/50 shadow-laser-red/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-laser-500 animate-ping" />
                  Identified QR Code Type & Ecosystem
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-display">
                  {latestScan.qrAppType || (latestScan.contentType === 'UPI' ? 'UPI Payment QR' : latestScan.contentType === 'URL' ? 'Website URL QR' : 'Decoded QR Asset')}
                </div>
                <div className="text-xs text-chrome-300 font-mono">
                  App Platform: <strong className="text-white">{latestScan.appProvider || latestScan.contentType}</strong> • Recipient / Entity: <strong className="text-laser-400">{latestScan.entityName || latestScan.contentType}</strong>
                </div>
              </div>

              {/* SECURITY PERCENTAGE BADGE */}
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-widest">
                  Security Protection Level
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-2xl sm:text-3xl font-black font-mono ${
                    (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 70
                      ? 'text-white'
                      : (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 40
                      ? 'text-laser-400'
                      : 'text-laser-500'
                  }`}>
                    {latestScan.securityPercentage ?? Math.max(0, 100 - latestScan.riskScore)}%
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                    (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 70
                      ? 'bg-chrome-950 text-chrome-200 border border-chrome-700'
                      : (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 40
                      ? 'bg-laser-950/40 text-laser-300 border border-laser-500/60'
                      : 'bg-laser-950 text-laser-400 border border-laser-500 animate-pulse'
                  }`}>
                    {(latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 70 ? '✓ SECURED' : (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 40 ? '⚠️ SUSPICIOUS' : '🚨 UNSECURED / DANGEROUS'}
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL PERCENTAGE PROGRESS BAR */}
            <div className="space-y-1.5">
              <div className="w-full bg-obsidian-950 rounded-full h-3 border border-chrome-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 70
                      ? 'bg-gradient-to-r from-chrome-500 to-white shadow-chrome-edge'
                      : (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 40
                      ? 'bg-gradient-to-r from-laser-800 to-laser-500'
                      : 'bg-laser-500 shadow-laser-red'
                  }`}
                  style={{ width: `${Math.max(5, latestScan.securityPercentage ?? (100 - latestScan.riskScore))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-chrome-400">
                <span>0% Malicious</span>
                <span className="font-bold text-white">
                  {(latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 70
                    ? '✓ SAFE: Verified secure to scan & proceed'
                    : (latestScan.securityPercentage ?? (100 - latestScan.riskScore)) >= 40
                    ? '⚠️ WARNING: Potential risks detected - Proceed with caution'
                    : '🚨 CRITICAL: High threat detected - DO NOT OPEN / PAY'}
                </span>
                <span>100% Fully Secure</span>
              </div>
            </div>
          </div>

          {/* Primary Name & Resource Identity Header */}
          <div className="p-4 rounded-xl bg-obsidian-950 border border-chrome-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider">
                Recognized Resource / Business Name
              </span>
              <div className="text-lg font-bold text-white font-display mt-0.5">
                {latestScan.entityName || (latestScan.contentType === 'URL' ? 'Web Destination' : latestScan.contentType === 'UPI' ? 'UPI Payment Stand' : 'Scanned Asset')}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-mono text-chrome-500 uppercase tracking-wider">
                Classification
              </span>
              <div className="text-xs font-mono text-laser-400 font-semibold mt-0.5">
                {latestScan.contentType} • {latestScan.categoryDescription || 'Standard Payload'}
              </div>
            </div>
          </div>

          {/* AI Tailored Forensic Assessment */}
          <div className="p-3.5 rounded-xl bg-obsidian-950/70 border border-chrome-850 space-y-1 text-left">
            <span className="text-[10px] font-mono text-laser-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-laser-500" />
              Dynamic Neural Verdict
            </span>
            <p className="text-xs text-chrome-200 leading-relaxed">
              {latestScan.aiSummary}
            </p>
          </div>

          {/* Detailed Metadata Grid */}
          {latestScan.entityDetails && Object.keys(latestScan.entityDetails).length > 0 && (
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-wider">
                Extracted Parameters & Forensic Metadata
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(latestScan.entityDetails).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-obsidian-950 border border-chrome-850 flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-chrome-400 uppercase">{key}</span>
                    <span className="text-xs font-mono font-semibold text-chrome-100 break-all mt-1">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Scanned Payload */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-chrome-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-laser-500" />
                Raw Decoded Payload (Passive Protected Sandbox)
              </span>
              <button
                onClick={() => handleCopyRaw(latestScan.rawData)}
                className="px-2.5 py-1 rounded bg-obsidian-950 border border-chrome-750 hover:border-chrome-400 text-xs text-chrome-300 hover:text-white flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-chrome-200" /> : <Copy className="w-3 h-3 text-chrome-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-obsidian-950 border border-chrome-850 text-xs font-mono text-chrome-200 break-all select-all">
              {latestScan.rawData}
            </div>
          </div>
        </div>
      )}

      {/* QUICK SECURITY TEST LAB / PRE-LOADED VECTORS */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-chrome-100 tracking-wide font-display">
              Simulation Attack Vectors
            </h3>
            <p className="text-[11px] text-chrome-500 font-mono">
              Click any vector to simulate live detection scenarios
            </p>
          </div>
          <span className="text-[10px] font-mono text-chrome-300 uppercase px-2 py-0.5 rounded bg-obsidian-800 border border-chrome-400/30">
            Threat Lab
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testPayloads.map((test, idx) => (
            <div
              key={idx}
              onClick={() => handleScannedData(test.payload)}
              className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 border border-chrome-400/15 hover:border-laser-500/60 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-chrome-200 group-hover:text-laser-500 transition-colors">
                  {test.title}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                  test.badge === 'High Risk' || test.badge === 'Malicious'
                    ? 'bg-laser-500/20 text-laser-500 border border-laser-500/40'
                    : test.badge === 'Suspicious'
                    ? 'bg-obsidian-800 text-laser-400 border border-laser-500/30'
                    : 'bg-obsidian-800 text-chrome-300 border border-chrome-500/30'
                }`}>
                  {test.badge}
                </span>
              </div>
              <p className="text-[11px] text-chrome-400 mb-2">{test.desc}</p>
              <div className="text-[10px] font-mono text-chrome-500 truncate group-hover:text-chrome-300">
                {test.payload}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
