export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNKNOWN';

export type QRContentType = 'URL' | 'UPI' | 'WIFI' | 'TEXT' | 'EMAIL' | 'VCARD' | 'OTHER';

export interface ThreatIndicator {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: 'url' | 'payment' | 'tamper' | 'heuristic';
}

export interface UrlAnalysisResult {
  url: string;
  domain: string;
  protocol: string;
  isHttps: boolean;
  isShortened: boolean;
  originalUrlIfExpanded?: string;
  domainReputation: number; // 0-100
  domainAgeDays?: number;
  isIpAddress: boolean;
  hasPunycode: boolean;
  hasSuspiciousTld: boolean;
  typosquattingTarget?: string;
  threatFlags: string[];
  redirectChain: string[];
  sslIssuer?: string;
  safetyVerdict: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
}

export interface UpiAnalysisResult {
  rawUri: string;
  vpa: string; // payee address (pa)
  payeeName: string; // pn
  amount?: string; // am
  currency?: string; // cu
  merchantCode?: string; // mc
  transactionRef?: string; // tr
  transactionNote?: string; // tn
  isRegisteredMerchant: boolean;
  registeredMerchantName?: string;
  isNameMismatch: boolean;
  isSuspiciousHandle: boolean;
  flags: string[];
  fraudPatternDetected?: string;
  safetyAdvice: string[];
}

export interface RegisteredQR {
  id: string;
  businessName: string;
  qrName: string;
  destination: string;
  category: string;
  verifiedUpiId?: string;
  registrationDate: string;
  status: 'VERIFIED' | 'DESTINATION_CHANGED' | 'NOT_REGISTERED' | 'UNVERIFIED';
  securityHash: string;
  storeLocation?: string;
  authorizedPhone?: string;
}

export interface QRVerificationResult {
  status: 'VERIFIED' | 'DESTINATION_CHANGED' | 'NOT_REGISTERED' | 'UNVERIFIED';
  registeredRecord?: RegisteredQR;
  scannedDestination: string;
  originalDestination?: string;
  mismatchDetails?: string;
  tamperRiskScore: number;
}

export interface WifiData {
  ssid: string;
  authType: string;
  hidden: boolean;
  passwordPresent: boolean;
}

export interface ScanResult {
  id: string;
  timestamp: string;
  rawData: string;
  contentType: QRContentType;
  riskScore: number; // 0 (Clean) to 100 (Critical Threat)
  riskLevel: RiskLevel;
  securityPercentage: number; // 0 to 100% (100% = completely secure, 0% = malicious)
  isSecured: boolean; // true if securityPercentage >= 70
  securityStatusText: string; // e.g. "95% SECURED - SAFE TO USE"
  qrAppType: string; // e.g. "PhonePe Merchant QR", "Google Pay (GPay) QR", "Website QR (Google)"
  appProvider: string; // e.g. "PhonePe", "Google Pay", "Paytm", "Web Browser"
  entityName?: string;
  categoryDescription?: string;
  entityDetails?: Record<string, string>;
  urlAnalysis?: UrlAnalysisResult;
  upiAnalysis?: UpiAnalysisResult;
  qrVerification?: QRVerificationResult;
  wifiData?: WifiData;
  aiSummary: string;
  threatIndicators: ThreatIndicator[];
  recommendedActions: string[];
}

export interface DashboardStats {
  totalScans: number;
  safeCount: number;
  suspiciousCount: number;
  highRiskCount: number;
  registeredCount: number;
  recentScans: ScanResult[];
  riskDistribution: { name: string; value: number; color: string }[];
  weeklyActivity: { day: string; safe: number; threat: number }[];
  latestAlerts: { id: string; title: string; time: string; severity: 'low' | 'medium' | 'high'; type: string }[];
}

export interface SecurityReport {
  reportId: string;
  generatedAt: string;
  scanResult: ScanResult;
  executiveSummary: string;
  complianceChecks: { check: string; status: 'PASS' | 'WARN' | 'FAIL'; note: string }[];
  iocSignatures: string[];
  technicalMetadata: {
    clientFingerprint: string;
    engineVersion: string;
    signatureDatabase: string;
    scanLatencyMs: number;
  };
}

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: string;
  clearance?: string;
  token?: string;
}


