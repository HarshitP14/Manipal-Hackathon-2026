"""
In-Memory & Persistent State Store
Master PRD Section 9, 10, 16, 50 & 51

Ensures 100% reliable hackathon execution:
- Seeds from datasets/demo/procurement_showcase.csv
- Calculates anomaly detection and risk scoring across all records
- Maintains state for investigation cases, assignees, notes, audit trail
- Supports dynamic upload analysis
"""
import os
import csv
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.ml.scoring.risk_engine import compute_tender_risk_score
from backend.ml.graph.graph_engine import build_bipartite_graph
from backend.app.services.ingestion import detect_column_mappings, parse_and_validate_records

class DataStore:
    def __init__(self):
        self.tenders: Dict[str, Dict[str, Any]] = {}
        self.vendors: Dict[str, Dict[str, Any]] = {}
        self.bids: List[Dict[str, Any]] = []
        self.cases: Dict[str, Dict[str, Any]] = {}
        self.audit_logs: List[Dict[str, Any]] = []
        self.datasets: List[Dict[str, Any]] = []
        self.load_demo_data()

    def load_demo_data(self):
        """Loads and scores the demonstration dataset."""
        # Project root directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # current_dir is backend/app/services -> go up 3 levels to project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        csv_path = os.path.join(project_root, "datasets", "demo", "procurement_showcase.csv")
        if not os.path.exists(csv_path):
            # fallback check
            alt_path = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "datasets", "demo", "procurement_showcase.csv")
            if os.path.exists(alt_path):
                csv_path = alt_path
            else:
                print(f"[Store] Warning: csv_path not found: {csv_path}")
                return


        raw_rows = []
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_rows.append(row)

        mappings = detect_column_mappings(reader.fieldnames or [])
        res = parse_and_validate_records(raw_rows, mappings)
        records = res["records"]

        # Group bids by tender_id
        tenders_dict = {}
        bids_list = []
        for r in records:
            t_id = r["tender_id"]
            if t_id not in tenders_dict:
                tenders_dict[t_id] = {
                    "tender_id": t_id,
                    "title": r["title"],
                    "department": r["department"],
                    "category": r["category"],
                    "location": r["location"],
                    "estimated_value": r["estimated_value"],
                    "award_amount": r["award_amount"],
                    "tender_date": r["tender_date"],
                    "closing_date": r["closing_date"],
                    "winner_name": r["vendor_name"] if r["is_winner"] else None,
                    "scenario_flag": r.get("scenario_flag"),
                    "bids": []
                }
            
            bids_list.append({
                "tender_id": t_id,
                "vendor_name": r["vendor_name"],
                "bid_amount": r["bid_amount"],
                "bid_timestamp": r["bid_timestamp"],
                "is_winner": r["is_winner"]
            })
            tenders_dict[t_id]["bids"].append({
                "vendor_name": r["vendor_name"],
                "bid_amount": r["bid_amount"],
                "bid_timestamp": r["bid_timestamp"],
                "is_winner": r["is_winner"]
            })
            if r["is_winner"]:
                tenders_dict[t_id]["winner_name"] = r["vendor_name"]
                tenders_dict[t_id]["award_amount"] = r["award_amount"]

        # Compute risk scores for all tenders
        hist = list(tenders_dict.values())
        for t_id, t in tenders_dict.items():
            risk_res = compute_tender_risk_score(t, t["bids"], hist)
            t["attention_score"] = risk_res["attention_score"]
            t["risk_level"] = risk_res["risk_level"]
            t["anomaly_flags"] = risk_res["anomaly_flags"]
            t["evidence_bundle"] = risk_res
            t["bidder_count"] = len(t["bids"])
            t["case_status"] = "NEW"
            self.tenders[t_id] = t

        self.bids = bids_list

        # Populate Vendors
        for t in self.tenders.values():
            for b in t["bids"]:
                v_name = b["vendor_name"]
                if v_name not in self.vendors:
                    self.vendors[v_name] = {
                        "canonical_name": v_name,
                        "total_bids": 0,
                        "total_wins": 0,
                        "total_awarded_amount": 0.0,
                        "departments": set(),
                        "tenders": []
                    }
                self.vendors[v_name]["total_bids"] += 1
                self.vendors[v_name]["departments"].add(t["department"])
                self.vendors[v_name]["tenders"].append(t["tender_id"])
                if b["is_winner"]:
                    self.vendors[v_name]["total_wins"] += 1
                    self.vendors[v_name]["total_awarded_amount"] += float(t["award_amount"])

        # Format vendor departments set to list
        for v in self.vendors.values():
            v["departments"] = list(v["departments"])

        # Pre-seed flagship investigation case for demo per PRD Section 24.3
        self.cases["CASE-2026-001"] = {
            "id": "CASE-2026-001",
            "case_no": "CASE-2026-001",
            "tender_id": "TND-2026-0104",  # Cover-bidding case
            "priority": "High",
            "status": "UNDER_REVIEW",
            "assignee": "A. Sharma (Lead Forensic Auditor)",
            "due_date": "2026-03-30",
            "created_at": datetime.now().isoformat(),
            "notes": [
                {
                    "author_name": "A. Sharma",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "body": "Flagged for synchronized submission timestamps and sub-1% spread between Kavira Roadworks and Shree Balaji Builders."
                }
            ],
            "conclusion": "Formal inquiry ongoing into technical bid submission logs."
        }
        self.tenders["TND-2026-0104"]["case_status"] = "UNDER_REVIEW"

        # Log audit entry
        self.audit_logs.append({
            "actor_id": "system_bootstrap",
            "action": "DEMO_DATASET_INITIALIZED",
            "entity_type": "dataset",
            "entity_id": "DEMO-SHOWCASE-01",
            "timestamp": datetime.now().isoformat(),
            "metadata": {"total_tenders": len(self.tenders), "total_bids": len(self.bids)}
        })

store = DataStore()
