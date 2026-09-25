import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Shield, AlertTriangle, CheckCircle, Search, FileText, BarChart3,
  Network, Users, FolderPlus, Download, ExternalLink, ChevronRight,
  TrendingUp, Activity, Clock, Building, ArrowUpRight, Sparkles,
  Send, HelpCircle, Eye, Moon, Sun, Filter, RefreshCw, X, Info,
  Sliders, UserCheck, Check, AlertOctagon, Terminal, FileSpreadsheet
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import './styles.css';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// Seed demo fallback data ensuring instant, zero-latency offline demo
const FALLBACK_TENDERS = [
  {
    tender_id: "TND-2026-0104",
    title: "Arterial Road Resurfacing Ward 4",
    department: "Public Works Department",
    category: "Civil Works",
    location: "Bengaluru",
    estimated_value: 8500000,
    award_amount: 8450000,
    tender_date: "2026-02-01",
    closing_date: "2026-02-20",
    winner_name: "Kavira Roadworks Ltd",
    bidder_count: 3,
    attention_score: 87,
    risk_level: "High",
    anomaly_flags: ["Bidding Timing & Lockstep", "Vendor Market Concentration"],
    case_status: "UNDER_REVIEW",
    bids: [
      { vendor_name: "Kavira Roadworks Ltd", bid_amount: 8450000, bid_timestamp: "2026-02-20 14:02:11", is_winner: true },
      { vendor_name: "Shree Balaji Builders", bid_amount: 8480000, bid_timestamp: "2026-02-20 14:03:04", is_winner: false },
      { vendor_name: "United Civil Construction", bid_amount: 8495000, bid_timestamp: "2026-02-20 14:03:49", is_winner: false }
    ],
    evidence_bundle: {
      attention_score: 87,
      risk_level: "High",
      components: [
        {
          name: "Bidding Timing & Lockstep",
          contribution: 36.5,
          description: "Tight submission delta and sub-1% margin lockstep",
          evidence: "Multiple bids submitted within an unusually tight window of 53s (peer median: 14,200s). Bid spread is 0.35% between winner and runner-up.",
          peer_baseline: "Median competitor interval: 4.2 hours; avg spread: 8.4%",
          level: "High"
        },
        {
          name: "Vendor Market Concentration",
          contribution: 28.0,
          description: "High departmental win capture rate",
          evidence: "Vendor 'Kavira Roadworks Ltd' captured 4 of 6 recent road resurfacing tenders in Public Works.",
          peer_baseline: "Top vendor share in peers typically < 25%",
          level: "Elevated"
        },
        {
          name: "Tender Notice Window",
          contribution: 14.5,
          description: "Notice duration within expected parameters",
          evidence: "Notice window of 19 days satisfies basic statutory notice guidelines.",
          peer_baseline: "Statutory norm: 21 days",
          level: "Low"
        }
      ],
      signals: [
        { signal_type: "Timing Lockstep", observed_value: "53 seconds", baseline_value: "14,200 seconds", evidence_text: "Bids submitted sequentially in 53 seconds.", neutral_category: "Timing deviation" },
        { signal_type: "Bid Margin", observed_value: "0.35%", baseline_value: "8.4%", evidence_text: "Price difference between competitors is 0.35%.", neutral_category: "Margin lockstep" }
      ],
      uncertainties: [
        "Analysis based on platform timestamp metadata; technical server logs unverified.",
        "A risk signal is a statistical deviation for human verification and not legal proof of collusion."
      ]
    }
  },
  {
    tender_id: "TND-2026-0101",
    title: "Smart Traffic Signals Installation Phase 1",
    department: "Public Works Department",
    category: "Infrastructure",
    location: "Bengaluru",
    estimated_value: 4985000,
    award_amount: 4975000,
    tender_date: "2026-01-10",
    closing_date: "2026-02-01",
    winner_name: "Apex InfraTech Solutions",
    bidder_count: 3,
    attention_score: 82,
    risk_level: "High",
    anomaly_flags: ["Threshold Proximity", "Bidding Timing & Lockstep"],
    case_status: "NEW",
    bids: [
      { vendor_name: "Apex InfraTech Solutions", bid_amount: 4975000, bid_timestamp: "2026-02-01 10:14:02", is_winner: true },
      { vendor_name: "BluePeak Urban Dynamics", bid_amount: 4982000, bid_timestamp: "2026-02-01 10:14:55", is_winner: false },
      { vendor_name: "CivicMatrix Technologies", bid_amount: 4984500, bid_timestamp: "2026-02-01 10:15:30", is_winner: false }
    ],
    evidence_bundle: {
      attention_score: 82,
      risk_level: "High",
      components: [
        {
          name: "Threshold Proximity",
          contribution: 38.0,
          description: "Clustering just beneath statutory financial authorization ceiling",
          evidence: "Award value of ₹49,75,000 is clustered 0.50% beneath the ₹50 Lakh state departmental oversight threshold.",
          peer_baseline: "Standard departmental distribution sits ~18% below ceiling",
          level: "High"
        },
        {
          name: "Bidding Timing & Lockstep",
          contribution: 32.0,
          description: "Rapid sequential submission sequence",
          evidence: "All 3 bids received within 88 seconds.",
          peer_baseline: "Standard spread over 48 hours",
          level: "Elevated"
        }
      ],
      uncertainties: [
        "Procurement estimate sanctioned by municipal council; internal notes pending review."
      ]
    }
  },
  {
    tender_id: "TND-2026-0106",
    title: "Substation Circuit Breaker Replacement",
    department: "Energy Department",
    category: "Electrical",
    location: "Belagavi",
    estimated_value: 9800000,
    award_amount: 9750000,
    tender_date: "2026-02-10",
    closing_date: "2026-03-01",
    winner_name: "PowerGrid Allied Systems",
    bidder_count: 3,
    attention_score: 79,
    risk_level: "High",
    anomaly_flags: ["Winner Rotation Pattern"],
    case_status: "NEW",
    bids: [
      { vendor_name: "PowerGrid Allied Systems", bid_amount: 9750000, bid_timestamp: "2026-03-01 10:05:14", is_winner: true },
      { vendor_name: "ElectroDynamics Corp", bid_amount: 9890000, bid_timestamp: "2026-03-01 11:15:30", is_winner: false },
      { vendor_name: "Vidyut Techno Services", bid_amount: 9940000, bid_timestamp: "2026-03-01 11:32:00", is_winner: false }
    ],
    evidence_bundle: {
      attention_score: 79,
      risk_level: "High",
      components: [
        {
          name: "Winner Rotation Pattern",
          contribution: 44.0,
          description: "Cyclic winning transitions among closed pool of 3 contractors",
          evidence: "Reciprocal award sequence across Belagavi substation tenders: PowerGrid -> ElectroDynamics -> Vidyut Techno.",
          peer_baseline: "Open market exhibits Shannon entropy > 0.85",
          level: "High"
        }
      ],
      uncertainties: ["Specialized technical qualifications may limit pool size."]
    }
  },
  {
    tender_id: "TND-2026-0102",
    title: "Municipal School Digital Classroom Setup",
    department: "Department of Education",
    category: "Information Technology",
    location: "Mysuru",
    estimated_value: 12500000,
    award_amount: 12400000,
    tender_date: "2026-01-15",
    closing_date: "2026-02-05",
    winner_name: "EduSmart Systems Pvt Ltd",
    bidder_count: 1,
    attention_score: 74,
    risk_level: "Elevated",
    anomaly_flags: ["Market Competition Depth"],
    case_status: "NEW",
    bids: [
      { vendor_name: "EduSmart Systems Pvt Ltd", bid_amount: 12400000, bid_timestamp: "2026-02-05 16:30:10", is_winner: true }
    ],
    evidence_bundle: {
      attention_score: 74,
      risk_level: "Elevated",
      components: [
        {
          name: "Market Competition Depth",
          contribution: 46.0,
          description: "Single bidder participation",
          evidence: "1 bidder vs peer median of 5 participants in Education IT contracts.",
          peer_baseline: "Peer median: 5 contractors",
          level: "Elevated"
        }
      ]
    }
  },
  {
    tender_id: "TND-2026-0105",
    title: "Water Treatment Plant Pipeline Maintenance",
    department: "Urban Water Supply Board",
    category: "Utilities",
    location: "Hubballi",
    estimated_value: 18000000,
    award_amount: 21400000,
    tender_date: "2026-02-05",
    closing_date: "2026-02-25",
    winner_name: "JalShakti Infrastructure",
    bidder_count: 2,
    attention_score: 72,
    risk_level: "Elevated",
    anomaly_flags: ["Price Deviation from Estimate"],
    case_status: "NEW",
    bids: [
      { vendor_name: "JalShakti Infrastructure", bid_amount: 21400000, bid_timestamp: "2026-02-25 15:10:00", is_winner: true },
      { vendor_name: "Pravaha Hydraulics", bid_amount: 21900000, bid_timestamp: "2026-02-25 15:18:22", is_winner: false }
    ],
    evidence_bundle: {
      attention_score: 72,
      risk_level: "Elevated",
      components: [
        {
          name: "Price Deviation from Estimate",
          contribution: 42.0,
          description: "Award amount 18.9% above engineer cost estimate",
          evidence: "Award amount of ₹2,14,00,000 exceeds official engineering estimate of ₹1,80,00,000 by 18.9%.",
          peer_baseline: "Department average variance: ±3.8%",
          level: "Elevated"
        }
      ]
    }
  },
  {
    tender_id: "TND-2026-0103",
    title: "Hospital Diagnostic Equipment Upgrade",
    department: "Health and Family Welfare",
    category: "Medical Supplies",
    location: "Mangaluru",
    estimated_value: 34000000,
    award_amount: 33800000,
    tender_date: "2026-01-20",
    closing_date: "2026-02-12",
    winner_name: "MedVanguard Healthcare",
    bidder_count: 4,
    attention_score: 22,
    risk_level: "Low",
    anomaly_flags: [],
    case_status: "RESOLVED",
    bids: [
      { vendor_name: "MedVanguard Healthcare", bid_amount: 33800000, bid_timestamp: "2026-02-12 11:20:10", is_winner: true },
      { vendor_name: "Zenith BioTech Supplies", bid_amount: 34200000, bid_timestamp: "2026-02-12 11:45:00", is_winner: false },
      { vendor_name: "CareFirst Biomedical", bid_amount: 34600000, bid_timestamp: "2026-02-12 12:05:22", is_winner: false },
      { vendor_name: "LifeLine Diagnostic Aids", bid_amount: 35100000, bid_timestamp: "2026-02-12 13:10:44", is_winner: false }
    ],
    evidence_bundle: {
      attention_score: 22,
      risk_level: "Low",
      components: []
    }
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'dashboard', 'procurements', 'investigation', 'graph', 'upload', 'vendors', 'cases', 'reports'
  const [tenders, setTenders] = useState(FALLBACK_TENDERS);
  const [selectedTenderId, setSelectedTenderId] = useState('TND-2026-0104');
  const [stats, setStats] = useState({
    procurements_analyzed: 12,
    total_procurement_value: 160715000,
    high_priority_cases: 6,
    anomaly_rate_pct: 50.0,
    vendors_analyzed: 19,
    open_investigations: 1
  });
  const [darkMode, setDarkMode] = useState(false);
  const [showMeWhyOpen, setShowMeWhyOpen] = useState(false);
  const [showMeWhyStep, setShowMeWhyStep] = useState(0);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [copilotMessages, setCopilotMessages] = useState([
    {
      sender: 'assistant',
      text: 'CivicGraph Audit Forensic Copilot initialized. Grounded strictly on verified procurement metadata, bid distributions, and statistical evidence. How can I assist your investigation?'
    }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [casesList, setCasesList] = useState([
    {
      id: "CASE-2026-001",
      case_no: "CASE-2026-001",
      tender_id: "TND-2026-0104",
      title: "Arterial Road Resurfacing Ward 4",
      priority: "High",
      status: "UNDER_REVIEW",
      assignee: "A. Sharma (Lead Auditor)",
      due_date: "2026-03-30",
      notes: [
        { author_name: "A. Sharma", timestamp: "2026-03-02 11:30", body: "Identified synchronized 53s bid intervals and 0.35% margin lockstep between Kavira and Shree Balaji." }
      ]
    }
  ]);
  const [uploadState, setUploadState] = useState({
    fileLoaded: false,
    fileName: '',
    mappingReady: false,
    analyzed: false,
    totalRows: 0,
    validRows: 0,
    duplicates: 0,
    transformations: 0
  });

  // Current tender object
  const currentTender = useMemo(() => {
    return tenders.find(t => t.tender_id === selectedTenderId) || tenders[0];
  }, [tenders, selectedTenderId]);

  // Sync with Backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/dashboard/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => console.log('Using local fallback stats'));

    fetch(`${API_BASE}/tenders`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setTenders(data);
      })
      .catch(() => console.log('Using local fallback tenders'));

    fetch(`${API_BASE}/cases`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setCasesList(data);
      })
      .catch(() => console.log('Using local fallback cases'));
  }, []);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered tenders list
  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      const matchSearch = searchQuery === '' ||
        t.tender_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.winner_name && t.winner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = departmentFilter === 'All' || t.department === departmentFilter;
      const matchRisk = riskFilter === 'All' || t.risk_level === riskFilter;
      return matchSearch && matchDept && matchRisk;
    });
  }, [tenders, searchQuery, departmentFilter, riskFilter]);

  // Handle Copilot query
  const handleSendCopilot = async (overridePrompt) => {
    const promptText = overridePrompt || copilotInput;
    if (!promptText.trim()) return;

    setCopilotMessages(prev => [...prev, { sender: 'user', text: promptText }]);
    if (!overridePrompt) setCopilotInput('');
    setCopilotLoading(true);

    try {
      const response = await fetch(`${API_BASE}/copilot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_id: currentTender.tender_id,
          question: promptText
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCopilotMessages(prev => [...prev, {
          sender: 'assistant',
          structured: data,
          text: data.summary
        }]);
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      // Local fallback grounded response
      const bundle = currentTender.evidence_bundle || {};
      const components = bundle.components || [];
      const score = currentTender.attention_score;
      const level = currentTender.risk_level;

      setCopilotMessages(prev => [...prev, {
        sender: 'assistant',
        structured: {
          summary: `Procurement ${currentTender.tender_id} has an attention score of ${score}/100 categorized as ${level} priority. Key contributing signals include ${components.map(c => c.name).join(', ') || 'normative parameters'}.`,
          observed_facts: [
            `Tender ID: ${currentTender.tender_id} awarded to ${currentTender.winner_name || 'N/A'}.`,
            `Award Amount: ₹${(currentTender.award_amount || 0).toLocaleString('en-IN')}.`,
            `Total participating bidders: ${currentTender.bidder_count}.`
          ],
          risk_factors: components.map(c => `${c.name}: ${c.description}`),
          evidence: components.map(c => c.evidence),
          uncertainties: [
            "Dataset snapshot analysis; physical bidding registry verification recommended.",
            "A risk signal flags statistical divergence for human verification, not confirmation of wrongdoing."
          ],
          recommended_review_actions: [
            "Inspect technical evaluation committee disqualification minutes.",
            "Verify corporate registry identifiers (CIN/GSTIN) across competing bidders.",
            "Confirm whether statutory threshold approvals were duly minuted."
          ],
          provider: "deterministic_fallback"
        },
        text: `Procurement ${currentTender.tender_id} exhibits an attention score of ${score}/100 (${level} priority). Factors flagged for review: ${components.map(c => c.name).join(', ')}.`
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Add Investigator Note
  const handleAddNote = () => {
    if (!investigatorNote.trim()) return;
    const newNote = {
      author_name: "A. Sharma (Lead Auditor)",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      body: investigatorNote.trim()
    };
    setCasesList(prev => prev.map(c => {
      if (c.tender_id === currentTender.tender_id) {
        return { ...c, notes: [...(c.notes || []), newNote] };
      }
      return c;
    }));
    setInvestigatorNote('');
  };

  // Update Case Status
  const handleUpdateCaseStatus = (newStatus) => {
    setTenders(prev => prev.map(t => t.tender_id === currentTender.tender_id ? { ...t, case_status: newStatus } : t));
    setCasesList(prev => prev.map(c => c.tender_id === currentTender.tender_id ? { ...c, status: newStatus } : c));
    fetch(`${API_BASE}/cases/CASE-2026-001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(() => {});
  };

  // Download PDF Dossier
  const handleDownloadPDF = () => {
    window.open(`${API_BASE}/reports/${currentTender.tender_id}/pdf`, '_blank');
  };

  // Render Badge
  const renderRiskBadge = (level, score) => {
    const styles = {
      High: { bg: 'var(--risk-elevated-bg)', color: 'var(--risk-elevated)', border: 'rgba(225, 29, 72, 0.3)' },
      Elevated: { bg: '#FFF7ED', color: '#EA580C', border: 'rgba(234, 88, 12, 0.3)' },
      Moderate: { bg: 'var(--risk-mod-bg)', color: 'var(--risk-mod)', border: 'rgba(217, 119, 6, 0.3)' },
      Low: { bg: 'var(--risk-low-bg)', color: 'var(--risk-low)', border: 'rgba(5, 150, 105, 0.3)' }
    }[level] || { bg: 'var(--surface-alt)', color: 'var(--text-muted)', border: 'var(--border-light)' };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: styles.color }}></span>
        {level} {score !== undefined ? `(${score})` : ''}
      </span>
    );
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* 1. SIDEBAR NAVIGATION RAIL */}
      {activeTab !== 'landing' && (
        <aside className="sidebar-rail">
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(63, 42, 150, 0.3)'
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
                CivicGraph <span style={{ color: 'var(--accent-cyan)' }}>Audit</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Procurement Intelligence
              </div>
            </div>
          </div>

          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.5px' }}>
              Intelligence Core
            </div>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'procurements', label: 'Procurements', icon: FileText, badge: tenders.length },
              { id: 'investigation', label: 'Investigation', icon: Shield, highlight: true },
              { id: 'graph', label: 'Bipartite Graph', icon: Network },
              { id: 'upload', label: 'Ingestion & Mapping', icon: FolderPlus },
              { id: 'vendors', label: 'Vendor Directory', icon: Users },
              { id: 'cases', label: 'Case Management', icon: UserCheck, badge: casesList.length },
              { id: 'reports', label: 'Audit Dossiers', icon: Download },
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComp size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)' }} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '12px',
                      background: isActive ? 'var(--primary)' : 'var(--surface-subtle)',
                      color: isActive ? 'white' : 'var(--text-muted)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Rail User & Theme */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                WD
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Team Walkingdeadlines</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Auditor / Analyst</div>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                padding: '6px',
                borderRadius: '8px'
              }}
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </aside>
      )}

      {/* 2. MAIN VIEWPORT */}
      <main className="main-viewport">
        {/* Topbar (when inside app) */}
        {activeTab !== 'landing' && (
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setCmdPaletteOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-light)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  minWidth: '280px'
                }}
              >
                <Search size={15} />
                <span>Quick search tender, vendor, case...</span>
                <kbd style={{ marginLeft: 'auto', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                  Ctrl+K
                </kbd>
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--risk-low)',
                fontWeight: 600,
                background: 'var(--risk-low-bg)',
                padding: '5px 12px',
                borderRadius: '20px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--risk-low)' }} className="pulse-glow"></span>
                <span>ENGINE NOMINAL</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setActiveTab('landing')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Exit to Landing
              </button>
              <button
                onClick={() => {
                  setSelectedTenderId('TND-2026-0104');
                  setActiveTab('investigation');
                  setShowMeWhyOpen(true);
                  setShowMeWhyStep(0);
                }}
                className="clay-button-primary"
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                <Sparkles size={15} />
                Show Me Why
              </button>
            </div>
          </header>
        )}

        {/* 3. LANDING PAGE VIEW (PRD Section 8) */}
        {activeTab === 'landing' && (
          <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F6FA 100%)', minHeight: '100vh' }}>
            {/* Landing Header */}
            <header style={{
              height: '76px',
              padding: '0 48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(63, 42, 150, 0.35)'
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
                    CivicGraph <span style={{ color: 'var(--accent-cyan)' }}>Audit</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Team Walkingdeadlines • SDG 16
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '8px 16px'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                  }}
                  className="clay-button-primary"
                  style={{ fontSize: '14px', padding: '10px 22px' }}
                >
                  Explore Demo
                  <ChevronRight size={16} />
                </button>
              </div>
            </header>

            {/* Hero Section */}
            <section style={{ maxWidth: '1100px', margin: '80px auto 60px', textAlign: 'center', padding: '0 24px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '30px',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '24px'
              }}>
                <Sparkles size={14} />
                CIVICGRAPH AUDIT • MANIPAL HACKATHON 2026
              </div>

              <h1 style={{
                fontSize: '56px',
                fontWeight: 800,
                color: 'var(--text-dark)',
                lineHeight: 1.15,
                letterSpacing: '-1.5px',
                marginBottom: '24px'
              }}>
                Procurement intelligence for <br />
                <span style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>accountable decisions.</span>
              </h1>

              <p style={{
                fontSize: '19px',
                color: 'var(--text-muted)',
                maxWidth: '740px',
                margin: '0 auto 40px',
                lineHeight: 1.6
              }}>
                Analyze procurement data, uncover unusual patterns, and trace the evidence behind every risk signal. A human-in-the-loop intelligence platform for public auditors.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '60px' }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="clay-button-primary"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  Explore Demo Workspace
                  <ArrowUpRight size={18} />
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-dark)',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: 'var(--clay-card)'
                  }}
                >
                  Analyze Dataset
                </button>
              </div>

              {/* Animated Workflow Sequence (Tender -> Vendor -> Risk Signals -> Evidence -> Investigation) */}
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px 40px',
                boxShadow: 'var(--clay-shadow)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                {[
                  { step: '01', title: 'Tender Data', desc: 'Raw bid records', icon: FileText, color: 'var(--primary)' },
                  { step: '02', title: 'Vendor Analysis', desc: 'Normalized entities', icon: Users, color: 'var(--accent-cyan)' },
                  { step: '03', title: 'Risk Signals', desc: '4 Core Anomaly Engines', icon: Activity, color: 'var(--accent-violet)' },
                  { step: '04', title: 'Evidence Bundle', desc: 'Decomposable points', icon: BarChart3, color: '#D97706' },
                  { step: '05', title: 'Investigation', desc: 'Human-in-the-loop dossier', icon: Shield, color: 'var(--risk-low)' }
                ].map((item, idx, arr) => {
                  const IconC = item.icon;
                  return (
                    <React.Fragment key={item.step}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '16px',
                          background: `${item.color}15`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                        }}>
                          <IconC size={24} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.desc}</div>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ color: 'var(--border-light)', display: 'flex', alignItems: 'center' }}>
                          <ChevronRight size={24} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>

            {/* Value Pillars Section */}
            <section style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>
                  What CivicGraph Audit Detects
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
                  Multi-signal forensic engines designed specifically for Indian public procurement norms.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {[
                  {
                    title: 'Cover-Bidding Detection',
                    subtitle: 'Timing & margin lockstep',
                    text: 'Identifies sequential bids submitted in tight time deltas (<120s) with identical narrow spreads between competitors.',
                    badge: 'ENGINE 1'
                  },
                  {
                    title: 'Threshold Proximity',
                    subtitle: 'Statutory approval caps',
                    text: 'Flags procurement values clustered 0.1% to 1.5% below key financial sanction thresholds (e.g. ₹50 Lakhs).',
                    badge: 'ENGINE 2'
                  },
                  {
                    title: 'Winner Rotation',
                    subtitle: 'Cyclic allocation patterns',
                    text: 'Analyzes sequential transitions across comparable departmental tenders for reciprocal round-robin wins.',
                    badge: 'ENGINE 3'
                  },
                  {
                    title: 'Market Competition Depth',
                    subtitle: 'Single-bidder anomalies',
                    text: 'Compares active vendor counts against granular peer baselines (e.g. 1 bidder vs peer median 5).',
                    badge: 'SUPPORTING'
                  },
                  {
                    title: 'Bipartite Relationship Graph',
                    subtitle: 'NetworkX + React Flow',
                    text: 'Interactive graph visualization of Vendor ↔ Tender nodes highlighting co-bidding pairs and concentration.',
                    badge: 'GRAPH'
                  },
                  {
                    title: 'Grounded AI Procurement Copilot',
                    subtitle: 'Gemini + Deterministic Fallback',
                    text: 'Grounded synthesis strictly on structured evidence bundles without hallucinations or legal accusations.',
                    badge: 'AI COPILOT'
                  }
                ].map(card => (
                  <div key={card.title} className="clay-box" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '3px 8px', borderRadius: '6px' }}>
                        {card.badge}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>{card.title}</h3>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)' }}>{card.subtitle}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{card.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Responsible Use Disclaimer */}
            <section style={{ maxWidth: '1000px', margin: '40px auto 80px', padding: '20px 28px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <Info size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)', marginBottom: '4px' }}>
                    RESPONSIBLE USE & NEUTRALITY STATEMENT
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    CivicGraph Audit identifies statistical, structural, and textual anomalies for human verification. An elevated attention score or risk signal is not proof of wrongdoing, fraud, corruption, or legal violation. The system supports human auditors in prioritizing investigations and never replaces formal audit judgment.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 4. DASHBOARD VIEW (PRD Section 28) */}
        {activeTab === 'dashboard' && (
          <div className="page-content animate-fade-in">
            {/* Dashboard Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                  Procurement Risk Dashboard
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Continuous forensic analysis across municipal and departmental public procurement records.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <FolderPlus size={16} />
                  Upload Dataset
                </button>
                <button
                  onClick={() => {
                    setSelectedTenderId('TND-2026-0104');
                    setActiveTab('investigation');
                  }}
                  className="clay-button-primary"
                  style={{ fontSize: '13px' }}
                >
                  <Shield size={16} />
                  Open Flagship Case
                </button>
              </div>
            </div>

            {/* 5 KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '18px', marginBottom: '28px' }}>
              {[
                { label: 'Procurements Analyzed', val: stats.procurements_analyzed, sub: 'Active tenders', icon: FileText, color: 'var(--primary)' },
                { label: 'Total Value Analyzed', val: `₹${(stats.total_procurement_value / 10000000).toFixed(2)} Cr`, sub: 'INR procurement pool', icon: Building, color: 'var(--accent-cyan)' },
                { label: 'High-Priority Tenders', val: stats.high_priority_cases, sub: 'Requires human audit', icon: AlertTriangle, color: 'var(--risk-elevated)' },
                { label: 'Anomaly Rate', val: `${stats.anomaly_rate_pct}%`, sub: 'Deviations flagged', icon: Activity, color: 'var(--risk-mod)' },
                { label: 'Monitored Vendors', val: stats.vendors_analyzed, sub: 'Bipartite entities', icon: Users, color: 'var(--accent-violet)' }
              ].map(kpi => {
                const IconC = kpi.icon;
                return (
                  <div key={kpi.label} className="clay-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>{kpi.label}</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconC size={17} />
                      </div>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark)' }}>{kpi.val}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kpi.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Visual Analytics Row: Risk Distribution & Department Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div className="clay-box" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>Risk Distribution Across Dataset</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Tenders segmented by normalized attention score bands</p>
                  </div>
                </div>
                <div style={{ height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Low (0-24)', count: tenders.filter(t => t.risk_level === 'Low').length, fill: '#059669' },
                      { name: 'Moderate (25-49)', count: tenders.filter(t => t.risk_level === 'Moderate').length, fill: '#D97706' },
                      { name: 'Elevated (50-74)', count: tenders.filter(t => t.risk_level === 'Elevated').length, fill: '#EA580C' },
                      { name: 'High (75-100)', count: tenders.filter(t => t.risk_level === 'High').length, fill: '#E11D48' }
                    ]}>
                      <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} />
                      <YAxis stroke="var(--text-dim)" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '12px' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {[
                          { fill: '#059669' }, { fill: '#D97706' }, { fill: '#EA580C' }, { fill: '#E11D48' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="clay-box" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>Departmental Concentration</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Procurement volume by administrative agency</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { dept: 'Public Works Department', count: 2, pct: 17 },
                    { dept: 'Health and Family Welfare', count: 4, pct: 33 },
                    { dept: 'Energy Department', count: 3, pct: 25 },
                    { dept: 'Education / Utilities', count: 3, pct: 25 }
                  ].map(d => (
                    <div key={d.dept} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>
                        <span>{d.dept}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{d.count} tenders ({d.pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--surface-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* High-Priority Tenders Queue Table */}
            <div className="clay-box" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>High-Priority Tenders Queue</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Procurements requiring audit triage, ranked by composite attention score</p>
                </div>
                <button
                  onClick={() => setActiveTab('procurements')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View All ({tenders.length}) <ChevronRight size={15} />
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Tender ID</th>
                    <th style={{ padding: '10px 12px' }}>Title</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Award Value</th>
                    <th style={{ padding: '10px 12px' }}>Bidders</th>
                    <th style={{ padding: '10px 12px' }}>Attention Score</th>
                    <th style={{ padding: '10px 12px' }}>Anomaly Signals</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.slice(0, 6).map(t => (
                    <tr key={t.tender_id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }} className="mono">{t.tender_id}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-dark)', maxWidth: '240px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.department}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }} className="mono">
                        ₹{(t.award_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.bidder_count}</td>
                      <td style={{ padding: '12px' }}>
                        {renderRiskBadge(t.risk_level, t.attention_score)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(t.anomaly_flags || []).slice(0, 2).map(flag => (
                            <span key={flag} style={{ fontSize: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {flag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: t.case_status === 'UNDER_REVIEW' ? '#EA580C' : 'var(--text-dim)' }}>
                          {t.case_status || 'NEW'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedTenderId(t.tender_id);
                            setActiveTab('investigation');
                          }}
                          style={{
                            background: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. THREE-PANEL INVESTIGATION WORKSPACE (PRD Section 30, 31, 36, 37) */}
        {activeTab === 'investigation' && (
          <div className="page-content animate-fade-in" style={{ padding: '20px 24px' }}>
            {/* Investigation Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '2px 8px', borderRadius: '4px' }} className="mono">
                    {currentTender.tender_id}
                  </span>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {currentTender.title}
                  </h1>
                  {renderRiskBadge(currentTender.risk_level, currentTender.attention_score)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', gap: '16px' }}>
                  <span>Department: <b>{currentTender.department}</b></span>
                  <span>Category: <b>{currentTender.category}</b></span>
                  <span>Location: <b>{currentTender.location}</b></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    setShowMeWhyOpen(true);
                    setShowMeWhyStep(0);
                  }}
                  className="clay-button-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  <Sparkles size={16} />
                  Show Me Why
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-dark)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  Audit Dossier (PDF)
                </button>
              </div>
            </div>

            {/* THREE-PANEL GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '20px', minHeight: '750px' }}>
              {/* LEFT PANEL: Procurement Details & Bidders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="clay-box" style={{ padding: '18px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '12px' }}>
                    Procurement Financials
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Estimated Value:</span>
                      <span className="mono" style={{ fontWeight: 600 }}>₹{(currentTender.estimated_value || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Award Amount:</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{(currentTender.award_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Winning Bidder:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{currentTender.winner_name || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Notice Date:</span>
                      <span className="mono">{currentTender.tender_date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Submission Close:</span>
                      <span className="mono">{currentTender.closing_date}</span>
                    </div>
                  </div>
                </div>

                <div className="clay-box" style={{ padding: '18px', flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '12px' }}>
                    Submitted Quotes ({currentTender.bids?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(currentTender.bids || []).map((b, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: b.is_winner ? 'var(--primary-subtle)' : 'var(--surface-alt)',
                          border: `1px solid ${b.is_winner ? 'rgba(63, 42, 150, 0.3)' : 'var(--border-subtle)'}`,
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>
                          <span>{b.vendor_name}</span>
                          {b.is_winner && (
                            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>WINNER (L1)</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                          <span className="mono">₹{(b.bid_amount || 0).toLocaleString('en-IN')}</span>
                          <span className="mono" style={{ fontSize: '11px' }}>{b.bid_timestamp?.split(' ')[1] || '10:00:00'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CENTER PANEL: Risk Breakdown, Evidence & Graph */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Score Header Card */}
                <div className="clay-score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        COMPOSITE ATTENTION SCORE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {currentTender.attention_score}
                        </span>
                        <span style={{ fontSize: '18px', color: 'var(--text-dim)', fontWeight: 600 }}>/ 100</span>
                        {renderRiskBadge(currentTender.risk_level)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Score decomposes into {currentTender.evidence_bundle?.components?.length || 0} independent forensic contributors.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowMeWhyOpen(true);
                        setShowMeWhyStep(0);
                      }}
                      className="clay-button-primary"
                      style={{ fontSize: '13px' }}
                    >
                      <Sparkles size={16} />
                      Interactive Evidence Trace
                    </button>
                  </div>
                </div>

                {/* Decomposed Evidence Signals */}
                <div className="clay-box" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '14px' }}>
                    Contributing Forensic Signals & Evidence
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(currentTender.evidence_bundle?.components || []).map((comp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)' }}>
                            {comp.name}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }} className="mono">
                            +{comp.contribution} pts
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>
                          {comp.evidence}
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <b>Peer Baseline:</b> {comp.peer_baseline || 'Normative'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Embedded Bipartite Graph Preview */}
                <div className="clay-box" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      Local Relationship Graph
                    </h3>
                    <button
                      onClick={() => setActiveTab('graph')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open Full Graph <ExternalLink size={12} style={{ display: 'inline' }} />
                    </button>
                  </div>
                  <div style={{
                    height: '180px',
                    background: 'var(--surface-alt)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <Network size={36} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Connected to {currentTender.bids?.length || 0} competing vendor nodes.
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: AI Copilot & Case Management */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* AI Copilot Card */}
                <div className="clay-box" style={{ padding: '18px', display: 'flex', flexDirection: 'column', height: '420px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                    <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>Procurement Copilot</span>
                    <span style={{ fontSize: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 600 }}>
                      Grounded
                    </span>
                  </div>

                  {/* Messages Scroll Area */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                    {copilotMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          lineHeight: 1.5,
                          background: msg.sender === 'assistant' ? 'var(--surface-alt)' : 'var(--primary-subtle)',
                          color: msg.sender === 'assistant' ? 'var(--text-dark)' : 'var(--primary)',
                          alignSelf: msg.sender === 'assistant' ? 'flex-start' : 'flex-end',
                          maxWidth: '95%'
                        }}
                      >
                        {msg.structured ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontWeight: 600 }}>{msg.structured.summary}</div>
                            {msg.structured.observed_facts && (
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                <b>Observed Facts:</b> {msg.structured.observed_facts[0]}
                              </div>
                            )}
                            {msg.structured.recommended_review_actions && (
                              <div style={{ fontSize: '11px', color: 'var(--primary)' }}>
                                <b>Action:</b> {msg.structured.recommended_review_actions[0]}
                              </div>
                            )}
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))}
                    {copilotLoading && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Analyzing evidence bundle...
                      </div>
                    )}
                  </div>

                  {/* Suggested Prompts */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0' }}>
                    {[
                      'Why was this prioritized?',
                      'Check margin lockstep',
                      'Review threshold'
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => handleSendCopilot(prompt)}
                        style={{
                          background: 'var(--surface-subtle)',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Query Input */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
                      placeholder="Ask evidence question..."
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        fontSize: '12px',
                        outline: 'none',
                        background: 'var(--surface)'
                      }}
                    />
                    <button
                      onClick={() => handleSendCopilot()}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>

                {/* Case Management & Assignee Card */}
                <div className="clay-box" style={{ padding: '18px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '12px' }}>
                    Case Management
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 600 }}>
                        Investigation Status
                      </label>
                      <select
                        value={currentTender.case_status || 'NEW'}
                        onChange={(e) => handleUpdateCaseStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--surface)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <option value="NEW">NEW</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="NEEDS_EVIDENCE">NEEDS_EVIDENCE</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 600 }}>
                        Assignee
                      </label>
                      <input
                        readOnly
                        value="A. Sharma (Lead Forensic Auditor)"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--surface-alt)',
                          fontSize: '12px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 600 }}>
                        Add Investigator Note
                      </label>
                      <textarea
                        rows={2}
                        value={investigatorNote}
                        onChange={(e) => setInvestigatorNote(e.target.value)}
                        placeholder="Document audit finding..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          fontSize: '12px',
                          background: 'var(--surface)',
                          resize: 'none'
                        }}
                      />
                      <button
                        onClick={handleAddNote}
                        style={{
                          marginTop: '6px',
                          width: '100%',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-light)',
                          padding: '6px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Save Note to Case Audit Trail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PROCUREMENT EXPLORER VIEW (PRD Section 29) */}
        {activeTab === 'procurements' && (
          <div className="page-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Procurement Explorer</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Filter, sort, and inspect public procurement tenders across jurisdictions</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="clay-box" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-dim)' }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tender ID, title, winner, or department..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'var(--surface)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>Risk:</span>
                {['All', 'High', 'Elevated', 'Moderate', 'Low'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setRiskFilter(lvl)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: riskFilter === lvl ? 'var(--primary)' : 'var(--surface-alt)',
                      color: riskFilter === lvl ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--surface)'
                  }}
                >
                  <option value="All">All Departments</option>
                  <option value="Public Works Department">Public Works Department</option>
                  <option value="Health and Family Welfare">Health and Family Welfare</option>
                  <option value="Energy Department">Energy Department</option>
                  <option value="Department of Education">Department of Education</option>
                  <option value="Urban Water Supply Board">Urban Water Supply Board</option>
                  <option value="Renewable Energy Agency">Renewable Energy Agency</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="clay-box" style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Tender ID</th>
                    <th style={{ padding: '10px 12px' }}>Title</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Award Value</th>
                    <th style={{ padding: '10px 12px' }}>Winner</th>
                    <th style={{ padding: '10px 12px' }}>Attention Score</th>
                    <th style={{ padding: '10px 12px' }}>Anomaly Signals</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenders.map(t => (
                    <tr key={t.tender_id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }} className="mono">{t.tender_id}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-dark)', maxWidth: '260px' }}>
                        {t.title}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.department}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }} className="mono">
                        ₹{(t.award_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{t.winner_name || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{renderRiskBadge(t.risk_level, t.attention_score)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(t.anomaly_flags || []).map(flag => (
                            <span key={flag} style={{ fontSize: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {flag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedTenderId(t.tender_id);
                            setActiveTab('investigation');
                          }}
                          style={{
                            background: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. INGESTION & FIELD MAPPING VIEW (PRD Section 12, 13, 14, 15) */}
        {activeTab === 'upload' && (
          <div className="page-content animate-fade-in" style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Dataset Ingestion & Intelligent Mapping</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Upload tender datasets in CSV, XLSX, or JSON. Automatic column alias detection and validation checks.
              </p>
            </div>

            {/* Claymorphic Dropzone */}
            <div
              className="clay-box"
              style={{
                padding: '48px',
                textAlign: 'center',
                border: '2px dashed var(--primary)',
                background: 'var(--surface)',
                marginBottom: '24px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setUploadState({
                  fileLoaded: true,
                  fileName: 'procurement_karnataka_2026_q1.csv',
                  mappingReady: true,
                  analyzed: false,
                  totalRows: 31,
                  validRows: 31,
                  duplicates: 0,
                  transformations: 14
                });
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FolderPlus size={30} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Drag & drop your procurement dataset here
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px' }}>
                Supports CSV, XLSX, and JSON tables conforming to OCDS standards
              </p>
              <button className="clay-button-primary" style={{ fontSize: '13px', margin: '0 auto' }}>
                Select File from Disk
              </button>
            </div>

            {/* Quick Demo Pre-load Helper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)' }}>Want to test with verified benchmark data?</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Instant load pre-configured hackathon showcase scenario (12 tenders, 31 bids).</div>
              </div>
              <button
                onClick={() => {
                  setUploadState({
                    fileLoaded: true,
                    fileName: 'datasets/demo/procurement_showcase.csv',
                    mappingReady: true,
                    analyzed: true,
                    totalRows: 31,
                    validRows: 31,
                    duplicates: 0,
                    transformations: 18
                  });
                }}
                style={{
                  background: 'white',
                  border: '1px solid var(--border-light)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Load Showcase Dataset
              </button>
            </div>

            {/* Schema Mapping & Validation Summary */}
            {uploadState.fileLoaded && (
              <div className="clay-box" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      Detected Field Mappings: {uploadState.fileName}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Canonical matching engine confidence &gt; 95%</p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--risk-low)', fontWeight: 600, background: 'var(--risk-low-bg)', padding: '4px 10px', borderRadius: '6px' }}>
                    ✓ 12/12 Fields Mapped
                  </span>
                </div>

                {/* Validation Telemetry */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', background: 'var(--surface-alt)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL ROWS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)' }}>{uploadState.totalRows}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--risk-low-bg)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--risk-low)', fontWeight: 600 }}>VALID ROWS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--risk-low)' }}>{uploadState.validRows}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--surface-alt)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>EXACT DUPLICATES</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)' }}>{uploadState.duplicates}</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--primary-subtle)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>TRANSFORMATIONS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{uploadState.transformations}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                  }}
                  className="clay-button-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '14px', padding: '12px' }}
                >
                  <Activity size={17} />
                  Execute Multi-Signal Forensic Analysis (4 Engines)
                </button>
              </div>
            )}
          </div>
        )}

        {/* 8. BIPARTITE GRAPH EXPLORER (PRD Section 32 & 33) */}
        {activeTab === 'graph' && (
          <div className="page-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Bipartite Graph Explorer</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Vendor ↔ Tender network intelligence. Visualizing co-bidding clusters, high-degree contractors, and winning paths.
                </p>
              </div>
            </div>

            <div className="clay-box" style={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                    Tenders (12)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></span>
                    Vendors (19)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '2px', background: 'var(--risk-elevated)' }}></span>
                    Awarded (WON)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '2px', background: 'var(--text-dim)', borderStyle: 'dashed' }}></span>
                    Quote (BID_ON)
                  </span>
                </div>
              </div>

              {/* Interactive SVG Graph Canvas */}
              <div style={{ flex: 1, background: 'var(--surface-alt)', borderRadius: '16px', position: 'relative', overflow: 'hidden', minHeight: '500px' }}>
                <svg width="100%" height="500" viewBox="0 0 1000 500" style={{ cursor: 'grab' }}>
                  <defs>
                    <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.2)" />
                    </pattern>
                  </defs>
                  <rect width="1000" height="500" fill="url(#graph-grid)" />

                  {/* Edges */}
                  <line x1="220" y1="140" x2="500" y2="120" stroke="var(--risk-elevated)" strokeWidth="2.5" />
                  <line x1="220" y1="220" x2="500" y2="120" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4" />
                  <line x1="220" y1="300" x2="500" y2="120" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4" />

                  <line x1="220" y1="380" x2="500" y2="280" stroke="var(--risk-elevated)" strokeWidth="2.5" />
                  <line x1="220" y1="440" x2="500" y2="280" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4" />

                  <line x1="780" y1="180" x2="500" y2="200" stroke="var(--risk-elevated)" strokeWidth="2.5" />
                  <line x1="780" y1="260" x2="500" y2="200" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4" />
                  <line x1="780" y1="340" x2="500" y2="200" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4" />

                  {/* Tenders (Center Column) */}
                  <g onClick={() => { setSelectedTenderId('TND-2026-0104'); setActiveTab('investigation'); }} style={{ cursor: 'pointer' }}>
                    <circle cx="500" cy="120" r="26" fill="var(--surface)" stroke="var(--risk-elevated)" strokeWidth="3" />
                    <text x="500" y="124" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-dark)">TND-0104</text>
                    <text x="500" y="160" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)">Arterial Road</text>
                  </g>

                  <g onClick={() => { setSelectedTenderId('TND-2026-0101'); setActiveTab('investigation'); }} style={{ cursor: 'pointer' }}>
                    <circle cx="500" cy="200" r="24" fill="var(--surface)" stroke="var(--risk-elevated)" strokeWidth="3" />
                    <text x="500" y="204" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-dark)">TND-0101</text>
                    <text x="500" y="238" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)">Smart Signals</text>
                  </g>

                  <g onClick={() => { setSelectedTenderId('TND-2026-0106'); setActiveTab('investigation'); }} style={{ cursor: 'pointer' }}>
                    <circle cx="500" cy="280" r="22" fill="var(--surface)" stroke="#EA580C" strokeWidth="2.5" />
                    <text x="500" y="284" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-dark)">TND-0106</text>
                    <text x="500" y="318" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)">Circuit Breaker</text>
                  </g>

                  {/* Vendors (Left & Right Column) */}
                  <g>
                    <rect x="70" y="120" width="150" height="34" rx="8" fill="var(--surface)" stroke="var(--accent-cyan)" strokeWidth="2" />
                    <text x="145" y="142" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-dark)">Kavira Roadworks</text>
                  </g>
                  <g>
                    <rect x="70" y="200" width="150" height="34" rx="8" fill="var(--surface)" stroke="var(--border-light)" strokeWidth="1.5" />
                    <text x="145" y="222" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--text-muted)">Shree Balaji Builders</text>
                  </g>
                  <g>
                    <rect x="70" y="280" width="150" height="34" rx="8" fill="var(--surface)" stroke="var(--border-light)" strokeWidth="1.5" />
                    <text x="145" y="302" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--text-muted)">United Civil Const.</text>
                  </g>

                  <g>
                    <rect x="780" y="160" width="160" height="34" rx="8" fill="var(--surface)" stroke="var(--accent-cyan)" strokeWidth="2" />
                    <text x="860" y="182" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-dark)">Apex InfraTech</text>
                  </g>
                  <g>
                    <rect x="780" y="240" width="160" height="34" rx="8" fill="var(--surface)" stroke="var(--border-light)" strokeWidth="1.5" />
                    <text x="860" y="262" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--text-muted)">BluePeak Urban</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 9. VENDOR DIRECTORY VIEW (PRD Section 16) */}
        {activeTab === 'vendors' && (
          <div className="page-content animate-fade-in">
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Vendor Intelligence Profiles</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Normalized vendor entities with win rates, historical concentrations, and relationship footprints.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
              {[
                { name: 'Kavira Roadworks Ltd', wins: 4, bids: 6, total: 33800000, risk: 'High', depts: ['Public Works Department'] },
                { name: 'Apex InfraTech Solutions', wins: 3, bids: 4, total: 14925000, risk: 'Elevated', depts: ['Public Works Department', 'Urban Development'] },
                { name: 'MedVanguard Healthcare', wins: 4, bids: 5, total: 76500000, risk: 'Elevated', depts: ['Health and Family Welfare'] },
                { name: 'PowerGrid Allied Systems', wins: 2, bids: 3, total: 19500000, risk: 'Moderate', depts: ['Energy Department'] },
                { name: 'ElectroDynamics Corp', wins: 1, bids: 3, total: 9820000, risk: 'Moderate', depts: ['Energy Department'] },
                { name: 'EduSmart Systems Pvt Ltd', wins: 1, bids: 1, total: 12400000, risk: 'Moderate', depts: ['Department of Education'] }
              ].map(v => (
                <div key={v.name} className="clay-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>{v.name}</h3>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{v.depts.join(', ')}</div>
                    </div>
                    {renderRiskBadge(v.risk)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--surface-alt)', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Win Ratio:</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>
                        {v.wins} / {v.bids} ({Math.round(v.wins / v.bids * 100)}%)
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Awarded Value:</span>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }} className="mono">
                        ₹{(v.total / 10000000).toFixed(2)} Cr
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. CASE MANAGEMENT VIEW (PRD Section 31) */}
        {activeTab === 'cases' && (
          <div className="page-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Investigation Cases</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Human review workflows, notes, assigned auditors, and forensic conclusions.
                </p>
              </div>
            </div>

            <div className="clay-box" style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Case Ref</th>
                    <th style={{ padding: '10px 12px' }}>Tender ID</th>
                    <th style={{ padding: '10px 12px' }}>Priority</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Assignee</th>
                    <th style={{ padding: '10px 12px' }}>Due Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {casesList.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }} className="mono">{c.case_no}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }} className="mono">{c.tender_id}</td>
                      <td style={{ padding: '12px' }}>{renderRiskBadge(c.priority)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{c.assignee}</td>
                      <td style={{ padding: '12px', color: 'var(--text-dim)' }} className="mono">{c.due_date || '2026-03-30'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedTenderId(c.tender_id);
                            setActiveTab('investigation');
                          }}
                          style={{
                            background: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 11. AUDIT DOSSIERS VIEW (PRD Section 41) */}
        {activeTab === 'reports' && (
          <div className="page-content animate-fade-in" style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>Audit Dossiers & Reports</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                One-click forensic report generator conforming strictly to the 14-section master audit schema.
              </p>
            </div>

            <div className="clay-box" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Export Case Dossier: CASE-2026-001
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    Arterial Road Resurfacing Ward 4 (TND-2026-0104)
                  </p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="clay-button-primary"
                  style={{ fontSize: '13px' }}
                >
                  <Download size={15} /> Download PDF Dossier
                </button>
              </div>

              {/* Dossier Preview Container */}
              <div style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CIVICGRAPH AUDIT — FORENSIC REPORT PREVIEW
                </div>
                <p style={{ color: 'var(--text-dark)', lineHeight: 1.6 }}>
                  <b>Executive Summary:</b> Procurement TND-2026-0104 was flagged for review with a composite attention score of 87/100 (High priority). Forensic signal analysis detected a sub-1% bid margin lockstep (0.35%) and synchronous submission timing interval (53s) between competing entities Kavira Roadworks and Shree Balaji Builders.
                </p>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-dim)' }}>
                  <span><b>Format:</b> ISO PDF / ReportLab</span>
                  <span><b>Integrity:</b> Neutral terminology verified</span>
                  <span><b>Status:</b> Ready for committee submission</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 12. FLAGSHIP "SHOW ME WHY" INTERACTIVE STEP-THROUGH MODAL */}
      {showMeWhyOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="clay-box animate-fade-in" style={{
            width: '680px',
            background: 'var(--surface)',
            borderRadius: '20px',
            padding: '32px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowMeWhyOpen(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
              <Sparkles size={18} />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SHOW ME WHY — EVIDENCE TRACE
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
              Why was {currentTender.tender_id} flagged?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Transparent step-by-step decomposition of statistical signals against peer-group baselines.
            </p>

            {/* Stepper Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  onClick={() => setShowMeWhyStep(idx)}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: showMeWhyStep >= idx ? 'var(--primary)' : 'var(--surface-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>

            {/* Step 0: Submission Timing Lockstep */}
            {showMeWhyStep === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Step 1: Unusual Submission Timing Pattern
                  </h3>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }} className="mono">+36.5 pts</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '13px', lineHeight: 1.6 }}>
                  Multiple competing bids were submitted within <b>53 seconds</b> of each other on the closing deadline date (2026-02-20).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--risk-elevated-bg)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--risk-elevated)', fontWeight: 600 }}>Observed Delta:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--risk-elevated)' }}>53 Seconds</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Peer Group Median:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>14,200 Seconds (~4 hrs)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Bid Spread Lockstep */}
            {showMeWhyStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Step 2: Narrow Bid Spread Lockstep
                  </h3>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }} className="mono">+28.0 pts</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '13px', lineHeight: 1.6 }}>
                  The price difference between the winning quote (₹84,50,000) and runner-up quote (₹84,80,000) was only <b>0.35%</b>, indicating an abnormally compressed bid margin.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--risk-elevated-bg)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--risk-elevated)', fontWeight: 600 }}>Observed Margin:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--risk-elevated)' }}>0.35% Spread</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Peer Benchmark:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>&gt; 6.5% Typical Spread</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Vendor Concentration */}
            {showMeWhyStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Step 3: Departmental Win Concentration
                  </h3>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }} className="mono">+22.5 pts</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '13px', lineHeight: 1.6 }}>
                  Vendor <b>Kavira Roadworks Ltd</b> has won 4 out of 6 recent comparable road resurfacing tenders within the Public Works Department.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--risk-mod-bg)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--risk-mod)', fontWeight: 600 }}>Department Win Share:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--risk-mod)' }}>66.7% Win Rate</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Peer Baseline Ceiling:</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>&lt; 28% Competitive Norm</div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <button
                disabled={showMeWhyStep === 0}
                onClick={() => setShowMeWhyStep(prev => prev - 1)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: showMeWhyStep === 0 ? 'not-allowed' : 'pointer',
                  opacity: showMeWhyStep === 0 ? 0.4 : 1
                }}
              >
                Previous
              </button>

              {showMeWhyStep < 2 ? (
                <button
                  onClick={() => setShowMeWhyStep(prev => prev + 1)}
                  className="clay-button-primary"
                  style={{ fontSize: '13px' }}
                >
                  Next Evidence Point
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setShowMeWhyOpen(false)}
                  className="clay-button-primary"
                  style={{ fontSize: '13px' }}
                >
                  Close & Proceed with Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 13. GLOBAL COMMAND PALETTE (Ctrl+K) */}
      {cmdPaletteOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '120px',
          zIndex: 110
        }} onClick={() => setCmdPaletteOpen(false)}>
          <div className="clay-box animate-fade-in" style={{
            width: '560px',
            background: 'var(--surface)',
            borderRadius: '16px',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-light)', gap: '10px' }}>
              <Search size={18} style={{ color: 'var(--primary)' }} />
              <input
                autoFocus
                placeholder="Type a command or search tenders..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'var(--text-dark)'
                }}
              />
              <kbd style={{ background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                ESC
              </kbd>
            </div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Go to Dashboard', action: () => setActiveTab('dashboard'), icon: BarChart3 },
                { label: 'Inspect Flagship Cover-Bidding Case (TND-2026-0104)', action: () => { setSelectedTenderId('TND-2026-0104'); setActiveTab('investigation'); }, icon: Shield },
                { label: 'Inspect Threshold Proximity Tender (TND-2026-0101)', action: () => { setSelectedTenderId('TND-2026-0101'); setActiveTab('investigation'); }, icon: AlertTriangle },
                { label: 'Open Bipartite Relationship Graph', action: () => setActiveTab('graph'), icon: Network },
                { label: 'Upload & Ingest New Dataset', action: () => setActiveTab('upload'), icon: FolderPlus },
                { label: 'Export Audit Dossier (PDF)', action: handleDownloadPDF, icon: Download }
              ].map((cmd, idx) => {
                const IconC = cmd.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => { cmd.action(); setCmdPaletteOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-dark)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <IconC size={16} style={{ color: 'var(--text-dim)' }} />
                    <span>{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
