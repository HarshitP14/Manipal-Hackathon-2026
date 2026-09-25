-- ==========================================================
-- CivicGraph Audit — Supabase / PostgreSQL Schema v1.0
-- Master PRD Sections 8, 10 & 19
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenant boundary)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- references auth.users(id) in Supabase
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Auditor/Analyst' CHECK (role IN ('Admin', 'Auditor/Analyst', 'Viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Members (RBAC)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Auditor/Analyst',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (org_id, user_id)
);

-- 4. Datasets Container
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(100) DEFAULT 'upload',
    status VARCHAR(50) DEFAULT 'READY',
    is_demo BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Dataset Versions
CREATE TABLE IF NOT EXISTS dataset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64),
    row_count INTEGER DEFAULT 0,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dimensions
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    canonical_name VARCHAR(255) NOT NULL,
    registration_no VARCHAR(100),
    risk_profile VARCHAR(50) DEFAULT 'Standard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tenders (Procurement record)
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
    tender_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    department VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    location VARCHAR(255),
    estimated_value NUMERIC(15, 2),
    tender_date DATE,
    closing_date DATE,
    status VARCHAR(50) DEFAULT 'AWARDED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bids
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    bid_timestamp TIMESTAMPTZ,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Awards
CREATE TABLE IF NOT EXISTS awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    award_amount NUMERIC(15, 2) NOT NULL,
    award_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Anomaly Results
CREATE TABLE IF NOT EXISTS anomaly_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    model_version VARCHAR(50) DEFAULT 'v1.0',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Risk Scores
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE UNIQUE,
    total_score NUMERIC(5, 2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'Elevated', 'High')),
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    version VARCHAR(50) DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Evidence Items (Grounding layer)
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    anomaly_id UUID REFERENCES anomaly_results(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Investigation Cases
CREATE TABLE IF NOT EXISTS investigation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    case_no VARCHAR(50) UNIQUE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Elevated' CHECK (priority IN ('Low', 'Moderate', 'Elevated', 'High')),
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'NEEDS_EVIDENCE', 'RESOLVED')),
    assignee VARCHAR(255),
    due_date DATE,
    conclusion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Case Notes
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES investigation_cases(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Case Evidence
CREATE TABLE IF NOT EXISTS case_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES investigation_cases(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE,
    notes TEXT,
    attached_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Reports (Audit Dossiers)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES investigation_cases(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('PDF', 'CSV', 'EXCEL')),
    storage_path TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Model Runs
CREATE TABLE IF NOT EXISTS model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_cases ENABLE ROW LEVEL SECURITY;

-- Demo isolation: Demo records are readable by any authenticated or anonymous user
CREATE POLICY "Public Read Demo Datasets" ON datasets FOR SELECT USING (is_demo = TRUE);
