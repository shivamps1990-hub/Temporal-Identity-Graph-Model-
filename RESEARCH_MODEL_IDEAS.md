# Model Expansion and Dataset Generation Prompt

This section describes a canonical prompt template that contributors can use
to generate **new datasets** and **experimental modeling ideas** for
the Temporal Identity Graph system, particularly focusing on
Operational Technology (OT) scenarios and hybrid enterprise–OT attack surfaces.

---

## Purpose

The goal is to create:
1. **Diverse OT and IT–OT crossing scenarios** with realistic identity interactions
2. **Synthetic datasets** that push temporal and structural complexity
3. Models and experiments that stress-test reachability, blast radius,
   delegated trust, and delayed compromise recovery

---

## Prompt Template

Use this text as a basis for dataset generation and model idea exploration:

> Generate a synthetic dataset of identity and relationship events that includes:
>
> A mix of IT, Cloud, CI/CD, service accounts, automation tokens, and multiple classes of OT identities (PLCs, SCADA devices, industrial controllers, field sensors, gateways).
>
> Include high-frequency near-real-time event streams simulating:
>
> - CI/CD pipelines triggering cloud role assumptions
> - Workload deployments interacting with OT gateways
> - Broadcast protocols common in OT (Modbus, DNP3, OPC UA)
> - Service account rotations and expired credentials
>
> Include sequences that trigger the following complex patterns:
>
> - **Delayed blast radius**: identities that appear dormant, then become active due to indirect delegation
> - **Transitive OT access**: multi-hop identity paths from cloud workloads to OT controllers
> - **False orphaning**: identities that appear orphaned but reconnect later via indirect delegation
> - **Mixed lifecycle churn**: credentials being rotated, revoked, or shadowed over time
>
> Temporal compression: injection of events with variable timestamps to ensure:
>
> - Overlapping windows
> - Non-overlapping windows
> - Bursty events vs. slow churn
>
> Horizontal scaling: at least 100,000+ events across multiple threads to simulate:
>
> - Concurrent identity lifecycles
> - Noisy background traffic
> - Multi-unit OT clusters
>
> **Required output format:**
>
> - NDJSON file
> - Each object is a normalized identity event
> - Must include: `subject.id`, `subject.type`, `timestamp`
> - Edge relationships with labels and targets
> - Must be processable by the Temporal Identity Graph ingestion pipeline

---

## Output Expectations

When running the above prompt through your dataset generator:

The Temporal Identity Graph should produce:

- Complex multi-domain identity paths
- Non-trivial reachability
- Visible blast radius computation patterns
- Saturation of edge cases like identity resurrection, delayed trust decay, and ephemeral delegation reuse

These datasets will be used for:

- Benchmark experiments
- Visual temporal path replay
- Evaluation of model correctness and scalability

---

## Why This Matters

This prompt helps collaborators, researchers, and students explore **rich, realistic OT scenarios** that stress the model in ways not covered by the baseline scripts. It also provides a **repeatable template** for generating future datasets and comparative experiments.
