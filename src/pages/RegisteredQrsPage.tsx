import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  ShieldCheck,
  QrCode,
  Download,
  Building,
  Check,
  Copy,
  Search,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { RegisteredQR } from '../types';

export const RegisteredQrsPage: React.FC = () => {
  const [registeredList, setRegisteredList] = useState<RegisteredQR[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newlyRegistered, setNewlyRegistered] = useState<RegisteredQR | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState<string>('');
  const [qrName, setQrName] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [category, setCategory] = useState<string>('Retail & Store');
  const [verifiedUpiId, setVerifiedUpiId] = useState<string>('');
  const [storeLocation, setStoreLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRegistered = async () => {
    const list = await api.getRegisteredQrs();
    setRegisteredList(list);
  };

  useEffect(() => {
    fetchRegistered();
  }, []);

  // Generate downloadable QR code image
  const generateQrImage = async (dest: string) => {
    try {
      const url = await QRCode.toDataURL(dest, {
        width: 320,
        margin: 2,
        color: {
          dark: '#050505',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !destination || !qrName) return;

    setIsSubmitting(true);
    try {
      const created = await api.registerQr({
        businessName,
        qrName,
        destination,
        category,
        verifiedUpiId: verifiedUpiId.trim() || undefined,
        storeLocation: storeLocation.trim() || undefined
      });

      setNewlyRegistered(created);
      await generateQrImage(created.destination);
      fetchRegistered();
      setShowAddForm(false);
      // Reset form
      setBusinessName('');
      setQrName('');
      setDestination('');
      setVerifiedUpiId('');
      setStoreLocation('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQr = (record: RegisteredQR) => {
    QRCode.toDataURL(record.destination, {
      width: 600,
      margin: 2,
      color: { dark: '#050505', light: '#FFFFFF' }
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `QRShield_Verified_${record.businessName.replace(/\s+/g, '_')}_${record.id}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  const filtered = registeredList.filter(
    (item) =>
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-chrome-700/50 text-xs font-mono text-chrome-300 uppercase">
            <FolderLock className="w-3.5 h-3.5 text-laser-500" />
            <span>Cryptographic Business Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display">
            Registered Merchant QR Codes
          </h1>
          <p className="text-xs text-chrome-400">
            Register authorized business destinations to enable real-time sticker replacement tamper defense across your retail branch fleet.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setNewlyRegistered(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-laser-600 hover:bg-laser-500 text-white font-bold text-xs shadow-laser-red flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{showAddForm ? 'Close Form' : 'Register New QR Code'}</span>
        </button>
      </div>

      {/* Newly Registered Success Card */}
      {newlyRegistered && qrDataUrl && (
        <div className="p-6 rounded-2xl bg-obsidian-900/90 border border-laser-500/40 shadow-laser-red/10 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-3 border-b border-chrome-800">
            <div className="flex items-center gap-2 text-laser-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-laser-500" />
              <span>QR Code Successfully Registered & Cryptographically Anchored</span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-chrome-900/60 text-chrome-200 border border-chrome-700/60">
              STATUS: {newlyRegistered.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Image & Download */}
            <div className="md:col-span-4 flex flex-col items-center p-4 rounded-xl bg-obsidian-950 border border-chrome-800">
              <div className="p-2 bg-white rounded-xl shadow-lg">
                <img src={qrDataUrl} alt="Verified QR" className="w-44 h-44 object-contain" />
              </div>
              <button
                onClick={() => handleDownloadQr(newlyRegistered)}
                className="mt-3 px-4 py-2 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-laser-500/50 text-xs font-mono text-laser-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Verified QR</span>
              </button>
            </div>

            {/* Metadata Fields */}
            <div className="md:col-span-8 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-chrome-400 font-mono">Record ID:</span>
                  <div className="font-mono font-bold text-laser-400 text-sm">{newlyRegistered.id}</div>
                </div>
                <div>
                  <span className="text-chrome-400 font-mono">Registration Date:</span>
                  <div className="font-mono text-chrome-200">{newlyRegistered.registrationDate}</div>
                </div>
                <div>
                  <span className="text-chrome-400 font-mono">Business Name:</span>
                  <div className="font-bold text-white text-sm">{newlyRegistered.businessName}</div>
                </div>
                <div>
                  <span className="text-chrome-400 font-mono">Category:</span>
                  <div className="text-chrome-300">{newlyRegistered.category}</div>
                </div>
              </div>

              <div>
                <span className="text-chrome-400 font-mono">Original Registered Destination:</span>
                <div className="font-mono text-chrome-200 break-all p-2 rounded bg-obsidian-950 border border-chrome-800 mt-1">
                  {newlyRegistered.destination}
                </div>
              </div>

              <div>
                <span className="text-chrome-400 font-mono">Cryptographic Vault Hash:</span>
                <div className="font-mono text-[11px] text-chrome-400 truncate p-2 rounded bg-obsidian-950 border border-chrome-800 mt-1">
                  {newlyRegistered.securityHash}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form (Collapsible) */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl glass-panel space-y-6 border border-chrome-800/80 bg-obsidian-900/90"
        >
          <div className="flex items-center justify-between pb-3 border-b border-chrome-800">
            <h3 className="text-sm font-bold text-white tracking-wide font-display">
              New Business QR Registration Form
            </h3>
            <span className="text-[10px] font-mono text-chrome-400">
              * Required fields
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                Business / Merchant Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Starbucks Coffee - Bandra"
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              />
            </div>

            {/* QR Code Name / Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                QR Stand Name / Label *
              </label>
              <input
                type="text"
                required
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="e.g. Counter 1 Billing QR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              />
            </div>

            {/* QR Content / Destination */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                Authentic Target Destination (URL or UPI String) *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. https://mystore.com/checkout or upi://pay?pa=store@okaxis..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              />
            </div>

            {/* Business Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              >
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Retail & Store">Retail & Store</option>
                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                <option value="Hospitality & Hotel">Hospitality & Hotel</option>
                <option value="Banking & Finance">Banking & Finance</option>
                <option value="Government & Civic">Government & Civic</option>
              </select>
            </div>

            {/* Verified UPI ID (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                Verified UPI VPA (Optional)
              </label>
              <input
                type="text"
                value={verifiedUpiId}
                onChange={(e) => setVerifiedUpiId(e.target.value)}
                placeholder="e.g. storename@hdfcbank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              />
            </div>

            {/* Store Location */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono text-chrome-300">
                Store Location / Street Address (Optional)
              </label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                placeholder="e.g. Linking Road, Bandra West, Mumbai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chrome-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-obsidian-900 border border-chrome-700/60 text-xs font-semibold text-chrome-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-laser-600 hover:bg-laser-500 text-white font-bold text-xs shadow-laser-red transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Vault Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-chrome-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business, ID, or destination..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-chrome-800 text-white font-mono text-xs focus:border-laser-500 focus:outline-none focus:ring-1 focus:ring-laser-500/40"
          />
        </div>

        <span className="text-xs font-mono text-chrome-400 self-center">
          Showing {filtered.length} of {registeredList.length} vault assets
        </span>
      </div>

      {/* Registered Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl glass-card bg-obsidian-900/80 border border-chrome-800/80 hover:border-chrome-700 flex flex-col justify-between space-y-4 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-display">{item.businessName}</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-chrome-950 text-chrome-300 border border-chrome-700/60">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-laser-400 font-mono mt-0.5">{item.qrName}</div>
                </div>

                <button
                  onClick={() => handleCopy(item.id, item.id)}
                  className="px-2 py-1 rounded bg-obsidian-950 border border-chrome-800 text-[10px] font-mono text-chrome-400 hover:text-chrome-200 flex items-center gap-1 transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-chrome-200" /> : <Copy className="w-3 h-3" />}
                  <span>{item.id}</span>
                </button>
              </div>

              {item.storeLocation && (
                <div className="flex items-center gap-1 text-[11px] text-chrome-400 mb-2">
                  <MapPin className="w-3 h-3 text-chrome-500" />
                  <span>{item.storeLocation}</span>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-obsidian-950 border border-chrome-850 font-mono text-xs text-chrome-200 break-all select-all">
                {item.destination}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-chrome-800/80 text-xs">
              <span className="text-[10px] font-mono text-chrome-400">
                Registered: {item.registrationDate}
              </span>

              <button
                onClick={() => handleDownloadQr(item)}
                className="px-3 py-1.5 rounded-lg bg-obsidian-950 hover:bg-obsidian-900 border border-chrome-800 hover:border-laser-500 text-xs font-mono text-chrome-300 hover:text-laser-400 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download QR</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
