"""
CivicGraph Audit — Pydantic Schemas & Data Transfer Objects
Strict adherence to Master PRD v1.0 Section 13, 16 & Appendix B
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime

class RiskComponent(BaseModel):
    name: str
    contribution: float
    description: str
    evidence: str
    peer_baseline: Optional[str] = None
    level: str = "Low"  # Low, Moderate, Elevated, High

class EvidenceItem(BaseModel):
    signal_type: str
    observed_value: Any
    baseline_value: Any
    evidence_text: str
    neutral_category: str
    confidence: float = 0.90

class EvidenceBundle(BaseModel):
    tender_id: str
    attention_score: int
    risk_level: str
    components: List[RiskComponent] = []
    signals: List[EvidenceItem] = []
    uncertainties: List[str] = []

class BidSchema(BaseModel):
    vendor_name: str
    bid_amount: float
    bid_timestamp: Optional[str] = None
    is_winner: bool = False
    rank: Optional[int] = None

class TenderSummary(BaseModel):
    tender_id: str
    title: str
    department: str
    category: str
    location: str
    estimated_value: float
    award_amount: float
    tender_date: str
    closing_date: str
    winner_name: Optional[str] = None
    bidder_count: int = 1
    attention_score: int = 0
    risk_level: str = "Low"
    anomaly_flags: List[str] = []
    case_status: Optional[str] = "NEW"

class TenderDetail(TenderSummary):
    bids: List[BidSchema] = []
    evidence_bundle: Optional[EvidenceBundle] = None
    timeline: List[Dict[str, Any]] = []

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'tender' or 'vendor'
    risk: Optional[str] = "Low"
    score: Optional[int] = 0
    details: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # 'BID_ON' or 'WON'
    amount: Optional[float] = None
    highlight: bool = False

class BipartiteGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Optional[Dict[str, Any]] = None


class CaseCreate(BaseModel):
    tender_id: str
    priority: str = "Elevated"
    assignee: Optional[str] = "Unassigned"
    due_date: Optional[str] = None
    notes: Optional[str] = None

class CaseUpdate(BaseModel):
    status: Optional[str] = None  # NEW, UNDER_REVIEW, NEEDS_EVIDENCE, RESOLVED
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    conclusion: Optional[str] = None

class CaseNoteCreate(BaseModel):
    author_name: str
    body: str

class CaseRecord(BaseModel):
    id: str
    case_no: str
    tender_id: str
    priority: str
    status: str
    assignee: str
    due_date: Optional[str] = None
    created_at: str
    notes: List[Dict[str, Any]] = []
    conclusion: Optional[str] = None

class CopilotQueryRequest(BaseModel):
    tender_id: str
    question: str
    context: Optional[Dict[str, Any]] = None

class CopilotResponse(BaseModel):
    summary: str
    observed_facts: List[str]
    risk_factors: List[str]
    evidence: List[str]
    uncertainties: List[str]
    recommended_review_actions: List[str]
    provider: str = "deterministic_fallback"
