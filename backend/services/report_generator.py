"""
PDF Security Report Generator using ReportLab.
Generates audit-ready cybersecurity documentation for forensic investigations and compliance.
Palette: Obsidian Black (#050505) x Chrome Silver (#C0C0C0) x Laser Crimson Red (#FF0033).
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from config import Config
from utils.security import safe_report_filename

class ReportGenerator:
    """PDF forensic audit report generation engine."""

    def __init__(self):
        self.reports_dir = Path(Config.REPORTS_DIR)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_pdf(self, scan_data: dict) -> str:
        """
        Generate a professional PDF cybersecurity report from scan forensic dictionary.
        Returns the absolute filesystem path of the generated PDF.
        """
        scan_id = scan_data.get("scan_id") or scan_data.get("id", "UNKNOWN")
        filename = safe_report_filename(scan_id)
        filepath = self.reports_dir / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Styles with Obsidian Black, Chrome Silver, and Laser Crimson Red
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#050505'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#FF0033'),
            fontName='Helvetica-Bold'
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#050505'),
            fontName='Helvetica-Bold'
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#27272A')
        )
        code_style = ParagraphStyle(
            'CodeStyle',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#050505')
        )

        elements = []

        # Header Title Banner
        elements.append(Paragraph("QRSHIELD CYBERSECURITY AUDIT REPORT", title_style))
        elements.append(Paragraph("AI-POWERED QR THREAT INTELLIGENCE & FORENSIC INVESTIGATION", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#FF0033'), spaceAfter=15))

        # Metadata Table
        risk_level = scan_data.get("risk_level", "LOW")
        risk_color = colors.HexColor('#FF0033') if risk_level in ("HIGH", "HIGH_RISK") else (colors.HexColor('#CC0029') if risk_level in ("MEDIUM", "SUSPICIOUS") else colors.HexColor('#71717A'))

        meta_data = [
            [
                Paragraph("<b>Incident Scan ID:</b>", body_style),
                Paragraph(str(scan_id), code_style),
                Paragraph("<b>Audit Date:</b>", body_style),
                Paragraph(str(scan_data.get("created_at") or scan_data.get("timestamp", "N/A")), body_style)
            ],
            [
                Paragraph("<b>Content Classification:</b>", body_style),
                Paragraph(str(scan_data.get("content_type", "UNKNOWN")), body_style),
                Paragraph("<b>Composite Risk Score:</b>", body_style),
                Paragraph(f"<font color='{risk_color.hexval()}'><b>{scan_data.get('risk_score', 0)} / 100 ({risk_level})</b></font>", body_style)
            ]
        ]

        meta_table = Table(meta_data, colWidths=[130, 140, 120, 150])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F4F4F5')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#C0C0C0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E4E4E7')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # Extracted Destination Section (Sanitized)
        elements.append(Paragraph("1. EXTRACTED PAYLOAD DESTINATION (SANITIZED SANDBOX)", section_heading))
        raw_dest = scan_data.get("qr_content") or scan_data.get("rawData", "N/A")
        dest_para = Paragraph(raw_dest, code_style)
        dest_table = Table([[dest_para]], colWidths=[540])
        dest_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAFAFA')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#C0C0C0')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(dest_table)
        elements.append(Spacer(1, 15))

        # Executive Summary & AI Narrative
        elements.append(Paragraph("2. EXECUTIVE FORENSIC ASSESSMENT", section_heading))
        explanation_text = scan_data.get("explanation", "Standard security evaluation completed.")
        elements.append(Paragraph(explanation_text, body_style))
        elements.append(Spacer(1, 15))

        # Threat Findings Breakdown
        elements.append(Paragraph("3. IDENTIFIED THREAT INDICATORS & EVIDENCE", section_heading))
        findings = scan_data.get("findings", [])
        if not findings and "threat_analyses" in scan_data:
            findings = scan_data["threat_analyses"]

        if findings:
            findings_data = [["Severity", "Threat Type", "Description"]]
            for f in findings:
                sev = f.get("severity", "MEDIUM").upper()
                ttype = f.get("threat_type") or f.get("type", "ANOMALY")
                desc = f.get("description", "Security anomaly identified.")
                findings_data.append([
                    Paragraph(f"<b>{sev}</b>", body_style),
                    Paragraph(ttype, code_style),
                    Paragraph(desc, body_style)
                ])

            findings_table = Table(findings_data, colWidths=[70, 150, 320])
            findings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#050505')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#C0C0C0')),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(findings_table)
        else:
            elements.append(Paragraph("<i>No active security threats, phishing vectors, or recipient mismatches identified.</i>", body_style))

        elements.append(Spacer(1, 15))

        # Recommended Safety Actions
        elements.append(Paragraph("4. RECOMMENDED REMEDIATION PROTOCOLS", section_heading))
        recommendation_text = scan_data.get("recommendation", "Standard digital security hygiene applies.")
        elements.append(Paragraph(f"• {recommendation_text}", body_style))
        elements.append(Paragraph("• Verify destination authenticity before disclosing credentials or authorizing banking transactions.", body_style))
        elements.append(Paragraph("• Remember: NPCI UPI PIN is strictly for debiting funds and never needed to receive money.", body_style))

        elements.append(Spacer(1, 20))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#C0C0C0'), spaceAfter=10))
        elements.append(Paragraph(
            "<font size='7' color='#71717A'>CONFIDENTIAL CYBERSECURITY REPORT | QRSHIELD DEFENSE PLATFORM | "
            "Evaluated in compliance with NPCI 2.1 UPI Guidelines, OWASP Mobile Top 10, and ISO 27001 Forensics.</font>",
            body_style
        ))

        doc.build(elements)
        return str(filepath)

report_generator = ReportGenerator()
