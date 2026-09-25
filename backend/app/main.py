"""
CivicGraph Audit — Primary FastAPI Application
Master PRD Section 6, 16, 48, 49 & 56

Versioned API: /api/v1
- Interactive OpenAPI & ReDoc
- Neutral terminology
- Grounded Evidence, Risk Scoring, Bipartite Graph, Cases, and Copilot
"""
import io
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.app.schemas.procurement import (
    TenderSummary, TenderDetail, EvidenceBundle, BipartiteGraphResponse,
    CaseCreate, CaseUpdate, CaseNoteCreate, CaseRecord,
    CopilotQueryRequest, CopilotResponse
)
from backend.app.services.store import store
from backend.app.services.copilot import CopilotService
from backend.app.services.reporting import generate_audit_dossier_pdf
from backend.app.services.ingestion import (
    detect_column_mappings, parse_and_validate_records
)
from backend.ml.graph.graph_engine import build_bipartite_graph

app = FastAPI(
    title="CivicGraph Audit API",
    description="AI-Powered Public Procurement Anomaly Detection & Forensic Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

copilot_service = CopilotService()

# ---------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------
@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "CivicGraph Audit API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "total_tenders_loaded": len(store.tenders),
        "total_vendors_loaded": len(store.vendors)
    }

# ---------------------------------------------------------
# Dashboard & Analytics Overview
# ---------------------------------------------------------
@app.get("/api/v1/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats():
    tenders = list(store.tenders.values())
    total_val = sum(float(t.get("award_amount", 0.0)) for t in tenders)
    high_priority = sum(1 for t in tenders if t.get("risk_level") in ["High", "Elevated"])
    anomalous = sum(1 for t in tenders if t.get("attention_score", 0) >= 50)
    anomaly_rate = round((anomalous / len(tenders) * 100), 1) if tenders else 0.0

    # Risk distribution
    dist = {
        "Low": sum(1 for t in tenders if t.get("risk_level") == "Low"),
        "Moderate": sum(1 for t in tenders if t.get("risk_level") == "Moderate"),
        "Elevated": sum(1 for t in tenders if t.get("risk_level") == "Elevated"),
        "High": sum(1 for t in tenders if t.get("risk_level") == "High")
    }

    # Department breakdown
    dept_map = {}
    for t in tenders:
        d = t.get("department", "Unknown")
        dept_map[d] = dept_map.get(d, 0) + 1

    return {
        "procurements_analyzed": len(tenders),
        "total_procurement_value": total_val,
        "high_priority_cases": high_priority,
        "anomaly_rate_pct": anomaly_rate,
        "vendors_analyzed": len(store.vendors),
        "open_investigations": len(store.cases),
        "risk_distribution": dist,
        "department_counts": dept_map
    }

# ---------------------------------------------------------
# Procurement & Tender APIs
# ---------------------------------------------------------
@app.get("/api/v1/tenders", response_model=List[TenderSummary], tags=["Tenders"])
def list_tenders(
    department: Optional[str] = None,
    risk_level: Optional[str] = None,
    min_score: Optional[int] = None,
    search: Optional[str] = None
):
    results = list(store.tenders.values())

    if department:
        results = [t for t in results if t.get("department") == department]
    if risk_level:
        results = [t for t in results if t.get("risk_level") == risk_level]
    if min_score is not None:
        results = [t for t in results if t.get("attention_score", 0) >= min_score]
    if search:
        s = search.lower()
        results = [
            t for t in results if
            s in t.get("tender_id", "").lower() or
            s in t.get("title", "").lower() or
            s in t.get("winner_name", "").lower() or
            s in t.get("department", "").lower()
        ]

    # Sort by attention score descending
    results.sort(key=lambda x: x.get("attention_score", 0), reverse=True)
    return results

@app.get("/api/v1/tenders/{tender_id}", response_model=TenderDetail, tags=["Tenders"])
def get_tender(tender_id: str):
    t = store.tenders.get(tender_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found.")
    
    # Construct timeline
    timeline = [
        {"event": "Tender Notice Issued", "date": t.get("tender_date")},
        {"event": "Bid Submission Deadline", "date": t.get("closing_date")},
        {"event": "Financial Evaluation Completed", "date": t.get("closing_date")},
        {"event": "Contract Award", "date": t.get("closing_date")}
    ]
    t["timeline"] = timeline
    return t

@app.get("/api/v1/tenders/{tender_id}/risk", tags=["Tenders"])
def get_tender_risk(tender_id: str):
    t = store.tenders.get(tender_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found.")
    return {
        "tender_id": tender_id,
        "attention_score": t.get("attention_score"),
        "risk_level": t.get("risk_level"),
        "components": t.get("evidence_bundle", {}).get("components", []),
        "uncertainties": t.get("evidence_bundle", {}).get("uncertainties", [])
    }

@app.get("/api/v1/tenders/{tender_id}/evidence", tags=["Tenders"])
def get_tender_evidence(tender_id: str):
    t = store.tenders.get(tender_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found.")
    return t.get("evidence_bundle", {})

@app.get("/api/v1/tenders/{tender_id}/graph", tags=["Tenders"])
def get_tender_subgraph(tender_id: str):
    t = store.tenders.get(tender_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found.")
    bids = t.get("bids", [])
    # Filter graph around this tender and connected vendors
    return build_bipartite_graph([t], bids)

# ---------------------------------------------------------
# Vendor APIs
# ---------------------------------------------------------
@app.get("/api/v1/vendors", tags=["Vendors"])
def list_vendors():
    results = list(store.vendors.values())
    results.sort(key=lambda x: x.get("total_wins", 0), reverse=True)
    return results

@app.get("/api/v1/vendors/{vendor_name}", tags=["Vendors"])
def get_vendor(vendor_name: str):
    v = store.vendors.get(vendor_name)
    if not v:
        raise HTTPException(status_code=404, detail=f"Vendor '{vendor_name}' not found.")
    return v

@app.get("/api/v1/vendors/{vendor_name}/tenders", tags=["Vendors"])
def get_vendor_tenders(vendor_name: str):
    v = store.vendors.get(vendor_name)
    if not v:
        raise HTTPException(status_code=404, detail=f"Vendor '{vendor_name}' not found.")
    t_ids = v.get("tenders", [])
    return [store.tenders[t_id] for t_id in t_ids if t_id in store.tenders]

# ---------------------------------------------------------
# Graph Intelligence API
# ---------------------------------------------------------
@app.get("/api/v1/graph", response_model=BipartiteGraphResponse, tags=["Graph"])
def get_global_bipartite_graph(
    department: Optional[str] = None,
    min_score: Optional[int] = None
):
    tenders = list(store.tenders.values())
    if department:
        tenders = [t for t in tenders if t.get("department") == department]
    if min_score is not None:
        tenders = [t for t in tenders if t.get("attention_score", 0) >= min_score]

    return build_bipartite_graph(tenders, store.bids)

# ---------------------------------------------------------
# Investigation Cases API
# ---------------------------------------------------------
@app.get("/api/v1/cases", tags=["Investigation"])
def list_cases():
    return list(store.cases.values())

@app.post("/api/v1/cases", tags=["Investigation"])
def create_case(case_in: CaseCreate):
    t = store.tenders.get(case_in.tender_id)
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found.")

    case_no = f"CASE-{datetime.now().strftime('%Y%m%d')}-{len(store.cases) + 1:03d}"
    notes = []
    if case_in.notes:
        notes.append({
            "author_name": case_in.assignee or "Auditor",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "body": case_in.notes
        })

    new_case = {
        "id": case_no,
        "case_no": case_no,
        "tender_id": case_in.tender_id,
        "priority": case_in.priority,
        "status": "NEW",
        "assignee": case_in.assignee or "Unassigned",
        "due_date": case_in.due_date,
        "created_at": datetime.now().isoformat(),
        "notes": notes,
        "conclusion": None
    }
    store.cases[case_no] = new_case
    store.tenders[case_in.tender_id]["case_status"] = "NEW"
    return new_case

@app.get("/api/v1/cases/{case_id}", tags=["Investigation"])
def get_case(case_id: str):
    c = store.cases.get(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")
    return c

@app.patch("/api/v1/cases/{case_id}", tags=["Investigation"])
def update_case(case_id: str, updates: CaseUpdate):
    c = store.cases.get(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")

    if updates.status is not None:
        c["status"] = updates.status
        t_id = c.get("tender_id")
        if t_id and t_id in store.tenders:
            store.tenders[t_id]["case_status"] = updates.status
    if updates.priority is not None:
        c["priority"] = updates.priority
    if updates.assignee is not None:
        c["assignee"] = updates.assignee
    if updates.due_date is not None:
        c["due_date"] = updates.due_date
    if updates.conclusion is not None:
        c["conclusion"] = updates.conclusion

    return c

@app.post("/api/v1/cases/{case_id}/notes", tags=["Investigation"])
def add_case_note(case_id: str, note_in: CaseNoteCreate):
    c = store.cases.get(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")

    note_obj = {
        "author_name": note_in.author_name,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "body": note_in.body
    }
    c.setdefault("notes", []).append(note_obj)
    return note_obj

# ---------------------------------------------------------
# Grounded AI Copilot API
# ---------------------------------------------------------
@app.post("/api/v1/copilot/query", response_model=CopilotResponse, tags=["Copilot"])
def query_copilot(req: CopilotQueryRequest):
    tender = store.tenders.get(req.tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    return copilot_service.analyze_tender_copilot(tender, req.question)

# ---------------------------------------------------------
# Reporting & Dossier Export API
# ---------------------------------------------------------
@app.get("/api/v1/reports/{case_id}/pdf", tags=["Reports"])
def export_dossier_pdf(case_id: str):
    case = store.cases.get(case_id)
    if not case:
        # Fallback to tender if passed tender_id
        matching_case = next((c for c in store.cases.values() if c.get("tender_id") == case_id), None)
        if matching_case:
            case = matching_case
        else:
            # Create a mock temporary case wrapper for export
            t = store.tenders.get(case_id)
            if not t:
                raise HTTPException(status_code=404, detail="Neither case nor tender found.")
            case = {
                "case_no": f"DOSSIER-{case_id}",
                "tender_id": case_id,
                "priority": t.get("risk_level", "Elevated"),
                "status": "UNDER_REVIEW",
                "assignee": "Forensic Review Team",
                "notes": []
            }

    tender = store.tenders.get(case["tender_id"])
    if not tender:
        raise HTTPException(status_code=404, detail="Associated tender not found.")

    pdf_bytes = generate_audit_dossier_pdf(case, tender)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=CivicGraph_Dossier_{case['case_no']}.pdf"}
    )
