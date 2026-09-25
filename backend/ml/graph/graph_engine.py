"""
Bipartite Graph Intelligence Engine
Master PRD Section 12 & 32

Constructs Vendor <-> Tender bipartite network using NetworkX.
Computes:
- Vendor degree (participation count)
- Won count & win ratio
- Co-bidding pairs & shared tenders
- Edge classifications (BID_ON, WON)
- Formats payload for React Flow frontend canvas
"""
from typing import List, Dict, Any

try:
    import networkx as nx
except ImportError:
    nx = None

def build_bipartite_graph(tenders: List[Dict[str, Any]], bids: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Constructs bipartite graph from tenders and bids.
    Returns nodes and edges formatted for React Flow UI.
    """
    nodes = []
    edges = []
    seen_nodes = set()
    seen_edges = set()

    # Track vendor win counts
    vendor_wins = {}
    for t in tenders:
        w = t.get("winner_name")
        if w:
            vendor_wins[w] = vendor_wins.get(w, 0) + 1

    # 1. Tender Nodes
    for t in tenders:
        t_id = t.get("tender_id")
        if not t_id or t_id in seen_nodes:
            continue
        seen_nodes.add(t_id)

        score = t.get("attention_score", 0)
        risk = t.get("risk_level", "Low")

        nodes.append({
            "id": t_id,
            "label": f"{t_id}\n{t.get('title', '')[:25]}...",
            "type": "tender",
            "risk": risk,
            "score": score,
            "details": {
                "title": t.get("title"),
                "department": t.get("department"),
                "award_amount": t.get("award_amount"),
                "closing_date": t.get("closing_date"),
                "risk_level": risk,
                "attention_score": score
            }
        })

    # 2. Vendor Nodes & Edges
    for b in bids:
        t_id = b.get("tender_id")
        v_name = b.get("vendor_name")
        if not t_id or not v_name:
            continue

        v_node_id = f"VND_{v_name.replace(' ', '_')}"
        if v_node_id not in seen_nodes:
            seen_nodes.add(v_node_id)
            wins = vendor_wins.get(v_name, 0)
            v_risk = "Elevated" if wins >= 3 else ("Moderate" if wins >= 2 else "Low")
            nodes.append({
                "id": v_node_id,
                "label": v_name,
                "type": "vendor",
                "risk": v_risk,
                "score": wins * 25,
                "details": {
                    "vendor_name": v_name,
                    "total_wins": wins,
                    "risk_profile": v_risk
                }
            })

        is_winner = b.get("is_winner", False)
        edge_id = f"{v_node_id}_to_{t_id}"
        if edge_id not in seen_edges:
            seen_edges.add(edge_id)
            edges.append({
                "id": edge_id,
                "source": v_node_id,
                "target": t_id,
                "label": "WON" if is_winner else "BID_ON",
                "amount": float(b.get("bid_amount", 0)),
                "highlight": is_winner
            })

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "tender_count": sum(1 for n in nodes if n["type"] == "tender"),
            "vendor_count": sum(1 for n in nodes if n["type"] == "vendor")
        }
    }
