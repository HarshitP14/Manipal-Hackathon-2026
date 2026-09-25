"""
Winner Rotation Anomaly Engine
Master PRD Section 20 & Appendix A

Analyzes sequences of winning vendors across comparable tenders within the same department or category.
Detects cyclic / round-robin transitions among a closed pool of competing contractors.
Neutral wording: 'Repeated winner rotation pattern'
"""
from typing import List, Dict, Any
from collections import Counter

def evaluate_winner_rotation(
    target_tender_id: str,
    target_winner: str,
    historical_tenders: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates whether the winner of target_tender_id fits into a cyclic or repeating sequence 
    among a small cluster of reciprocal vendors in the same department/category.
    """
    if not target_winner or not historical_tenders or len(historical_tenders) < 3:
        return {
            "score": 0.0,
            "detected": False,
            "evidence": "Insufficient historical sequence to detect winner rotation patterns.",
            "metrics": {}
        }

    # Extract ordered winners by tender_date
    sorted_tenders = sorted(
        historical_tenders,
        key=lambda t: t.get("tender_date", "")
    )

    sequence = [t.get("winner_name") for t in sorted_tenders if t.get("winner_name")]
    if not sequence:
        return {
            "score": 0.0,
            "detected": False,
            "evidence": "No declared winners in historical sequence.",
            "metrics": {}
        }

    unique_winners = list(dict.fromkeys(sequence))
    pool_size = len(unique_winners)
    total_awards = len(sequence)

    # Check for cyclical transitions
    # e.g., Vendor A -> Vendor B -> Vendor C -> Vendor A ...
    transitions = []
    for i in range(len(sequence) - 1):
        transitions.append((sequence[i], sequence[i+1]))

    transition_counts = Counter(transitions)
    repeated_transitions = [pair for pair, count in transition_counts.items() if count >= 2]

    # Calculate rotation pattern regularity
    is_rotation = False
    score = 0.0
    evidence_text = ""

    # If pool size is 2 to 4 vendors, awards are distributed with low variance, and repeated transitions exist
    if 2 <= pool_size <= 4 and total_awards >= 3:
        counts = Counter(sequence)
        # Check if awards are evenly distributed among this small pool (e.g. 1-1-1 or 2-2-2)
        spread = max(counts.values()) - min(counts.values())
        if spread <= 1 and len(repeated_transitions) >= 1:
            is_rotation = True
            score = 80.0
            pattern_str = " -> ".join([w.split()[0] for w in unique_winners])
            evidence_text = (
                f"Repeated winner rotation pattern across {total_awards} comparable tenders with closed pool "
                f"of {pool_size} vendors ({pattern_str}). Alternating award sequence exhibits high cyclic regularity."
            )
        elif len(repeated_transitions) >= 1:
            score = 55.0
            is_rotation = True
            evidence_text = f"Repeated sequential winning transitions observed between vendors across {total_awards} departmental tenders."
        else:
            evidence_text = f"Awards distributed across {pool_size} vendors without persistent cyclical pattern."
    else:
        evidence_text = f"Vendor diversity normal ({pool_size} unique winners across {total_awards} tenders)."

    return {
        "score": round(score, 1),
        "detected": is_rotation,
        "evidence": evidence_text,
        "neutral_label": "Winner-rotation pattern" if is_rotation else "Standard vendor allocation",
        "metrics": {
            "unique_pool_size": pool_size,
            "total_awards_in_window": total_awards,
            "repeated_transition_pairs": len(repeated_transitions)
        }
    }
