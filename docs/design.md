# Temporal Identity Graph - Design Document

## Formal Model

```
G = (V, E, tau)
```

- **V** = set of identity nodes (Human, Workload, Service Account, PLC, HMI)
- **E** = directed labeled edges (AUTHENTICATES_WITH, ASSUMES, ACCESSES, COMMUNICATES_WITH, CONTROLS)
- **tau** = temporal metadata on each node and edge (first_seen, last_seen)

## Update Function

```
U(G, event) -> G'
```

Properties:
- **Deterministic**: Same input always produces same output
- **Monotonic**: No deletes; nodes/edges only created or time-extended
- **Idempotent**: Processing same event twice yields same graph state
- **Replay-safe**: Event order does not affect final graph (due to min/max on timestamps)

## Event Schema (Normalized)

```json
{
  "event_id": "string",
  "timestamp": "ISO-8601",
  "subject": {
    "id": "string",
    "type": "HUMAN | WORKLOAD | SERVICE_ACCOUNT | PLC | HMI",
    "platform": "enterprise | aws | ci_cd | k8s | ot",
    "lifecycle_state": "ACTIVE | STALE | DECOMMISSIONED",
    "risk_score": 0
  },
  "relationships": [{
    "label": "AUTHENTICATES_WITH | ASSUMES | ACCESSES | COMMUNICATES_WITH | CONTROLS",
    "target": { "id": "string", "type": "string" }
  }]
}
```

## Graph Hash

The graph hash is computed as:
1. Sort all nodes by ID (lexicographic)
2. Sort all edges by (source + target + label) (lexicographic)
3. Serialize as canonical JSON
4. Compute SHA-256

This provides a reproducibility proof: replay same events -> same hash.

## Architecture

```
[Normalized Events] -> U(G, event) -> [Temporal Graph] -> [Analysis Functions]
                                                         |
                                                         -> [Graph Snapshot]
                                                         -> [Reachability]
                                                         -> [Blast Radius]
                                                         -> [Threat Detection]
```

All analysis functions are **read-only** and do not mutate graph state.

## Dataset Generator

- Uses deterministic PRNG (seeded sine-based)
- Fixed base timestamp for reproducibility
- Deterministic event IDs (derived from properties, not random UUIDs)
- Supports multiple scenarios with different attack narratives

## Threat Detection Rules

1. **IT-OT Bridge**: Any edge from a non-OT platform node to an OT platform node
2. **Over-delegation**: Service account assuming 3+ roles
3. **Dormant Reactivation**: Decommissioned identity with active relationships

All rules are explicit, auditable, and deterministic.
