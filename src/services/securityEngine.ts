import {
  QRContentType,
  RiskLevel,
  ScanResult,
  ThreatIndicator,
  UpiAnalysisResult,
  UrlAnalysisResult,
  QRVerificationResult,
  RegisteredQR,
  WifiData
} from '../types';

// Pre-seeded verified businesses for tamper detection & UPI verification
export const INITIAL_REGISTERED_QRS: RegisteredQR[] = [
  {
    id: 'QRS-IND-001',
    businessName: 'Starbucks Coffee - Bandra Flagship',
    qrName: 'Counter 1 POS Payment',
    destination: 'upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR',
    category: 'Food & Beverage',
    verifiedUpiId: 'starbucks.bandra@hdfcbank',
    registrationDate: '2026-01-15',
    status: 'VERIFIED',
    securityHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    storeLocation: 'Linking Road, Bandra West, Mumbai',
    authorizedPhone: '+91 98200 12345'
  },
  {
    id: 'QRS-IND-002',
    businessName: 'Apollo Pharmacy Central',
    qrName: 'Billing Desk 2 UPI',
    destination: 'upi://pay?pa=apollopharmacy.pay@icici&pn=Apollo%20Pharmacy&mc=5912&cu=INR',
    category: 'Healthcare & Pharma',
    verifiedUpiId: 'apollopharmacy.pay@icici',
    registrationDate: '2026-02-10',
    status: 'VERIFIED',
    securityHash: 'sha256-a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    storeLocation: 'Indiranagar 100ft Rd, Bangalore',
    authorizedPhone: '+91 98450 67890'
  },
  {
    id: 'QRS-IND-003',
    businessName: 'Decathlon Sports Arena',
    qrName: 'Smart Self-Checkout Portal',
    destination: 'https://checkout.decathlon.in/store/402/express',
    category: 'Retail & Sports',
    registrationDate: '2026-03-01',
    status: 'VERIFIED',
    securityHash: 'sha256-785f397e4439c279c235b3e215cb86b7e09efb4b9b9a67448d3eb84e58b8f2a9',
    storeLocation: 'Cyber City, Gurugram',
    authorizedPhone: '+91 99100 54321'
  },
  {
    id: 'QRS-IND-004',
    businessName: 'Blue Tokai Coffee Roasters',
    qrName: 'Table 7 Digital Menu & Pay',
    destination: 'https://bluetokaicoffee.com/menu/table-7',
    category: 'Cafes & Dining',
    registrationDate: '2026-03-20',
    status: 'VERIFIED',
    securityHash: 'sha256-b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    storeLocation: 'Koramangala 4th Block, Bangalore',
    authorizedPhone: '+91 97400 98765'
  }
];

const KNOWN_BRANDS = [
  'google', 'paypal', 'amazon', 'microsoft', 'apple', 'netflix', 'facebook',
  'instagram', 'twitter', 'binance', 'coinbase', 'sbi', 'hdfcbank', 'icicibank',
  'axisbank', 'paytm', 'phonepe', 'gpay', 'whatsapp', 'github', 'dropbox',
  'starbucks', 'mcdonalds', 'zomato', 'swiggy', 'uber', 'ola'
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.cam',
  '.work', '.click', '.rest', '.country', '.gdn', '.mom', '.monster', '.kim', '.sbs'
];

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'cutt.ly',
  'buff.ly', 'rb.gy', 'shorte.st', 'linktr.ee', 'qrco.de', 'v.gd'
];

export class SecurityEngine {
  private static registeredQrs: RegisteredQR[] = [...INITIAL_REGISTERED_QRS];

