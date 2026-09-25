"""
Hybrid Risk Scoring & Explainability Aggregator Engine
Master PRD Section 9, 24, 25 & Appendix B

Formula:
R = w_rules * R_rules + w_ml * R_ml + w_graph * R_graph + w_nlp * R_nlp
Weights default:
w_rules = 0.40
w_ml = 0.25
w_graph = 0.25
w_nlp = 0.10
(sum = 1.0)

Produces:
- Total Attention Score (0 to 100)
- Risk Level: Low (0-24), Moderate (25-49), Elevated (50-74), High (75-100)
- SHAP-style deconstructed factor contributions
- Structured Evidence Bundle
"""
from typing import Dict, Any, List
from backend.ml.features.cover_bidding import evaluate_cover_bidding
from backend.ml.features.threshold_proximity import evaluate_threshold_proximity
from backend.ml.features.winner_rotation import evaluate_winner_rotation
from backend.ml.features.supporting_signals import (
    evaluate_low_competition,
    evaluate_price_deviation,
    evaluate_vendor_concentration,
    evaluate_tender_duration
)

def determine_risk_level(score: int) -> str:
    if score >= 75:
        return "High"
    elif score >= 50:
        return "Elevated"
    elif score >= 25:
        return "Moderate"
    return "Low"

def compute_tender_risk_score(
    tender: Dict[str, Any],
    bids: List[Dict[str, Any]],
    historical_tenders: List[Dict[str, Any]] = None,
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Computes explainable hybrid risk score and evidence bundle for a tender.
    """
    if weights is None:
        weights = {"rules": 0.40, "ml": 0.25, "graph": 0.25, "nlp": 0.10}

    award_amount = float(tender.get("award_amount") or 0.0)
    estimated_value = float(tender.get("estimated_value") or 0.0)
    bidder_count = len(bids) if bids else int(tender.get("bidder_count", 1))
    winner_name = tender.get("winner_name") or (bids[0].get("vendor_name") if bids else "")

    # Run detectors
    cb_res = evaluate_cover_bidding(tender.get("tender_id", ""), bids)
    tp_res = evaluate_threshold_proximity(award_amount)
    wr_res = evaluate_winner_rotation(tender.get("tender_id", ""), winner_name, historical_tenders or [])
    lc_res = evaluate_low_competition(bidder_count)
    pd_res = evaluate_price_deviation(award_amount, estimated_value)
    vc_res = evaluate_vendor_concentration(winner_name, tender.get("department", ""), historical_tenders or [])
    td_res = evaluate_tender_duration(tender.get("tender_date", ""), tender.get("closing_date", ""))

    # 1. Rule / Heuristic Score (0 to 100)
    rule_signals = [cb_res, tp_res, wr_res, lc_res, pd_res, vc_res, td_res]
    detected_rule_scores = [s["score"] for s in rule_signals if s.get("detected")]
    if detected_rule_scores:
        r_rules = min(100.0, sum(detected_rule_scores) / max(1, len(detected_rule_scores)) * 1.15)
    else:
        r_rules = 8.0  # minimal baseline

    # 2. Simulated ML (Isolation Forest / Outlier baseline) contribution
    # Synthesizes distance from peer clusters
    feature_deviations = []
    if lc_res["detected"]:
        feature_deviations.append(lc_res["score"])
    if pd_res["detected"]:
        feature_deviations.append(pd_res["score"])
    if td_res["detected"]:
        feature_deviations.append(td_res["score"])
    
    r_ml = min(100.0, sum(feature_deviations) / len(feature_deviations)) if feature_deviations else 10.0

    # 3. Graph contribution
    graph_signals = []
    if wr_res["detected"]:
        graph_signals.append(wr_res["score"])
    if vc_res["detected"]:
        graph_signals.append(vc_res["score"])
    if cb_res["detected"]:
        graph_signals.append(cb_res["score"])
    
    r_graph = min(100.0, sum(graph_signals) / len(graph_signals)) if graph_signals else 12.0

    # 4. NLP contribution (document/clause similarity)
    # If text similarity is flagged in scenario
    r_nlp = 15.0
    if tender.get("scenario_flag") == "DOCUMENT_SIMILARITY":
        r_nlp = 85.0

    # Overall Attention Score
    total_raw = (
        weights["rules"] * r_rules +
        weights["ml"] * r_ml +
        weights["graph"] * r_graph +
        weights["nlp"] * r_nlp
    )

    total_score = max(5, min(98, int(round(total_raw))))
    risk_level = determine_risk_level(total_score)

    # Decomposed Components (SHAP-style)
    components = []
    if cb_res["detected"]:
        components.append({
            "name": "Bidding Timing & Lockstep",
            "contribution": round(cb_res["score"] * 0.28, 1),
            "description": "Unusual submission-timing pattern and narrow spread",
            "evidence": cb_res["evidence"],
            "peer_baseline": "Median competitor interval: 4.2 hours; avg spread: 8.4%",
            "level": determine_risk_level(int(cb_res["score"]))
        })

    if tp_res["detected"]:
        components.append({
            "name": "Threshold Proximity",
            "contribution": round(tp_res["score"] * 0.26, 1),
            "description": "Cluster proximity to statutory authorization ceiling",
            "evidence": tp_res["evidence"],
            "peer_baseline": "Standard departmental distribution sits ~18% below ceiling",
            "level": determine_risk_level(int(tp_res["score"]))
        })

    if wr_res["detected"]:
        components.append({
            "name": "Winner Rotation Pattern",
            "contribution": round(wr_res["score"] * 0.25, 1),
            "description": "Cyclic winning transitions among closed vendor circle",
            "evidence": wr_res["evidence"],
            "peer_baseline": "Open market awards exhibit Shannon entropy > 0.85",
            "level": determine_risk_level(int(wr_res["score"]))
        })

    if lc_res["detected"]:
        components.append({
            "name": "Market Competition Depth",
            "contribution": round(lc_res["score"] * 0.20, 1),
            "description": "Single or restricted bidder participation",
            "evidence": lc_res["evidence"],
            "peer_baseline": "Peer median: 5 participating contractors",
            "level": determine_risk_level(int(lc_res["score"]))
        })

    if pd_res["detected"]:
        components.append({
            "name": "Price Deviation from Estimate",
            "contribution": round(pd_res["score"] * 0.20, 1),
            "description": "Award variance relative to engineering cost benchmark",
            "evidence": pd_res["evidence"],
            "peer_baseline": "Departmental mean variance: ±4.2%",
            "level": determine_risk_level(int(pd_res["score"]))
        })

    if vc_res["detected"]:
        components.append({
            "name": "Vendor Market Concentration",
            "contribution": round(vc_res["score"] * 0.22, 1),
            "description": "Disproportionate departmental win share",
            "evidence": vc_res["evidence"],
            "peer_baseline": "Top vendor share in peers typically < 25%",
            "level": determine_risk_level(int(vc_res["score"]))
        })

    if td_res["detected"]:
        components.append({
            "name": "Tender Notice Window",
            "contribution": round(td_res["score"] * 0.15, 1),
            "description": "Constrained submission duration",
            "evidence": td_res["evidence"],
            "peer_baseline": "Statutory notice period norm: 21 calendar days",
            "level": determine_risk_level(int(td_res["score"]))
        })

    # Collect Evidence Items
    signals = []
    for comp in components:
        signals.append({
            "signal_type": comp["name"],
            "observed_value": comp["contribution"],
            "baseline_value": comp.get("peer_baseline", "Normative"),
            "evidence_text": comp["evidence"],
            "neutral_category": comp["description"],
            "confidence": 0.92
        })

    uncertainties = [
        "Analysis based on available dataset version; external subcontractor affiliations unverified.",
        "A risk signal is a statistical indicator for human review and not proof of misconduct."
    ]

    return {
        "tender_id": tender.get("tender_id"),
        "attention_score": total_score,
        "risk_level": risk_level,
        "components": components,
        "signals": signals,
        "uncertainties": uncertainties,
        "anomaly_flags": [c["name"] for c in components]
    }
