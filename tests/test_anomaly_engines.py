"""
CivicGraph Audit — Anomaly Engines & Risk Scoring Unit Tests
Master PRD Section 20, 52
"""
try:
    import pytest
except ImportError:
    pytest = None

from backend.ml.features.cover_bidding import evaluate_cover_bidding
from backend.ml.features.threshold_proximity import evaluate_threshold_proximity
from backend.ml.features.winner_rotation import evaluate_winner_rotation
from backend.ml.features.supporting_signals import (
    evaluate_low_competition, evaluate_price_deviation, evaluate_vendor_concentration
)
from backend.ml.scoring.risk_engine import compute_tender_risk_score
from backend.app.services.copilot import CopilotService

def test_cover_bidding_detection():
    # Tight submission timestamps (<60s) and narrow margin (<1%)
    bids = [
        {"vendor_name": "Vendor A", "bid_amount": 100000.0, "bid_timestamp": "2026-02-01 10:00:00", "is_winner": True},
        {"vendor_name": "Vendor B", "bid_amount": 100500.0, "bid_timestamp": "2026-02-01 10:00:45", "is_winner": False}
    ]
    res = evaluate_cover_bidding("TND-TEST-01", bids)
    assert res["detected"] is True
    assert res["score"] >= 70.0
    assert "tight time window" in res["evidence"].lower()

def test_threshold_proximity():
    # Award of 4,985,000 against 5,000,000 threshold (0.3% below threshold)
    res = evaluate_threshold_proximity(4985000.0, [5000000.0])
    assert res["detected"] is True
    assert res["score"] >= 80.0
    assert "statutory threshold" in res["evidence"]

def test_winner_rotation():
    # Vendor A -> Vendor B -> Vendor C -> Vendor A rotation in historical sequence
    history = [
        {"tender_id": "T1", "tender_date": "2026-01-01", "winner_name": "Vendor Alpha"},
        {"tender_id": "T2", "tender_date": "2026-01-10", "winner_name": "Vendor Beta"},
        {"tender_id": "T3", "tender_date": "2026-01-20", "winner_name": "Vendor Gamma"},
        {"tender_id": "T4", "tender_date": "2026-02-01", "winner_name": "Vendor Alpha"},
        {"tender_id": "T5", "tender_date": "2026-02-10", "winner_name": "Vendor Beta"},
    ]
    res = evaluate_winner_rotation("T5", "Vendor Beta", history)
    assert res["detected"] is True
    assert res["score"] >= 50.0

def test_low_competition_single_bidder():
    res = evaluate_low_competition(bidder_count=1, peer_median_bidders=5.0)
    assert res["detected"] is True
    assert res["score"] >= 80.0
    assert "1 bidder vs peer median" in res["evidence"]

def test_risk_score_aggregation():
    tender = {
        "tender_id": "TND-HIGH-01",
        "title": "Road Overbridge Civil Work",
        "department": "Public Works",
        "award_amount": 4985000.0,
        "estimated_value": 4990000.0,
        "tender_date": "2026-01-10",
        "closing_date": "2026-01-14",  # short window
        "winner_name": "Vendor Alpha"
    }
    bids = [
        {"vendor_name": "Vendor Alpha", "bid_amount": 4985000.0, "bid_timestamp": "2026-01-14 10:00:00", "is_winner": True},
        {"vendor_name": "Vendor Beta", "bid_amount": 4988000.0, "bid_timestamp": "2026-01-14 10:00:30", "is_winner": False}
    ]
    res = compute_tender_risk_score(tender, bids)
    assert res["attention_score"] >= 50
    assert res["risk_level"] in ["Elevated", "High"]
    assert len(res["components"]) >= 2
    assert "uncertainties" in res

def test_copilot_deterministic_fallback():
    service = CopilotService()
    service.provider = "template_fallback"
    tender_data = {
        "tender_id": "TND-TEST-02",
        "title": "Solar Lighting Array",
        "department": "Renewable Energy",
        "award_amount": 7500000.0,
        "attention_score": 82,
        "risk_level": "High",
        "evidence_bundle": {
            "attention_score": 82,
            "risk_level": "High",
            "components": [
                {"name": "Low Competition", "contribution": 24.0, "description": "Single bidder", "evidence": "1 bidder vs peer median 5"}
            ]
        }
    }
    copilot_res = service.analyze_tender_copilot(tender_data, "Why was this flagged?")
    assert copilot_res["provider"] == "deterministic_fallback"
    assert "summary" in copilot_res
    assert len(copilot_res["observed_facts"]) >= 1
    assert len(copilot_res["recommended_review_actions"]) >= 1
    # Verify neutral tone
    full_text = " ".join(copilot_res["observed_facts"] + copilot_res["risk_factors"])
    assert "fraud" not in full_text.lower()
    assert "crime" not in full_text.lower()
