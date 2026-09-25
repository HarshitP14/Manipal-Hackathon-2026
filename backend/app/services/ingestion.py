"""
Intelligent Ingestion, Field Mapping & Validation Engine
Master PRD Section 7, 12, 13, 14, 15

Supports:
- CSV, JSON, XLSX
- Canonical field alias matching with confidence scores
- Deterministic safe sanitization (stripping ₹/$, trimming whitespace, ISO dates)
- Exact duplicate detection
- Actionable validation summary report
"""
import io
import re
import csv
import json
from typing import Dict, Any, List, Tuple
from datetime import datetime

CANONICAL_ALIASES = {
    "tender_id": ["tender id", "tender_id", "bid ref no", "notice id", "tender_no", "reference_number"],
    "department": ["department", "procuring entity", "organization", "dept", "authority"],
    "category": ["category", "product/service", "procurement type", "work_type", "sector"],
    "location": ["location", "state", "district", "city", "work location", "place"],
    "estimated_value": ["estimated_value", "tender value", "estimate", "ecv", "budget", "estimated_cost"],
    "tender_date": ["tender_date", "published date", "notice date", "start_date", "issue_date"],
    "closing_date": ["closing_date", "bid submission end", "closing date", "due_date", "end_date"],
    "vendor_name": ["vendor_name", "bidder", "supplier", "company name", "contractor", "bidder_name"],
    "bid_amount": ["bid_amount", "quoted amount", "bid value", "quote", "offered_amount"],
    "bid_timestamp": ["bid_timestamp", "submission time", "bid time", "received_at", "timestamp"],
    "winner": ["winner", "awarded to", "l1", "successful bidder", "is_winner", "status"],
    "award_amount": ["award_amount", "award value", "contract value", "final_price"]
}

def detect_column_mappings(columns: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Matches raw table header names to canonical schema fields with confidence score.
    """
    mappings = {}
    cleaned_cols = {c: re.sub(r"[^a-z0-9_ ]", "", c.lower().strip()) for c in columns}

    for canonical, aliases in CANONICAL_ALIASES.items():
        best_match = None
        highest_conf = 0.0

        for original_col, clean_col in cleaned_cols.items():
            if clean_col == canonical:
                best_match = original_col
                highest_conf = 1.0
                break
            for alias in aliases:
                if alias == clean_col:
                    best_match = original_col
                    highest_conf = 0.95
                    break
                elif alias in clean_col or clean_col in alias:
                    if highest_conf < 0.75:
                        best_match = original_col
                        highest_conf = 0.75

        if best_match and highest_conf >= 0.70:
            mappings[canonical] = {
                "source_column": best_match,
                "confidence": highest_conf
            }

    return mappings

def clean_monetary_value(val: Any) -> float:
    if val is None:
        return 0.0
    s = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
    try:
        return float(s)
    except Exception:
        return 0.0

def clean_date_string(val: Any) -> str:
    if not val:
        return ""
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s.split()[0], fmt).strftime("%Y-%m-%d")
        except Exception:
            pass
    return s

def parse_and_validate_records(raw_rows: List[Dict[str, Any]], mappings: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Transforms raw source rows into normalized procurement records with validation telemetry.
    """
    total_rows = len(raw_rows)
    valid_rows = []
    warnings = []
    seen_hashes = set()
    exact_duplicates = 0
    transformations_count = 0

    col_map = {canon: info["source_column"] for canon, info in mappings.items()}

    for idx, row in enumerate(raw_rows, start=1):
        # 1. Exact duplicate check
        row_str = json.dumps(row, sort_keys=True)
        if row_str in seen_hashes:
            exact_duplicates += 1
            warnings.append(f"Row {idx}: Exact duplicate record flagged.")
            continue
        seen_hashes.add(row_str)

        # 2. Extract fields
        t_id = row.get(col_map.get("tender_id", "tender_id"))
        if not t_id:
            warnings.append(f"Row {idx}: Missing mandatory 'tender_id'; skipped.")
            continue

        title = row.get("title") or row.get("name") or f"Procurement Notice {t_id}"
        dept = row.get(col_map.get("department", "department"), "General Administration")
        cat = row.get(col_map.get("category", "category"), "Goods & Services")
        loc = row.get(col_map.get("location", "location"), "National")
        
        raw_est = row.get(col_map.get("estimated_value", "estimated_value"))
        raw_award = row.get(col_map.get("award_amount", "award_amount"))
        raw_bid = row.get(col_map.get("bid_amount", "bid_amount"))

        est_val = clean_monetary_value(raw_est)
        award_val = clean_monetary_value(raw_award)
        bid_val = clean_monetary_value(raw_bid)

        if str(raw_est) != str(est_val) or str(raw_award) != str(award_val):
            transformations_count += 1

        v_name = row.get(col_map.get("vendor_name", "vendor_name"), "").strip()
        raw_winner = row.get(col_map.get("winner", "winner"))
        is_winner = False
        if raw_winner is not None:
            w_str = str(raw_winner).lower().strip()
            is_winner = w_str in ["true", "1", "yes", "winner", "l1", "awarded"]

        t_date = clean_date_string(row.get(col_map.get("tender_date", "tender_date")))
        c_date = clean_date_string(row.get(col_map.get("closing_date", "closing_date")))
        ts = row.get(col_map.get("bid_timestamp", "bid_timestamp"))

        normalized_record = {
            "tender_id": str(t_id).strip(),
            "title": str(title).strip(),
            "department": str(dept).strip(),
            "category": str(cat).strip(),
            "location": str(loc).strip(),
            "estimated_value": est_val,
            "award_amount": award_val if award_val > 0 else (bid_val if is_winner else 0.0),
            "tender_date": t_date,
            "closing_date": c_date,
            "vendor_name": v_name,
            "bid_amount": bid_val,
            "bid_timestamp": str(ts).strip() if ts else None,
            "is_winner": is_winner,
            "scenario_flag": row.get("scenario_flag")
        }
        valid_rows.append(normalized_record)

    return {
        "summary": {
            "total_rows": total_rows,
            "valid_rows_count": len(valid_rows),
            "invalid_rows_count": total_rows - len(valid_rows) - exact_duplicates,
            "exact_duplicates": exact_duplicates,
            "transformations_applied": transformations_count,
            "warning_count": len(warnings)
        },
        "warnings": warnings[:15],
        "records": valid_rows
    }
