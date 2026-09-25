"""
Threshold Proximity / Smurfing Anomaly Engine
Master PRD Section 19 & Appendix A

Detects procurement award values clustering right below statutory financial / audit authorization thresholds
(e.g., ₹5,00,000, ₹10,00,000, ₹50,00,000, ₹1,00,00,000, ₹5,00,00,000).
Threshold proximity does NOT imply wrongdoing; it provides a neutral signal of potential threshold sensitivity.
"""
from typing import Dict, Any, List

# Default statutory procurement threshold tiers in INR (configurable)
DEFAULT_STATUTORY_THRESHOLDS = [
    500000.0,    # 5 Lakhs (minor work / direct quotation limit)
    1000000.0,   # 10 Lakhs (divisional approval cap)
    2500000.0,   # 25 Lakhs (zonal sanction limit)
    5000000.0,   # 50 Lakhs (state departmental committee threshold)
    10000000.0,  # 1 Crore (major works oversight committee)
    50000000.0   # 5 Crores (cabinet approval threshold)
]

def evaluate_threshold_proximity(
    award_amount: float,
    configured_thresholds: List[float] = None,
    proximity_tolerance_pct: float = 3.0
) -> Dict[str, Any]:
    """
    Evaluates how closely an award amount sits beneath the nearest major statutory threshold.
    If 0.05% <= (threshold - award) / threshold <= proximity_tolerance_pct (3.0%),
    flags as a high-confidence threshold proximity signal.
    """
    if award_amount <= 0:
        return {
            "score": 0.0,
            "detected": False,
            "evidence": "Zero or negative award amount recorded.",
            "metrics": {}
        }

    thresholds = configured_thresholds or DEFAULT_STATUTORY_THRESHOLDS
    nearest_upper_threshold = None
    min_distance_pct = None

    for thresh in sorted(thresholds):
        if thresh >= award_amount:
            distance = thresh - award_amount
            dist_pct = (distance / thresh) * 100.0
            nearest_upper_threshold = thresh
            min_distance_pct = dist_pct
            break

    if nearest_upper_threshold is None or min_distance_pct is None:
        return {
            "score": 0.0,
            "detected": False,
            "evidence": f"Award value of ₹{award_amount:,.2f} exceeds all configured threshold tiers.",
            "metrics": {"award_amount": award_amount}
        }

    # Proximity scoring
    # If within 0.1% to 1.0% below threshold -> Score 85-95
    # If within 1.0% to 3.0% below threshold -> Score 50-75
    # If > 3% below -> Score decays
    score = 0.0
    detected = False
    evidence_text = ""

    if 0.0 < min_distance_pct <= 0.8:
        score = 90.0
        detected = True
        evidence_text = (
            f"Award value of ₹{award_amount:,.2f} is clustered {min_distance_pct:.2f}% below the statutory threshold "
            f"of ₹{nearest_upper_threshold:,.2f} (delta: ₹{nearest_upper_threshold - award_amount:,.2f})."
        )
    elif min_distance_pct <= proximity_tolerance_pct:
        score = 65.0 + (3.0 - min_distance_pct) * 10.0
        detected = True
        evidence_text = (
            f"Award value of ₹{award_amount:,.2f} is within {min_distance_pct:.2f}% of statutory threshold "
            f"tier ₹{nearest_upper_threshold:,.2f}."
        )
    else:
        evidence_text = f"Award amount is {min_distance_pct:.1f}% removed from upper threshold of ₹{nearest_upper_threshold:,.2f}."

    return {
        "score": round(score, 1),
        "detected": detected,
        "evidence": evidence_text,
        "neutral_label": "Threshold-proximity signal" if detected else "Within standard threshold buffer",
        "metrics": {
            "award_amount": award_amount,
            "nearest_threshold": nearest_upper_threshold,
            "distance_amount": nearest_upper_threshold - award_amount,
            "distance_percentage": round(min_distance_pct, 2)
        }
    }
