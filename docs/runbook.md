# Temporal Identity Graph - Runbook

## Quick Start

1. Open the application (runs on port 5000)
2. The CICD Compromise scenario is auto-loaded on startup
3. Use the scenario selector dropdown on the Dashboard to load different scenarios

## Available Scenarios

| Scenario | Description | Events |
|---|---|---|
| cicd_compromise | Human -> Jenkins -> Cloud Role -> K8s -> OT Gateway -> PLC | ~25 |
| ot_full_attack_chain | Dev -> GitLab CI -> Token -> Cloud -> Secrets -> K8s -> OT -> SCADA -> PLC | ~120 |
| cloud_ot_bridge | Terraform SA -> VPC -> OT DMZ -> Historian -> HMI -> PLC | ~20 |
| role_sprawl | Single SA assuming 8+ roles | ~26 |
| dormant_wakeup | Legacy SA dormant then reactivated for exfil | ~25 |
| baseline | Normal noise traffic | ~50 |

## How to Replay a Scenario

### Via UI
1. Select a scenario from the dropdown on the Dashboard
2. Click "Load"
3. Graph will reset and replay events
4. Graph hash is displayed below the header

### Via API
```bash
curl -X POST http://localhost:5000/api/events/replay \
  -H "Content-Type: application/json" \
  -d '{"scenario": "cicd_compromise", "reset": true, "seed": 42}'
```

## How to Reproduce Graph Hashes

The graph hash is a SHA-256 hash of the canonical JSON representation of nodes and edges (sorted deterministically). To reproduce:

1. Reset graph: `POST /api/graph/reset`
2. Replay scenario with seed=42: `POST /api/events/replay`
3. Record the `graph_hash` from the response
4. Repeat steps 1-2 on another machine
5. Hashes must match

## Temporal Replay

1. Use the replay slider on the Dashboard
2. Drag to a position or use play/pause/step controls
3. The graph filters to show only nodes/edges that existed at that point in time
4. Speed control: 0.5x, 1x, 2x, 5x, 10x

## Analysis

### Path Reachability
Go to Analysis tab -> Path Reachability. Enter source and target node IDs.

Example: Source `alice`, Target `plc-press-01` (in cicd_compromise scenario)

### Blast Radius
Go to Analysis tab -> Blast Radius. Enter a compromised node ID.

Example: Source `jenkins-master` (in cicd_compromise scenario)

### Threats
Go to Threats tab. Auto-detects:
- IT-OT Bridge violations
- Over-delegation (service accounts with 3+ roles)
- Dormant identity reactivation

## Limitations

- Graph is in-memory only (resets on server restart)
- No authentication or authorization
- No ML or prediction
- All risk scores are rule-based and deterministic
- Temporal filtering uses `first_seen` only (simplification)
