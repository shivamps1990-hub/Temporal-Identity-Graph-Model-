import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === DOMAIN MODELS (In-Memory Graph) ===

// 1. Node Types
export const NodeTypes = ["HUMAN", "WORKLOAD", "SERVICE_ACCOUNT", "PLC", "HMI", "RESOURCE", "IDENTITY"] as const;
export const NodePlatforms = ["enterprise", "aws", "ci_cd", "k8s", "ot"] as const;
export const LifecycleStates = ["ACTIVE", "STALE", "DECOMMISSIONED"] as const;

export const NodeDataSchema = z.object({
  id: z.string(),
  type: z.enum(NodeTypes),
  platform: z.enum(NodePlatforms),
  lifecycle_state: z.enum(LifecycleStates),
  risk_score: z.number(),
  first_seen: z.string(), // ISO Timestamp
  last_seen: z.string(),  // ISO Timestamp
  provenance: z.array(z.string()), // List of event_ids
});

// 2. Edge Types
export const EdgeLabels = ["AUTHENTICATES_WITH", "ASSUMES", "ACCESSES", "COMMUNICATES_WITH", "CONTROLS"] as const;

export const EdgeDataSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.enum(EdgeLabels),
  first_seen: z.string(),
  last_seen: z.string(),
  provenance: z.array(z.string()),
});

// 3. Event Schema (Input)
export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  timestamp: z.string(), // ISO-8601
  subject: z.object({
    id: z.string(),
    type: z.enum(NodeTypes),
    platform: z.enum(NodePlatforms),
    lifecycle_state: z.enum(LifecycleStates),
    risk_score: z.number(),
  }),
  relationships: z.array(z.object({
    label: z.enum(EdgeLabels),
    target: z.object({
      id: z.string(),
      type: z.string(), // "IDENTITY | RESOURCE" - keeping broad for target
    })
  }))
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;
export type GraphNode = z.infer<typeof NodeDataSchema>;
export type GraphEdge = z.infer<typeof EdgeDataSchema>;

// === API RESPONSE TYPES ===

export const GraphSnapshotSchema = z.object({
  version: z.string(), // Hash of graph state
  nodes: z.array(NodeDataSchema),
  edges: z.array(EdgeDataSchema),
  stats: z.object({
    node_count: z.number(),
    edge_count: z.number(),
    event_count: z.number(),
  })
});

export type GraphSnapshot = z.infer<typeof GraphSnapshotSchema>;

export const PathSegmentSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string(),
  event_ids: z.array(z.string())
});

export const ReachabilityResultSchema = z.object({
  paths: z.array(z.array(PathSegmentSchema)),
  found: z.boolean()
});

export const ThreatResultSchema = z.object({
  type: z.string(), // "over-delegation", "orphan", "it-ot-bridge"
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string(),
  involved_nodes: z.array(z.string()),
  evidence: z.array(z.string()) // event_ids
});

// === DATABASE SCHEMA (Optional / for logs if needed later) ===
// We define a simple table to store logs if we want persistence, 
// though the prototype is largely in-memory.
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  content: jsonb("content").notNull(),
  ingested_at: timestamp("ingested_at").defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs);
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
