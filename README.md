# CivicGraph Audit 🏛️🔍
> **AI-Powered Public Procurement Anomaly Detection & Forensic Intelligence Platform**  
> *Manipal Hackathon 2026 — Track: Smart Governance & Compliance (SDG 16)*  
> **Team:** Walkingdeadlines | **Product Promise:** *Detect → Explain → Investigate → Document*

---

## 🌟 Overview
Public procurement accounts for an enormous share of government expenditures. Traditional manual audits struggle with fragmented bid distributions, opaque relationships, and high record volumes. 

**CivicGraph Audit** is an explainable, human-in-the-loop intelligence platform that converts raw public procurement records into prioritized risk signals, transparent evidence, relationship graphs, investigation cases, and audit-ready dossiers.

### 🛡️ Core Principles & Neutrality
In strict adherence to the Master PRD v1.0:
- **Neutral Terminology:** Identifies statistical, structural, and textual anomalies for human review. The system **never** outputs legal conclusions (e.g. "fraud" or "collusion").
- **Decomposable Explainability:** Every 0–100 attention score decomposes into transparent, named signal contributors with peer-group baselines and interactive "Show Me Why" traces.
- **Fail-Soft AI Grounding:** Grounded AI Procurement Copilot (Google Gemini with deterministic fallback) answers questions strictly from structured evidence bundles.
- **Instant Demo Mode:** Standalone, zero-friction demo experience loaded with realistic benchmark and injected anomaly scenarios (cover-bidding, threshold proximity, winner rotation, price deviation, low competition).

---

## 🏗️ System Architecture

```
                                  PROCUREMENT DATA
                                (CSV / XLSX / JSON)
                                         │
                                         ▼
                            INTELLIGENT INGESTION ENGINE
                        (Column Detection & Canonical Mapping)
                                         │
                                         ▼
                             VALIDATION & NORMALIZATION
                        (Duplicate Checks & Safe Transforms)
                                         │
                                         ▼
                             MULTI-SIGNAL DETECTORS
  ┌───────────────────────┬────────────────────────┬──────────────────────┐
  │ 1. Cover-Bidding      │ 2. Threshold Proximity │ 3. Winner Rotation   │
  │    (Δt & margin lock) │    (Approval smurfing) │    (Reciprocal cycle)│
  ├───────────────────────┼────────────────────────┼──────────────────────┤
  │ 4. Unsupervised ML    │ 5. Supporting Signals  │ 6. Bipartite Graph   │
  │    (Isolation Forest) │    (Competition/Price) │    (NetworkX / Flow) │
  └───────────────────────┴────────────────────────┴──────────────────────┘
                                         │
                                         ▼
                              HYBRID RISK AGGREGATOR
                                (0–100 Attention Score)
                                         │
                                         ▼
                              STRUCTURED EVIDENCE BUNDLE
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
3-PANEL INVESTIGATION             BIPARTITE GRAPH                  AI FORENSIC COPILOT
- Financials & Bid Timelines     - Vendor ↔ Tender network        - Grounded Q&A
- Decomposed SHAP Signals        - Suspicious cluster highlights   - Neutral audit briefs
- Interactive "Show Me Why"      - Interactive node inspector     - Deterministic fallback
        │                                                                 │
        └────────────────────────────────┬────────────────────────────────┘
                                         ▼
                           AUDIT DOSSIER EXPORT ENGINE
                              (ISO PDF, CSV, Excel)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & **npm**

### 1. Backend Setup (FastAPI)
```powershell
# Install dependencies
python -m pip install -r backend/requirements.txt

# Launch FastAPI server (with reload)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- **API Health Check:** `http://127.0.0.1:8000/api/v1/health`
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

### 2. Frontend Setup (React / Vite)
```powershell
# Install frontend packages
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## 🧪 Running Automated Tests
The repository includes automated unit, API, and integration test suites:

```powershell
# Run all 14 tests
python -m pytest tests/ -v
```

**Test Coverage:**
- `test_cover_bidding_detection`: Verifies $\Delta t < 60$s and sub-1% margin lockstep detection.
- `test_threshold_proximity`: Verifies clustering detection within 0.5% beneath statutory approval thresholds.
- `test_winner_rotation`: Verifies cyclical vendor transitions across departmental tenders.
- `test_low_competition_single_bidder`: Verifies 1-bidder detection against peer baselines.
- `test_risk_score_aggregation`: Verifies composite 0–100 risk score and evidence bundle generation.
- `test_copilot_deterministic_fallback`: Verifies grounded template generation without external API dependencies.
- `test_health_check_api`, `test_dashboard_stats_api`, `test_list_tenders_api`, `test_graph_api`, `test_copilot_query_api`, `test_case_lifecycle_api`, `test_pdf_dossier_export_api`.

---

## 🔬 4 Core Anomaly Detection Engines

| Engine | Signals Analyzed | Peer Baseline | Neutral Copy Guideline |
| :--- | :--- | :--- | :--- |
| **Cover-Bidding** | Pairwise bid timestamp intervals ($\Delta t < 120$s), relative bid margin lockstep ($< 1\%$) | Competitor interval: 4.2 hrs; spread: 8.4% | *"Unusual bidding pattern"* |
| **Threshold Proximity** | Clustering 0.1%–1.5% beneath statutory approval thresholds (e.g. ₹50 Lakhs) | Typical departmental distribution sits ~18% below ceiling | *"Threshold-proximity signal"* |
| **Winner Rotation** | Repeating sequential winning transitions among a closed pool of contractors | Open market exhibits Shannon entropy > 0.85 | *"Winner-rotation pattern"* |
| **Supporting Signals** | Single bidder, engineering cost deviation ($> 15\%$), departmental win share ($> 60\%$) | 5 peer contractors; ±4% mean variance | *"Market competition depth"* |

---

## 📂 Repository Structure
```
civicgraph-audit/
├── backend/
│   ├── app/
│   │   ├── api/             # Versioned API routes (/api/v1)
│   │   ├── core/            # Config and environment
│   │   ├── models/          # SQL schema (Supabase / Postgres)
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── services/        # Ingestion, Copilot, Store, Reporting
│   │   └── main.py          # FastAPI application
│   ├── ml/
│   │   ├── features/        # Cover-bidding, Threshold, Winner rotation
│   │   ├── graph/           # NetworkX Bipartite graph engine
│   │   └── scoring/         # Hybrid risk scoring & explainability
│   ├── Dockerfile
│   └── requirements.txt
├── datasets/
│   └── demo/
│       └── procurement_showcase.csv # Pre-seeded hackathon scenarios
├── docs/                    # Architectural & API specifications
├── src/
│   ├── main.jsx             # Complete client application & components
│   └── styles.css           # Design tokens, claymorphic styling
├── tests/
│   ├── test_anomaly_engines.py
│   └── test_api.py
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

## ⚖️ Responsible-Use Disclaimer
*CivicGraph Audit identifies statistical, structural, and textual anomalies for human review. A risk signal or elevated attention score is not proof of wrongdoing, fraud, corruption, collusion, or illegality, and must never replace formal procurement audits, administrative inquiries, or legal proceedings.*
