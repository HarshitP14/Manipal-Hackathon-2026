"""
CivicGraph Audit — FastAPI API & Integration Tests
Master PRD Section 20, 52
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check_api():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["total_tenders_loaded"] >= 10

def test_dashboard_stats_api():
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["procurements_analyzed"] >= 10
    assert data["total_procurement_value"] > 0
    assert "risk_distribution" in data

def test_list_tenders_api():
    response = client.get("/api/v1/tenders")
    assert response.status_code == 200
    tenders = response.json()
    assert len(tenders) >= 10
    # verify sorted by attention_score descending
    assert tenders[0]["attention_score"] >= tenders[-1]["attention_score"]

def test_get_tender_detail_and_risk_api():
    # Test cover-bidding tender
    response = client.get("/api/v1/tenders/TND-2026-0104")
    assert response.status_code == 200
    tender = response.json()
    assert tender["tender_id"] == "TND-2026-0104"
    assert len(tender["bids"]) >= 2
    assert "evidence_bundle" in tender
    assert tender["evidence_bundle"]["attention_score"] >= 50

def test_graph_api():
    response = client.get("/api/v1/graph")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    assert data["stats"]["total_nodes"] > 0

def test_copilot_query_api():
    payload = {
        "tender_id": "TND-2026-0104",
        "question": "Why was this tender flagged as high risk?"
    }
    response = client.post("/api/v1/copilot/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["observed_facts"]) > 0
    assert len(data["recommended_review_actions"]) > 0
    # ensure neutral language
    assert "fraud" not in data["summary"].lower()

def test_case_lifecycle_api():
    # 1. Create case
    case_payload = {
        "tender_id": "TND-2026-0101",
        "priority": "High",
        "assignee": "A. Sharma",
        "due_date": "2026-04-15",
        "notes": "Initiating threshold proximity audit verification."
    }
    create_res = client.post("/api/v1/cases", json=case_payload)
    assert create_res.status_code == 200
    case = create_res.json()
    case_id = case["id"]
    assert case["status"] == "NEW"

    # 2. Update status
    patch_res = client.patch(f"/api/v1/cases/{case_id}", json={"status": "UNDER_REVIEW"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "UNDER_REVIEW"

    # 3. Add note
    note_res = client.post(f"/api/v1/cases/{case_id}/notes", json={
        "author_name": "A. Sharma",
        "body": "Cross-checked engineering department sanction ledger."
    })
    assert note_res.status_code == 200

def test_pdf_dossier_export_api():
    response = client.get("/api/v1/reports/TND-2026-0104/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
