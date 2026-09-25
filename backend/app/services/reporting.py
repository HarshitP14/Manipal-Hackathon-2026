"""
Audit Dossier & Evidence Report Generator
Master PRD Section 15 & 41

Supports:
- Executive Audit Dossier PDF generation using ReportLab
- Tabular CSV / JSON export
- Adheres strictly to the 14-section PRD specification with neutral language
"""
import io
import csv
from typing import Dict, Any, List
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_audit_dossier_pdf(case_data: Dict[str, Any], tender_data: Dict[str, Any]) -> bytes:
    """
    Generates a professional forensic audit dossier PDF conforming to Section 15.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Styles (Indigo: #3F2A96, Cyan: #1497B8, Slate: #172033)
    primary_color = colors.HexColor("#3F2A96")
    cyan_color = colors.HexColor("#1497B8")
    slate_color = colors.HexColor("#172033")
    light_bg = colors.HexColor("#F4F6FA")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=primary_color,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=cyan_color,
        spaceAfter=14
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=slate_color
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#596579")
    )

    story = []

    # 1. Header
    story.append(Paragraph("CIVICGRAPH AUDIT — PROCUREMENT INTELLIGENCE DOSSIER", title_style))
    story.append(Paragraph("Automated Public Procurement Anomaly Detection Platform | Team Walkingdeadlines", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=12))

    # 2. Case Metadata Table
    case_no = case_data.get("case_no", "CASE-DEMO-01")
    t_id = tender_data.get("tender_id", "TND-2026-0101")
    priority = case_data.get("priority", "High")
    status = case_data.get("status", "UNDER_REVIEW")
    assignee = case_data.get("assignee", "Senior Auditor")
    score = tender_data.get("attention_score", 85)
    level = tender_data.get("risk_level", "High")

    meta_data = [
        [Paragraph("<b>Dossier Ref:</b>", body_style), Paragraph(case_no, body_style),
         Paragraph("<b>Generated:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M"), body_style)],
        [Paragraph("<b>Tender ID:</b>", body_style), Paragraph(t_id, body_style),
         Paragraph("<b>Priority / Status:</b>", body_style), Paragraph(f"{priority} / {status}", body_style)],
        [Paragraph("<b>Assignee:</b>", body_style), Paragraph(assignee, body_style),
         Paragraph("<b>Attention Score:</b>", body_style), Paragraph(f"<b>{score}/100 ({level})</b>", body_style)],
    ]
    t_meta = Table(meta_data, colWidths=[90, 170, 110, 160])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 3. Procurement Overview
    story.append(Paragraph("1. Procurement Overview", h2_style))
    dept = tender_data.get("department", "Public Works")
    cat = tender_data.get("category", "Infrastructure")
    award = tender_data.get("award_amount", 0.0)
    winner = tender_data.get("winner_name", "Apex InfraTech")
    bidders = tender_data.get("bidder_count", 3)

    proc_text = (
        f"<b>Title:</b> {tender_data.get('title', 'N/A')}<br/>"
        f"<b>Department:</b> {dept} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Category:</b> {cat}<br/>"
        f"<b>Award Amount:</b> INR {award:,.2f} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Successful Bidder:</b> {winner}<br/>"
        f"<b>Total Participating Bidders:</b> {bidders}"
    )
    story.append(Paragraph(proc_text, body_style))
    story.append(Spacer(1, 10))

    # 4. Anomaly Signals & Structured Evidence
    story.append(Paragraph("2. Detection Signals & Grounded Evidence", h2_style))
    evidence_bundle = tender_data.get("evidence_bundle") or {}
    components = evidence_bundle.get("components", [])

    if components:
        sig_data = [["Signal", "Weight", "Evidence Summary", "Peer Baseline"]]
        for c in components:
            sig_data.append([
                Paragraph(f"<b>{c['name']}</b>", body_style),
                Paragraph(f"+{c['contribution']} pts", body_style),
                Paragraph(c['evidence'], body_style),
                Paragraph(c.get('peer_baseline', 'N/A'), body_style)
            ])
        t_sig = Table(sig_data, colWidths=[120, 60, 210, 140])
        t_sig.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_sig)
    else:
        story.append(Paragraph("No anomalous risk signals flagged above baseline threshold.", body_style))

    story.append(Spacer(1, 10))

    # 5. Investigator Notes
    story.append(Paragraph("3. Investigator Notes & Action Log", h2_style))
    notes = case_data.get("notes", [])
    if notes:
        for n in notes:
            author = n.get("author_name", "Investigator")
            body = n.get("body", "")
            story.append(Paragraph(f"• <b>{author}:</b> {body}", body_style))
    else:
        story.append(Paragraph("Case opened for human verification. Formal review proceedings active.", body_style))

    story.append(Spacer(1, 14))

    # 6. Responsible-Use Disclaimer (Mandatory per PRD Section 19.3)
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#9CA3AF"), spaceAfter=6))
    story.append(Paragraph(
        "<b>CIVICGRAPH AUDIT RESPONSIBLE-USE DISCLAIMER:</b><br/>"
        "CivicGraph Audit identifies statistical, structural, and textual anomalies for human review. "
        "A risk signal or elevated attention score is not proof of wrongdoing, fraud, collusion, or illegality, "
        "and must not replace formal procurement audits, administrative inquiries, or legal proceedings.",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
