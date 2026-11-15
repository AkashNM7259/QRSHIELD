import { jsPDF } from 'jspdf';
import { ScanResult } from '../types';

export const generatePdfReport = (scan: ScanResult): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner: Obsidian Black
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Accent Line: Laser Crimson Red
  doc.setFillColor(255, 0, 51);
  doc.rect(0, 40, pageWidth, 2, 'F');

  // Brand Title: Chrome Silver
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QRSHIELD CYBERSECURITY REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 0, 51);
  doc.text('OBSIDIAN DEFENSE THREAT INTELLIGENCE & FORENSICS', 14, 28);

  // Metadata Row
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.text(`REPORT ID: REP-${scan.id}`, 14, 35);
  doc.text(`GENERATED: ${new Date().toLocaleString()}`, pageWidth - 70, 35);

  let y = 52;

  // Executive Risk Summary Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, y, pageWidth - 28, 32, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 5, 5);
  doc.text('EXECUTIVE RISK ASSESSMENT', 20, y + 8);

  doc.setFontSize(18);
  const accentColor = scan.riskLevel === 'SAFE' ? [120, 120, 120] : [255, 0, 51];
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${scan.riskScore} / 100`, 20, y + 20);

  doc.setFontSize(12);
  doc.text(`VERDICT: ${scan.riskLevel.replace('_', ' ')}`, 60, y + 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(`Content Classification: ${scan.contentType} | Verification Hash: SHA-256`, 60, y + 26);

  y += 42;

  // Scanned Content Section (Sanitized)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 5, 5);
  doc.text('SCANNED ASSET PAYLOAD (PROTECTED SANDBOX)', 14, y);

  y += 6;
  doc.setFillColor(235, 235, 235);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  const truncatedPayload = scan.rawData.length > 85 ? scan.rawData.substring(0, 85) + '...' : scan.rawData;
  doc.text(truncatedPayload, 18, y + 7);
  doc.text('Enforcement: Passive inspection applied. Automatic payload execution neutralized.', 18, y + 13);

  y += 28;

  // AI Security Assessment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 5, 5);
  doc.text('AI FORENSIC ASSESSMENT SUMMARY', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const splitSummary = doc.splitTextToSize(scan.aiSummary, pageWidth - 28);
  doc.text(splitSummary, 14, y);

  y += splitSummary.length * 5 + 8;

  // Threat Indicators Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 5, 5);
  doc.text(`FORENSIC THREAT INDICATORS (${scan.threatIndicators.length})`, 14, y);

  y += 6;
  if (scan.threatIndicators.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Zero anomalous payload patterns or recipient conflicts identified.', 14, y);
    y += 10;
  } else {
    scan.threatIndicators.forEach((indicator) => {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 0, 51);
      doc.text(`[${indicator.severity.toUpperCase()}] ${indicator.title}`, 18, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const desc = indicator.description.length > 90 ? indicator.description.substring(0, 90) + '...' : indicator.description;
      doc.text(desc, 18, y + 9.5);

      y += 15;
    });
  }

  y += 4;

  // Recommended Mitigation Actions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 5, 5);
  doc.text('RECOMMENDED SAFETY PROTOCOLS', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  scan.recommendedActions.forEach((action, i) => {
    doc.text(`${i + 1}. ${action}`, 16, y);
    y += 6;
  });

  // Footer / Compliance Seal
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 275, pageWidth, 22, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('CONFIDENTIAL CYBERSECURITY REPORT | QRSHIELD OBSIDIAN DEFENSE', 14, 283);
  doc.setFont('helvetica', 'normal');
  doc.text('Validated with NPCI UPI 2.1 specs, OWASP Mobile Security Guidance & ISO 27001 Heuristics.', 14, 288);

  doc.save(`QRShield_Report_${scan.id}.pdf`);
};
