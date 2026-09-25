"""
Supporting Anomaly Signals Engine
Master PRD Section 9.3 & Appendix A

Implements:
1. Low Competition / Single Bidder Signal
2. Bid Spread & Price Deviation Signal
3. Vendor Concentration Signal
4. Tender Duration Anomaly
"""
from typing import Dict, Any, List
from datetime import datetime

def evaluate_low_competition(bidder_count: int, peer_median_bidders: float = 4.5) -> Dict[str, Any]:
    """
    Evaluates competition depth against peer baseline.
    """
    score = 0.0
    detected = False
    evidence_text = ""

    if bidder_count <= 1:
        score = 85.0
        detected = True
        evidence_text = f"1 bidder vs peer median of {int(peer_median_bidders)} participants in this department/category."
    elif bidder_count == 2:
        score = 45.0
        detected = True
        evidence_text = f"Only 2 bidders submitted quotes (peer baseline median: {int(peer_median_bidders)})."
    else:
        evidence_text = f"{bidder_count} bidders participated, consistent with peer median {peer_median_bidders:.1f}."

    return {
        "score": round(score, 1),
        "detected": detected,
        "evidence": evidence_text,
        "neutral_label": "Low competition signal" if detected else "Adequate market participation",
        "metrics": {"bidder_count": bidder_count, "peer_median": peer_median_bidders}
    }

def evaluate_price_deviation(
    award_amount: float,
    estimated_value: float,
    peer_mean_ratio: float = 0.98
) -> Dict[str, Any]:
    """
    Evaluates variance between award amount and engineering estimate / peer baseline.
    """
    if estimated_value <= 0 or award_amount <= 0:
        return {"score": 0.0, "detected": False, "evidence": "Estimate or award amount missing.", "metrics": {}}

    ratio = award_amount / estimated_value
    deviation_pct = (ratio - 1.0) * 100.0

    score = 0.0
    detected = False
    evidence_text = ""

    if deviation_pct >= 15.0:
        score = 80.0
        detected = True
        evidence_text = f"Award amount of ₹{award_amount:,.2f} is {deviation_pct:+.1f}% above the engineer estimate (peer avg: {peer_mean_ratio*100:.1f}%)."
    elif deviation_pct <= -25.0:
        score = 65.0
        detected = True
        evidence_text = f"Unusually deep discount ({deviation_pct:.1f}% below estimate) raising risk of non-performance or aggressive unviable underbidding."
    else:
        evidence_text = f"Award is {deviation_pct:+.1f}% of baseline estimate, inside normative range."

    return {
        "score": round(score, 1),
        "detected": detected,
        "evidence": evidence_text,
        "neutral_label": "Price-deviation signal" if detected else "Price aligns with budget estimate",
        "metrics": {"award_to_estimate_ratio": round(ratio, 3), "deviation_pct": round(deviation_pct, 1)}
    }

def evaluate_vendor_concentration(
    vendor_name: str,
    department: str,
    historical_awards: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates whether a single vendor captures an anomalous share of contracts in a department.
    """
    if not vendor_name or not historical_awards:
        return {"score": 0.0, "detected": False, "evidence": "Insufficient historical awards for vendor.", "metrics": {}}

    dept_awards = [a for a in historical_awards if a.get("department") == department]
    total_dept_awards = len(dept_awards)

    if total_dept_awards < 3:
        return {"score": 0.0, "detected": False, "evidence": "Insufficient departmental history.", "metrics": {}}

    vendor_wins = sum(1 for a in dept_awards if a.get("winner_name") == vendor_name)
    win_rate = vendor_wins / total_dept_awards

    score = 0.0
    detected = False
    evidence_text = ""

    if win_rate >= 0.70 and vendor_wins >= 3:
        score = 85.0
        detected = True
        evidence_text = f"Vendor '{vendor_name}' captured {vendor_wins} of {total_dept_awards} ({win_rate*100:.0f}%) recent tenders in {department} (peer benchmark: < 28%)."
    elif win_rate >= 0.50 and vendor_wins >= 2:
        score = 50.0
        detected = True
        evidence_text = f"Vendor captured {vendor_wins} of {total_dept_awards} ({win_rate*100:.0f}%) tenders in {department}."
    else:
        evidence_text = f"Vendor market share ({win_rate*100:.0f}%) is within expected competitive diversification."

    return {
        "score": round(score, 1),
        "detected": detected,
        "evidence": evidence_text,
        "neutral_label": "Vendor concentration signal" if detected else "Balanced vendor distribution",
        "metrics": {"vendor_wins": vendor_wins, "total_dept_awards": total_dept_awards, "win_rate": round(win_rate, 2)}
    }

def evaluate_tender_duration(tender_date_str: str, closing_date_str: str, peer_median_days: float = 21.0) -> Dict[str, Any]:
    """
    Evaluates duration between tender announcement and submission deadline.
    """
    score = 0.0
    detected = False
    evidence_text = ""
    duration_days = None

    try:
        t_start = datetime.strptime(tender_date_str.split()[0], "%Y-%m-%d")
        t_end = datetime.strptime(closing_date_str.split()[0], "%Y-%m-%d")
        duration_days = (t_end - t_start).days
    except Exception:
        pass

    if duration_days is not None:
        if duration_days <= 5:
            score = 75.0
            detected = True
            evidence_text = f"Unusually constrained bidding window of {duration_days} days (statutory peer norm: {int(peer_median_days)} days)."
        elif duration_days <= 10:
            score = 45.0
            detected = True
            evidence_text = f"Notice period was {duration_days} days compared to standard {int(peer_median_days)} days."
        else:
            evidence_text = f"Tender window of {duration_days} days adheres to statutory notice requirements."

    return {
        "score": round(score, 1),
        "detected": detected,
        "evidence": evidence_text,
        "neutral_label": "Tender-duration anomaly" if detected else "Standard duration",
        "metrics": {"duration_days": duration_days, "peer_median_days": peer_median_days}
    }