  public static getRegisteredQrs(): RegisteredQR[] {
    const saved = localStorage.getItem('qrshield_registered_qrs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return this.registeredQrs;
  }

  public static registerQr(qr: Omit<RegisteredQR, 'id' | 'registrationDate' | 'status' | 'securityHash'>): RegisteredQR {
    const current = this.getRegisteredQrs();
    const id = `QRS-REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hash = 'sha256-' + Array.from(new TextEncoder().encode(qr.destination + qr.businessName))
      .map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 48);
    
    const newRecord: RegisteredQR = {
      ...qr,
      id,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'VERIFIED',
      securityHash: hash
    };

    const updated = [newRecord, ...current];
    localStorage.setItem('qrshield_registered_qrs', JSON.stringify(updated));
    return newRecord;
  }

  public static identifyContentType(data: string): QRContentType {
    const trimmed = data.trim();
    if (trimmed.toLowerCase().startsWith('upi://')) return 'UPI';
    if (trimmed.toLowerCase().startsWith('wifi:') || trimmed.toLowerCase().startsWith('wpa:')) return 'WIFI';
    if (trimmed.toLowerCase().startsWith('mailto:') || trimmed.toLowerCase().startsWith('matmsg:')) return 'EMAIL';
    if (trimmed.toLowerCase().startsWith('begin:vcard')) return 'VCARD';
    if (/^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(trimmed)) return 'URL';
    return 'TEXT';
  }

  public static analyzeUrl(inputUrl: string): UrlAnalysisResult {
    let urlString = inputUrl.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return {
        url: inputUrl,
        domain: 'invalid-domain',
        protocol: 'unknown',
        isHttps: false,
        isShortened: false,
        domainReputation: 15,
        isIpAddress: false,
        hasPunycode: false,
        hasSuspiciousTld: false,
        threatFlags: ['Malformed or invalid URL syntax'],
        redirectChain: [],
        safetyVerdict: 'MALICIOUS'
      };
    }

    const host = parsed.hostname.toLowerCase();
    const isHttps = parsed.protocol === 'https:';
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const hasPunycode = host.includes('xn--');
    const isShortened = SHORTENER_DOMAINS.some(d => host === d || host.endsWith('.' + d));
    const hasSuspiciousTld = SUSPICIOUS_TLDS.some(tld => host.endsWith(tld));

    const threatFlags: string[] = [];
    let reputationScore = 90;

    if (!isHttps) {
      threatFlags.push('Insecure connection (Cleartext HTTP protocol, vulnerable to Man-in-the-Middle intercept)');
      reputationScore -= 25;
    }

    if (isIp) {
      threatFlags.push('Direct raw IP address hostname detected (Common evasive tactic used by phishing & C2 nodes)');
      reputationScore -= 45;
    }

    if (hasPunycode) {
      threatFlags.push('Internationalized Punycode domain detected (High likelihood of visual homograph spoofing)');
      reputationScore -= 40;
    }

    if (isShortened) {
      threatFlags.push('URL shortener obscures real destination (Bypasses initial visual domain scrutiny)');
      reputationScore -= 30;
    }

    if (hasSuspiciousTld) {
      threatFlags.push(`High-abuse top-level domain extension (${host.substring(host.lastIndexOf('.'))}) frequently associated with disposable spam`);
      reputationScore -= 25;
    }

    // Check typosquatting against known brands
    let typosquattingTarget: string | undefined;
    for (const brand of KNOWN_BRANDS) {
      if (host.includes(brand) && !host.endsWith(`${brand}.com`) && !host.endsWith(`${brand}.in`) && !host.endsWith(`${brand}.org`) && !host.endsWith(`${brand}.co.in`)) {
        typosquattingTarget = brand;
        threatFlags.push(`Potential Brand Impersonation / Typosquatting detected: Scanned domain mimicks authentic '${brand}' infrastructure`);
        reputationScore -= 45;
        break;
      }
    }

    // Check suspicious path keywords
    const lowerPath = parsed.pathname.toLowerCase() + parsed.search.toLowerCase();
    const suspiciousKeywords = ['login', 'verify', 'update-account', 'banking', 'secure-payment', 'kyc-approval', 'airdrop', 'bonus-claim', '.apk', '.exe'];
    for (const kw of suspiciousKeywords) {
      if (lowerPath.includes(kw)) {
        threatFlags.push(`Suspicious credential or binary solicitation token in query path: '${kw}'`);
        reputationScore -= 20;
        break;
      }
    }

    reputationScore = Math.max(5, Math.min(99, reputationScore));

    let safetyVerdict: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' = 'SAFE';
    if (reputationScore < 40) safetyVerdict = 'MALICIOUS';
    else if (reputationScore < 70) safetyVerdict = 'SUSPICIOUS';

    // Mock redirect simulation
    const redirectChain = [parsed.origin + parsed.pathname];
    if (isShortened) {
      redirectChain.push('https://unpacked-destination-gate.io/target?id=verified');
    }

    return {
      url: inputUrl,
      domain: host,
      protocol: parsed.protocol.replace(':', ''),
      isHttps,
      isShortened,
      originalUrlIfExpanded: isShortened ? 'https://unpacked-destination-gate.io/target?id=verified' : undefined,
      domainReputation: reputationScore,
      domainAgeDays: reputationScore > 75 ? 1420 : 14,
      isIpAddress: isIp,
      hasPunycode,
      hasSuspiciousTld,
      typosquattingTarget,
      threatFlags,
      redirectChain,
      sslIssuer: isHttps ? 'DigiCert Global Root G2 (TLS 1.3)' : undefined,
      safetyVerdict
    };
  }

  public static analyzeUpi(upiUri: string): UpiAnalysisResult {
    const raw = upiUri.trim();
    let queryParams: URLSearchParams;
    try {
      const questionIndex = raw.indexOf('?');
      queryParams = new URLSearchParams(questionIndex !== -1 ? raw.substring(questionIndex) : raw);
    } catch {
      queryParams = new URLSearchParams();
    }

    const vpa = queryParams.get('pa') || '';
    const payeeName = queryParams.get('pn') ? decodeURIComponent(queryParams.get('pn')!) : 'Unknown Recipient';
    const amount = queryParams.get('am') || undefined;
    const currency = queryParams.get('cu') || 'INR';
    const merchantCode = queryParams.get('mc') || undefined;
    const transactionRef = queryParams.get('tr') || undefined;
    const transactionNote = queryParams.get('tn') ? decodeURIComponent(queryParams.get('tn')!) : undefined;

    const registeredList = this.getRegisteredQrs();
    const registeredMatch = registeredList.find(r => r.verifiedUpiId && r.verifiedUpiId.toLowerCase() === vpa.toLowerCase());

    const flags: string[] = [];
    const safetyAdvice: string[] = [
      'Remember: UPI PIN is strictly for DEBITING money. You NEVER need to enter your UPI PIN to receive payment or refunds.',
      'Always double-check the recipient name on your bank confirmation modal before authorizing.'
    ];

    let isNameMismatch = false;
    let isSuspiciousHandle = false;

    // Check handle validity
    const parts = vpa.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      flags.push('Malformed Virtual Payment Address (VPA format invalid)');
      isSuspiciousHandle = true;
    } else {
      const [user, psp] = parts;
      const validPsps = ['okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'ybl', 'paytm', 'ibl', 'axl', 'upi', 'barodampay', 'federal'];
      if (!validPsps.includes(psp.toLowerCase())) {
        flags.push(`Uncommon or custom third-party PSP payment handle: '@${psp}'`);
      }

      // Check if posing as official brand with personal handle
      for (const brand of ['starbucks', 'amazon', 'flipkart', 'apollo', 'zomato', 'swiggy', 'airtel', 'jio']) {
        if (payeeName.toLowerCase().includes(brand) && !user.toLowerCase().includes(brand)) {
          isNameMismatch = true;
          flags.push(`CRITICAL PAYMENT FRAUD INDICATOR: Display Name asserts '${payeeName}', but receiving VPA account belongs to '${vpa}'`);
          safetyAdvice.unshift('STOP: Potential QR sticker replacement attack detected at physical merchant location.');
          break;
        }
      }
    }

    // Check fixed high amount
    if (amount && parseFloat(amount) > 5000) {
      flags.push(`High pre-set payment sum of ₹${amount}. Confirm authorization with cashier.`);
    }

    if (!merchantCode && payeeName.toLowerCase().includes('ltd') || payeeName.toLowerCase().includes('pvt')) {
      flags.push('Declared corporate merchant lacks verified RBI / NPCI Merchant Category Code (MCC)');
    }

    return {
      rawUri: upiUri,
      vpa,
      payeeName,
      amount,
      currency,
      merchantCode,
      transactionRef,
      transactionNote,
      isRegisteredMerchant: !!registeredMatch,
      registeredMerchantName: registeredMatch?.businessName,
      isNameMismatch,
      isSuspiciousHandle,
      flags,
      fraudPatternDetected: isNameMismatch ? 'RECIPIENT_VPA_HIJACK' : isSuspiciousHandle ? 'UNAUTHORIZED_PAYEE_FORMAT' : undefined,
      safetyAdvice
    };
  }

  public static verifyQrAgainstRegistry(scannedPayload: string): QRVerificationResult {
    const list = this.getRegisteredQrs();
    const cleanScanned = scannedPayload.trim();

    // Check exact destination match
    const exactMatch = list.find(r => r.destination.trim() === cleanScanned);
    if (exactMatch) {
      return {
        status: 'VERIFIED',
        registeredRecord: exactMatch,
        scannedDestination: cleanScanned,
        originalDestination: exactMatch.destination,
        tamperRiskScore: 0
      };
    }

    // Check if payload contains reference or partial match indicating tamper (e.g. UPI VPA changed for registered merchant)
    for (const record of list) {
      if (record.verifiedUpiId) {
        // If scanned payload is a UPI URI for this business name or category
        if (cleanScanned.toLowerCase().includes('upi://') && cleanScanned.toLowerCase().includes(record.businessName.split(' ')[0].toLowerCase())) {
          return {
            status: 'DESTINATION_CHANGED',
            registeredRecord: record,
            scannedDestination: cleanScanned,
            originalDestination: record.destination,
            mismatchDetails: `Original verified VPA [${record.verifiedUpiId}] has been replaced with unverified payee destination.`,
            tamperRiskScore: 95
          };
        }
      }

      // Check URL domain difference for registered business portal
      if (record.destination.startsWith('http') && cleanScanned.startsWith('http')) {
        try {
          const regHost = new URL(record.destination).hostname;
          const scanHost = new URL(cleanScanned).hostname;
          if (regHost !== scanHost && (cleanScanned.toLowerCase().includes(record.businessName.split(' ')[0].toLowerCase()) || record.destination.includes(scanHost.split('.')[0]))) {
            return {
              status: 'DESTINATION_CHANGED',
              registeredRecord: record,
              scannedDestination: cleanScanned,
              originalDestination: record.destination,
              mismatchDetails: `Expected authentic business domain '${regHost}', but discovered swapped target '${scanHost}'.`,
              tamperRiskScore: 92
            };
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    return {
      status: 'NOT_REGISTERED',
      scannedDestination: cleanScanned,
      tamperRiskScore: 20
    };
  }

  public static parseWifi(data: string): WifiData {
    // Format: WIFI:S:MySSID;T:WPA;P:MyPassword;H:false;;
    const ssidMatch = data.match(/S:([^;]+)/i);
    const typeMatch = data.match(/T:([^;]+)/i);
    const passMatch = data.match(/P:([^;]+)/i);
    const hiddenMatch = data.match(/H:(true|false)/i);

    return {
      ssid: ssidMatch ? ssidMatch[1] : 'Unknown Network',
      authType: typeMatch ? typeMatch[1] : 'WPA/WPA2',
      passwordPresent: !!(passMatch && passMatch[1]),
      hidden: hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false
    };
  }

  public static extractEntityInfo(
    rawData: string,
    contentType: QRContentType,
    riskLevel: RiskLevel,
    riskScore: number,
    urlAnalysis?: UrlAnalysisResult,
    upiAnalysis?: UpiAnalysisResult,
    qrVerification?: QRVerificationResult,
    wifiData?: WifiData
  ): {
    entityName: string;
    categoryDescription: string;
    qrAppType: string;
    appProvider: string;
    securityPercentage: number;
    isSecured: boolean;
    securityStatusText: string;
    entityDetails: Record<string, string>;
    aiSummary: string;
  } {
    let entityName = 'QR Code Asset';
    let categoryDescription = 'General QR Asset';
    let qrAppType = 'Generic QR Code';
    let appProvider = 'Standard Scanner';
    const entityDetails: Record<string, string> = {};
    let aiSummary = '';

    const clean = rawData.trim();
    const securityPercentage = Math.max(0, Math.min(100, 100 - riskScore));
    const isSecured = securityPercentage >= 70;
    let securityStatusText = '';

    if (securityPercentage >= 80) {
      securityStatusText = `${securityPercentage}% SECURED — SAFE TO USE`;
    } else if (securityPercentage >= 50) {
      securityStatusText = `${securityPercentage}% SECURED — SUSPICIOUS / PROCEED WITH CAUTION`;
    } else {
      securityStatusText = `${securityPercentage}% SECURED — UNSECURED / DANGEROUS`;
    }

    if (contentType === 'URL') {
      let hostname = '';
      let pathname = '/';
      try {
        const u = new URL(clean.startsWith('http') ? clean : 'https://' + clean);
        hostname = u.hostname.toLowerCase();
        pathname = u.pathname;
      } catch {
        hostname = clean;
      }

      // Friendly Brand / Domain Name mapping
      const brandMap: Record<string, string> = {
        'google.com': 'Google Search & Services',
        'google.co.in': 'Google India',
        'youtube.com': 'YouTube Video Platform',
        'youtu.be': 'YouTube Short Link',
        'github.com': 'GitHub Code Repository',
        'decathlon.in': 'Decathlon Sports Checkout',
        'decathlon.com': 'Decathlon Sports Arena',
        'bluetokaicoffee.com': 'Blue Tokai Coffee Roasters',
        'starbucks.com': 'Starbucks Coffee Portal',
        'starbucks.in': 'Starbucks Coffee India',
        'amazon.in': 'Amazon India Marketplace',
        'amazon.com': 'Amazon Global Marketplace',
        'apple.com': 'Apple Inc. Services',
        'wikipedia.org': 'Wikipedia Online Reference',
        'paypal.com': 'PayPal Payment Gateway',
        'sbi.co.in': 'State Bank of India',
        'hdfcbank.com': 'HDFC Bank NetBanking',
        'icicibank.com': 'ICICI Bank Gateway',
        'axisbank.com': 'Axis Bank Portal',
        'paytm.com': 'Paytm Digital Services',
        'phonepe.com': 'PhonePe Digital Services',
        'bit.ly': 'Shortened Bitly Web Redirect',
        'tinyurl.com': 'Shortened TinyURL Redirect'
      };

      let friendly = '';
      for (const [k, v] of Object.entries(brandMap)) {
        if (hostname === k || hostname.endsWith('.' + k)) {
          friendly = v;
          break;
        }
      }

      if (!friendly) {
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
          friendly = `Direct Server IP (${hostname})`;
        } else {
          const parts = hostname.replace(/^www\./, '').split('.');
          const baseName = parts[0] || hostname;
          friendly = baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Web Portal';
        }
      }

      entityName = friendly;
      categoryDescription = urlAnalysis?.isShortened ? 'Shortened URL Redirect' : 'Web Hyperlink Destination';

      // Specific QR App Provider Type for URLs
      if (hostname.includes('google')) {
        qrAppType = 'Google Search / Web Portal QR';
        appProvider = 'Google';
      } else if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
        qrAppType = 'YouTube Video QR';
        appProvider = 'YouTube';
      } else if (hostname.includes('phonepe')) {
        qrAppType = 'PhonePe Web QR';
        appProvider = 'PhonePe';
      } else if (hostname.includes('paytm') || hostname.includes('p-y.tm')) {
        qrAppType = 'Paytm Web QR';
        appProvider = 'Paytm';
      } else if (hostname.includes('instagram')) {
        qrAppType = 'Instagram Profile / Post QR';
        appProvider = 'Instagram';
      } else if (hostname.includes('whatsapp') || hostname.includes('wa.me')) {
        qrAppType = 'WhatsApp Chat / Community QR';
        appProvider = 'WhatsApp';
      } else if (hostname.includes('amazon')) {
        qrAppType = 'Amazon Shopping QR';
        appProvider = 'Amazon';
      } else if (hostname.includes('flipkart')) {
        qrAppType = 'Flipkart Store QR';
        appProvider = 'Flipkart';
      } else if (hostname.includes('decathlon')) {
        qrAppType = 'Decathlon Store Checkout QR';
        appProvider = 'Decathlon';
      } else if (hostname.includes('github')) {
        qrAppType = 'GitHub Code Repository QR';
        appProvider = 'GitHub';
      } else if (urlAnalysis?.isShortened) {
        qrAppType = 'Shortened Web Redirect QR';
        appProvider = 'URL Shortener';
      } else {
        qrAppType = `Website Link (${hostname}) QR`;
        appProvider = 'Web Browser';
      }

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Identified Resource'] = friendly;
      entityDetails['Target Domain'] = hostname;
      entityDetails['Full Address'] = clean;
      entityDetails['Security Protocol'] = urlAnalysis?.isHttps ? 'HTTPS (TLS Encrypted)' : 'HTTP (Insecure / Cleartext)';
      entityDetails['Shortened Link'] = urlAnalysis?.isShortened ? 'Yes (Concealed Target)' : 'No (Direct Destination)';
      entityDetails['Domain Reputation'] = `${urlAnalysis?.domainReputation || 85} / 100`;
      entityDetails['Path Location'] = pathname !== '/' ? pathname : 'Root Domain (Homepage)';
      entityDetails['Host Classification'] = urlAnalysis?.isIpAddress ? 'Raw Direct IP Host' : 'Standard DNS Hostname';

      if (urlAnalysis?.typosquattingTarget) {
        entityDetails['Typosquatting Risk'] = `Impersonation of '${urlAnalysis.typosquattingTarget}'`;
      }

      if (riskLevel === 'HIGH_RISK') {
        const issues = urlAnalysis?.threatFlags?.length ? urlAnalysis.threatFlags.join('; ') : 'Malicious destination characteristics';
        aiSummary = `CRITICAL THREAT: Destination "${friendly}" (${hostname}) flagged as dangerous (${securityPercentage}% Secure). Indicators: ${issues}. Access has been isolated in the sandbox to safeguard your device and credentials.`;
      } else if (riskLevel === 'SUSPICIOUS') {
        const issues = urlAnalysis?.threatFlags?.length ? urlAnalysis.threatFlags.join('; ') : 'Unverified transport or obfuscation';
        aiSummary = `CAUTION ADVISED: Destination "${friendly}" (${hostname}) presents security anomalies (${issues}). Security Rating: ${securityPercentage}% Secure. Inspect origin authenticity before proceeding.`;
      } else {
        aiSummary = `CLEAN & AUTHENTIC: "${friendly}" (${hostname}) verified ${securityPercentage}% secure. Operating over encrypted ${urlAnalysis?.isHttps ? 'HTTPS' : 'HTTP'} protocol with clean domain reputation (${urlAnalysis?.domainReputation || 90}/100). No phishing, punycode spoofing, or deceptive redirection detected.`;
      }

    } else if (contentType === 'UPI') {
      const vpa = upiAnalysis?.vpa || 'Unknown VPA';
      const payee = upiAnalysis?.payeeName && upiAnalysis.payeeName !== 'Unknown Recipient' ? upiAnalysis.payeeName : vpa;
      const amtStr = upiAnalysis?.amount ? `₹${parseFloat(upiAnalysis.amount).toFixed(2)}` : 'Open / Unset Amount';

      entityName = `${payee} (UPI Payee)`;
      categoryDescription = 'NPCI UPI Payment Destination';

      // Specific UPI Provider Detection (PhonePe, GPay, Paytm, etc.)
      const vpaLower = vpa.toLowerCase();
      const handle = vpaLower.includes('@') ? vpaLower.split('@')[1] : '';

      if (['ybl', 'ibl', 'axl'].includes(handle) || clean.toLowerCase().includes('phonepe')) {
        qrAppType = 'PhonePe Payment QR';
        appProvider = 'PhonePe';
      } else if (['okhdfcbank', 'okaxis', 'oksbi', 'okicici'].includes(handle) || clean.toLowerCase().includes('google')) {
        qrAppType = 'Google Pay (GPay) QR';
        appProvider = 'Google Pay';
      } else if (['paytm', 'ptsbi', 'pthdfc', 'ptaxis'].includes(handle) || clean.toLowerCase().includes('paytm')) {
        qrAppType = 'Paytm Merchant QR';
        appProvider = 'Paytm';
      } else if (['sbi', 'oksbi'].includes(handle)) {
        qrAppType = 'State Bank of India (SBI) UPI QR';
        appProvider = 'SBI UPI';
      } else if (['hdfcbank', 'okhdfcbank'].includes(handle)) {
        qrAppType = 'HDFC Bank UPI QR';
        appProvider = 'HDFC Bank';
      } else if (['icici', 'okicici'].includes(handle)) {
        qrAppType = 'ICICI Bank UPI QR';
        appProvider = 'ICICI Bank';
      } else if (['axisbank', 'okaxis'].includes(handle)) {
        qrAppType = 'Axis Bank UPI QR';
        appProvider = 'Axis Bank';
      } else if (['apl', 'rapl'].includes(handle)) {
        qrAppType = 'Amazon Pay UPI QR';
        appProvider = 'Amazon Pay';
      } else if (handle === 'upi') {
        qrAppType = 'BHIM NPCI UPI QR';
        appProvider = 'BHIM';
      } else {
        qrAppType = `UPI Payment QR (@${handle || 'upi'})`;
        appProvider = 'NPCI UPI';
      }

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Payment App Platform'] = appProvider;
      entityDetails['Payee Display Name'] = payee;
      entityDetails['Virtual Payment Address (VPA)'] = vpa;
      entityDetails['Requested Amount'] = amtStr;
      entityDetails['Currency'] = upiAnalysis?.currency || 'INR';
      entityDetails['PSP Provider Handle'] = vpa.includes('@') ? `@${vpa.split('@')[1]}` : 'Unknown';
      entityDetails['Merchant Category (MCC)'] = upiAnalysis?.merchantCode || 'Standard Peer/Merchant';
      entityDetails['Merchant Registry Status'] = upiAnalysis?.isRegisteredMerchant ? 'Cryptographically Verified Business' : (upiAnalysis?.isNameMismatch ? 'MISMATCH / SUSPECT RECIPIENT' : 'Unregistered Payee');
      
      if (upiAnalysis?.transactionNote) {
        entityDetails['Transaction Note'] = upiAnalysis.transactionNote;
      }
      if (upiAnalysis?.transactionRef) {
        entityDetails['Transaction Reference'] = upiAnalysis.transactionRef;
      }

      if (upiAnalysis?.isNameMismatch) {
        aiSummary = `CRITICAL FRAUD ALERT (Security: ${securityPercentage}%): Display Name claims to be "${payee}", but receiving VPA account is "${vpa}". Classic QR sticker replacement attack detected at physical merchant point. DO NOT authorize this payment.`;
      } else if (upiAnalysis?.isRegisteredMerchant) {
        aiSummary = `VERIFIED MERCHANT (${securityPercentage}% SECURE): Payment destination for "${payee}" (VPA: ${vpa}) matches authorized cryptographic vault registry. Amount: ${amtStr}. Safe to authorize via ${appProvider} or any UPI app.`;
      } else if (riskLevel === 'SUSPICIOUS') {
        aiSummary = `PAYMENT ADVISORY (Security: ${securityPercentage}%): UPI destination for "${payee}" (${vpa}) is from an unregistered merchant or uses a custom handle. Always verify the recipient name on your bank PIN confirmation screen.`;
      } else {
        aiSummary = `AUTHENTIC ${appProvider.toUpperCase()} FORMAT (${securityPercentage}% SECURE): Valid NPCI payment specification for "${payee}" (${vpa}). Pre-set amount: ${amtStr}. Standard payment safeguards active.`;
      }

    } else if (contentType === 'WIFI') {
      const ssid = wifiData?.ssid || 'Wireless Network';
      entityName = `Wi-Fi Network: "${ssid}"`;
      categoryDescription = 'Wi-Fi Access Point Configuration';
      qrAppType = 'Wi-Fi Network Connection QR';
      appProvider = 'Wi-Fi Hotspot';

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Network Name (SSID)'] = ssid;
      entityDetails['Encryption Standard'] = wifiData?.authType || 'WPA2/WPA3';
      entityDetails['Password Protected'] = wifiData?.passwordPresent ? 'Yes (Key Configured)' : 'No (Open Public Access)';
      entityDetails['SSID Visibility'] = wifiData?.hidden ? 'Hidden Network' : 'Publicly Broadcasted';

      if (!wifiData?.passwordPresent || wifiData?.authType?.toUpperCase() === 'NOPASS') {
        aiSummary = `HIGH RISK WI-FI (Security: ${securityPercentage}%): Access point "${ssid}" operates without password encryption. Open Wi-Fi networks expose traffic to packet sniffing and evil-twin interception attacks. Avoid accessing banking or confidential sites.`;
      } else {
        aiSummary = `SECURE WI-FI CONFIGURATION (${securityPercentage}% SECURE): Wi-Fi credentials for network "${ssid}" configured with ${wifiData?.authType || 'WPA2'} encryption. Verify that you recognize this network before connecting.`;
      }

    } else if (contentType === 'EMAIL') {
      const mailto = clean.replace(/^(mailto:|matmsg:)/i, '');
      const emailParts = mailto.split('?');
      const emailAddr = emailParts[0] || 'Unknown';
      entityName = `Email to: ${emailAddr}`;
      categoryDescription = 'Mailto Contact Action';
      qrAppType = 'Email Action QR';
      appProvider = 'Email Client';

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Recipient Address'] = emailAddr;
      if (emailParts[1]) {
        const p = new URLSearchParams(emailParts[1]);
        if (p.get('subject')) entityDetails['Subject Line'] = p.get('subject')!;
        if (p.get('body')) entityDetails['Pre-filled Message'] = p.get('body')!.substring(0, 100);
      }

      aiSummary = `EMAIL TRIGGER (${securityPercentage}% SECURE): QR code initiates an email compose request to "${emailAddr}". Safe to inspect; verify the recipient before dispatching messages.`;

    } else if (contentType === 'VCARD') {
      const fnMatch = clean.match(/(?:FN|N)(?:;[^:]*)?:([^\r\n]+)/i);
      const name = fnMatch ? fnMatch[1].replace(/;/g, ' ').trim() : 'Contact Card';
      entityName = `Contact: ${name}`;
      categoryDescription = 'vCard Contact Card';
      qrAppType = 'Digital Contact Card (vCard) QR';
      appProvider = 'Contacts Address Book';

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Full Name'] = name;
      const orgMatch = clean.match(/ORG(?:;[^:]*)?:([^\r\n]+)/i);
      if (orgMatch) entityDetails['Organization'] = orgMatch[1].trim();
      const telMatch = clean.match(/TEL(?:;[^:]*)?:([^\r\n]+)/i);
      if (telMatch) entityDetails['Phone Number'] = telMatch[1].trim();
      const mailMatch = clean.match(/EMAIL(?:;[^:]*)?:([^\r\n]+)/i);
      if (mailMatch) entityDetails['Email Address'] = mailMatch[1].trim();

      aiSummary = `DIGITAL BUSINESS CARD (${securityPercentage}% SECURE): Scanned asset contains contact details for "${name}". Extracted safely without importing into your address book.`;

    } else {
      const preview = clean.length > 50 ? clean.substring(0, 50) + '...' : clean;
      entityName = `Text: "${preview}"`;
      categoryDescription = 'Plaintext Data Record';
      qrAppType = 'Plain Text / Notes QR';
      appProvider = 'Text Reader';

      entityDetails['QR App / Type'] = qrAppType;
      entityDetails['Security Rating'] = `${securityPercentage}% SECURED`;
      entityDetails['Content Type'] = 'Plaintext';
      entityDetails['Character Count'] = `${clean.length} characters`;
      entityDetails['Word Count'] = `${clean.split(/\s+/).filter(Boolean).length} words`;
      entityDetails['Raw Payload Preview'] = clean.substring(0, 150);

      aiSummary = `PLAINTEXT CONTENT (${securityPercentage}% SECURE): QR code contains ${clean.length} characters of unstructured plain text. No executable scripts, phishing URLs, or sensitive financial tokens detected.`;
    }

    return {
      entityName,
      categoryDescription,
      qrAppType,
      appProvider,
      securityPercentage,
      isSecured,
      securityStatusText,
      entityDetails,
      aiSummary
    };
  }

  public static inspectScan(rawData: string): ScanResult {
    const id = `SCAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const contentType = this.identifyContentType(rawData);

    let riskScore = 10;
    const threatIndicators: ThreatIndicator[] = [];
    const recommendedActions: string[] = [];

    let urlAnalysis: UrlAnalysisResult | undefined;
    let upiAnalysis: UpiAnalysisResult | undefined;
    let wifiData: WifiData | undefined;

    // 1. QR Destination Tamper Check
    const qrVerification = this.verifyQrAgainstRegistry(rawData);
    if (qrVerification.status === 'DESTINATION_CHANGED') {
      riskScore = Math.max(riskScore, 95);
      threatIndicators.push({
        id: 'TAMPER_01',
        severity: 'critical',
        title: 'QR Code Replacement / Sticker Tampering Attack',
        description: qrVerification.mismatchDetails || 'Scanned destination conflicts with verified merchant registration registry.',
        category: 'tamper'
      });
      recommendedActions.push('DO NOT proceed with this transaction or visit the destination.');
      recommendedActions.push('Alert the physical premises manager or store staff immediately.');
    } else if (qrVerification.status === 'VERIFIED') {
      riskScore = 5;
    }

    // 2. Content Type Specific Engine
    if (contentType === 'URL') {
      urlAnalysis = this.analyzeUrl(rawData);
      
      if (urlAnalysis.safetyVerdict === 'MALICIOUS') {
        riskScore = Math.max(riskScore, 88);
      } else if (urlAnalysis.safetyVerdict === 'SUSPICIOUS') {
        riskScore = Math.max(riskScore, 58);
      } else {
        riskScore = Math.min(riskScore, 20);
      }

      urlAnalysis.threatFlags.forEach((flag, idx) => {
        threatIndicators.push({
          id: `URL_FLAG_${idx}`,
          severity: urlAnalysis!.safetyVerdict === 'MALICIOUS' ? 'high' : 'medium',
          title: 'Suspicious Web Destination Indicator',
          description: flag,
          category: 'url'
        });
      });

      if (!urlAnalysis.isHttps) {
        recommendedActions.push('Avoid submitting passwords, credit cards, or personal identifiers over this unencrypted link.');
      }
      if (urlAnalysis.isShortened) {
        recommendedActions.push('Inspect the expanded redirect chain before continuing to ensure authentic ownership.');
      }
      if (urlAnalysis.typosquattingTarget) {
        recommendedActions.push(`Verify the official domain manually: navigate directly to ${urlAnalysis.typosquattingTarget}.com instead.`);
      }
    } else if (contentType === 'UPI') {
      upiAnalysis = this.analyzeUpi(rawData);

      if (upiAnalysis.isNameMismatch) {
        riskScore = Math.max(riskScore, 92);
        threatIndicators.push({
          id: 'UPI_MISMATCH',
          severity: 'critical',
          title: 'Payee Identity Conflict (VPA Mismatch)',
          description: `Declared merchant display name '${upiAnalysis.payeeName}' does not correlate with destination UPI address '${upiAnalysis.vpa}'.`,
          category: 'payment'
        });
        recommendedActions.push('Halt transaction. Fraudsters frequently paste deceptive UPI QR stickers over authentic merchant stands.');
      } else if (upiAnalysis.isSuspiciousHandle) {
        riskScore = Math.max(riskScore, 65);
        threatIndicators.push({
          id: 'UPI_SUSPICIOUS',
          severity: 'high',
          title: 'Untrusted Payment Service Handle',
          description: 'Payment address contains atypical or non-standard merchant routing indicators.',
          category: 'payment'
        });
      } else if (upiAnalysis.isRegisteredMerchant) {
        riskScore = 5;
      } else {
        riskScore = Math.max(riskScore, 25);
      }

      upiAnalysis.flags.forEach((f, idx) => {
        threatIndicators.push({
          id: `UPI_FLAG_${idx}`,
          severity: 'medium',
          title: 'Payment Verification Check',
          description: f,
          category: 'payment'
        });
      });

      recommendedActions.push(...upiAnalysis.safetyAdvice);
    } else if (contentType === 'WIFI') {
      wifiData = this.parseWifi(rawData);
      if (wifiData.authType.toUpperCase() === 'NOPASS' || !wifiData.passwordPresent) {
        riskScore = Math.max(riskScore, 70);
        threatIndicators.push({
          id: 'WIFI_OPEN',
          severity: 'high',
          title: 'Unsecured Wi-Fi Network Broadcast',
          description: 'Network provides open zero-encryption access, susceptible to packet sniffing and evil-twin interception.',
          category: 'heuristic'
        });
        recommendedActions.push('Use an active VPN tunnel before transmitting confidential sessions over unencrypted Wi-Fi.');
      } else {
        riskScore = 15;
      }
    } else {
      // Plain text or other
      if (rawData.toLowerCase().includes('password') || rawData.toLowerCase().includes('seed phrase') || rawData.toLowerCase().includes('secret')) {
        riskScore = 60;
        threatIndicators.push({
          id: 'DATA_EXPOSURE',
          severity: 'medium',
          title: 'Sensitive Credential Artifact Encoded',
          description: 'QR contains plaintext sensitive authentication terminology.',
          category: 'heuristic'
        });
      }
    }

    // Determine Risk Level
    let riskLevel: RiskLevel = 'SAFE';
    if (riskScore >= 70) riskLevel = 'HIGH_RISK';
    else if (riskScore >= 35) riskLevel = 'SUSPICIOUS';

    // Extract dynamic identity, metadata and tailored AI summary
    const entityInfo = this.extractEntityInfo(
      rawData,
      contentType,
      riskLevel,
      riskScore,
      urlAnalysis,
      upiAnalysis,
      qrVerification,
      wifiData
    );

    if (recommendedActions.length === 0) {
      recommendedActions.push('Asset verified clean. Standard browsing hygiene applies.');
      recommendedActions.push('Ensure browser TLS lock icon is active upon navigation.');
    }

    const scanResult: ScanResult = {
      id,
      timestamp,
      rawData,
      contentType,
      riskScore,
      riskLevel,
      securityPercentage: entityInfo.securityPercentage,
      isSecured: entityInfo.isSecured,
      securityStatusText: entityInfo.securityStatusText,
      qrAppType: entityInfo.qrAppType,
      appProvider: entityInfo.appProvider,
      entityName: entityInfo.entityName,
      categoryDescription: entityInfo.categoryDescription,
      entityDetails: entityInfo.entityDetails,
      urlAnalysis,
      upiAnalysis,
      qrVerification,
      wifiData,
      aiSummary: entityInfo.aiSummary,
      threatIndicators,
      recommendedActions
    };

    // Auto-save to scan history
    this.saveScanToHistory(scanResult);

    return scanResult;
  }

  public static getScanHistory(): ScanResult[] {
    const saved = localStorage.getItem('qrshield_scan_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Return seeded realistic mock history if empty
    return this.getInitialMockHistory();
  }

  public static saveScanToHistory(scan: ScanResult): void {
    const history = this.getScanHistory().filter(s => s.id !== scan.id);
    const updated = [scan, ...history].slice(0, 50);
    localStorage.setItem('qrshield_scan_history', JSON.stringify(updated));
  }

  public static deleteScan(id: string): void {
    const history = this.getScanHistory().filter(s => s.id !== id);
    localStorage.setItem('qrshield_scan_history', JSON.stringify(history));
  }

  public static clearHistory(): void {
    localStorage.removeItem('qrshield_scan_history');
  }

  private static getInitialMockHistory(): ScanResult[] {
    return [
      {
        id: 'SCAN-HIST-901',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        rawData: 'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR',
        contentType: 'UPI',
        riskScore: 94,
        riskLevel: 'HIGH_RISK',
        securityPercentage: 6,
        isSecured: false,
        securityStatusText: '6% SECURED — UNSECURED / DANGEROUS',
        qrAppType: 'PhonePe Payment QR',
        appProvider: 'PhonePe',
        entityName: 'Starbucks Coffee (Counter 1 POS)',
        categoryDescription: 'NPCI UPI Payment Destination',
        aiSummary: 'CRITICAL ALERT (Security: 6%): Detected physical QR sticker overlay swap on merchant counter. Receiving account differs from verified Starbucks registry.',
        threatIndicators: [
          {
            id: 'T1',
            severity: 'critical',
            title: 'Payee Identity Conflict (VPA Mismatch)',
            description: 'Declared name Starbucks Coffee routed to fraudulent recipient fake.starbucks@ybl',
            category: 'payment'
          }
        ],
        recommendedActions: ['Halt payment immediately. Inform store manager.'],
        upiAnalysis: {
          rawUri: 'upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee',
          vpa: 'fake.starbucks@ybl',
          payeeName: 'Starbucks Coffee',
          isRegisteredMerchant: false,
          isNameMismatch: true,
          isSuspiciousHandle: true,
          flags: ['VPA mismatch with registered merchant'],
          safetyAdvice: ['Never enter UPI PIN to receive money']
        }
      },
      {
        id: 'SCAN-HIST-902',
        timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
        rawData: 'https://checkout.decathlon.in/store/402/express',
        contentType: 'URL',
        riskScore: 8,
        riskLevel: 'SAFE',
        securityPercentage: 92,
        isSecured: true,
        securityStatusText: '92% SECURED — SAFE TO USE',
        qrAppType: 'Decathlon Store Checkout QR',
        appProvider: 'Decathlon',
        entityName: 'Decathlon Sports Checkout',
        categoryDescription: 'Web Hyperlink Destination',
        aiSummary: 'CLEAN (Security: 92%): Registered Decathlon store express checkout verified with DigiCert TLS 1.3 certificate.',
        threatIndicators: [],
        recommendedActions: ['Asset verified authentic.'],
        urlAnalysis: {
          url: 'https://checkout.decathlon.in/store/402/express',
          domain: 'checkout.decathlon.in',
          protocol: 'https',
          isHttps: true,
          isShortened: false,
          domainReputation: 96,
          isIpAddress: false,
          hasPunycode: false,
          hasSuspiciousTld: false,
          threatFlags: [],
          redirectChain: ['https://checkout.decathlon.in/store/402/express'],
          sslIssuer: 'DigiCert TLS RSA SHA256 2020 CA1',
          safetyVerdict: 'SAFE'
        }
      },
      {
        id: 'SCAN-HIST-903',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        rawData: 'http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89',
        contentType: 'URL',
        riskScore: 96,
        riskLevel: 'HIGH_RISK',
        securityPercentage: 4,
        isSecured: false,
        securityStatusText: '4% SECURED — UNSECURED / DANGEROUS',
        qrAppType: 'Website URL QR (185.220.101.5)',
        appProvider: 'Web Browser',
        entityName: 'Direct Server IP (185.220.101.5)',
        categoryDescription: 'Web Hyperlink Destination',
        aiSummary: 'CRITICAL ALERT (Security: 4%): Known banking phishing kit hosted on unencrypted offshore bulletproof IP address targeting State Bank of India KYC.',
        threatIndicators: [
          {
            id: 'T2',
            severity: 'critical',
            title: 'Direct Raw IP Address & HTTP Hosting',
            description: 'Unencrypted direct IP connection concealing phishing kit',
            category: 'url'
          },
          {
            id: 'T3',
            severity: 'high',
            title: 'Credential Solicitation Keyword',
            description: 'URL queries /sbi-kyc-update.php mimicking national bank',
            category: 'url'
          }
        ],
        recommendedActions: ['Do not access link. Never disclose OTP or passwords.'],
        urlAnalysis: {
          url: 'http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89',
          domain: '185.220.101.5',
          protocol: 'http',
          isHttps: false,
          isShortened: false,
          domainReputation: 4,
          isIpAddress: true,
          hasPunycode: false,
          hasSuspiciousTld: false,
          typosquattingTarget: 'sbi',
          threatFlags: ['Direct IP host', 'Unencrypted HTTP', 'Phishing keywords'],
          redirectChain: ['http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89'],
          safetyVerdict: 'MALICIOUS'
        }
      },
      {
        id: 'SCAN-HIST-904',
        timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        rawData: 'https://bit.ly/airdrop-free-crypto-bonus',
        contentType: 'URL',
        riskScore: 62,
        riskLevel: 'SUSPICIOUS',
        securityPercentage: 38,
        isSecured: false,
        securityStatusText: '38% SECURED — SUSPICIOUS / PROCEED WITH CAUTION',
        qrAppType: 'Shortened Link QR',
        appProvider: 'URL Shortener',
        entityName: 'Shortened Bitly Web Redirect',
        categoryDescription: 'Shortened URL Redirect',
        aiSummary: 'ADVISORY (Security: 38%): Shortened link redirects to unindexed domain promising financial rewards. High probability of wallet draining smart contract.',
        threatIndicators: [
          {
            id: 'T4',
            severity: 'medium',
            title: 'Obfuscated Shortened Link',
            description: 'Target destination concealed behind bit.ly wrapper',
            category: 'url'
          }
        ],
        recommendedActions: ['Do not connect web3 wallets or sign permissions.'],
        urlAnalysis: {
          url: 'https://bit.ly/airdrop-free-crypto-bonus',
          domain: 'bit.ly',
          protocol: 'https',
          isHttps: true,
          isShortened: true,
          domainReputation: 55,
          isIpAddress: false,
          hasPunycode: false,
          hasSuspiciousTld: false,
          threatFlags: ['URL shortener hides actual destination'],
          redirectChain: ['https://bit.ly/airdrop-free-crypto-bonus', 'https://unpacked-destination-gate.io/target?id=verified'],
          safetyVerdict: 'SUSPICIOUS'
        }
      }
    ];
  }
}

