import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { NormalizedEvent } from "@shared/schema";
import { generateScenario, AVAILABLE_SCENARIOS } from "./lib/dataset_gen";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.events.inject.path, async (req, res) => {
    try {
      const event = api.events.inject.input.parse(req.body);
      const result = await storage.injectEvent(event);
      res.json({
        success: true,
        graph_version: result.version,
        nodes_affected: result.nodesAdded
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.issues);
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.post(api.events.replay.path, async (req, res) => {
    try {
      const { events, reset, scenario } = req.body;

      if (reset) {
        await storage.resetGraph();
      }

      let eventsToProcess: NormalizedEvent[] = events || [];

      const seed = req.body.seed || 42;
      if (scenario) {
        const generatedEvents = generateScenario(scenario, seed);
        eventsToProcess = [...eventsToProcess, ...generatedEvents];
        storage.setScenarioInfo(scenario, seed);
      }

      let processed = 0;
      for (const event of eventsToProcess) {
        await storage.injectEvent(event);
        processed++;
      }

      const snapshot = await storage.getGraphSnapshot();
      res.json({
        graph_hash: snapshot.version,
        stats: {
          events_processed: processed,
          final_nodes: snapshot.stats.node_count,
          final_edges: snapshot.stats.edge_count
        }
      });
    } catch (error) {
       console.error(error);
       res.status(500).json({ message: "Replay failed" });
    }
  });

  app.get(api.graph.snapshot.path, async (req, res) => {
    const timestamp = req.query.timestamp as string | undefined;
    const snapshot = await storage.getGraphSnapshot(timestamp);
    res.json(snapshot);
  });

  app.post(api.graph.reset.path, async (req, res) => {
    await storage.resetGraph();
    res.status(204).send();
  });

  app.get('/api/scenarios', async (_req, res) => {
    res.json(AVAILABLE_SCENARIOS);
  });

  app.get('/api/events', async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get('/api/analysis/threat-map', async (req, res) => {
    const timestamp = req.query.timestamp as string | undefined;
    const result = await storage.deriveThreatMap(timestamp);
    res.json(result);
  });

  app.get(api.analysis.reachability.path, async (req, res) => {
    const { source, target, k, timestamp } = req.query;
    if (!source || !target) return res.status(400).json({ message: "Missing source or target" });

    const result = await storage.findReachability(
      String(source),
      String(target),
      Number(k) || 5,
      timestamp ? String(timestamp) : undefined
    );
    res.json(result);
  });

  app.get(api.analysis.threats.path, async (req, res) => {
    const threats = await storage.analyzeThreats();
    res.json(threats);
  });

  app.get(api.analysis.blastRadius.path, async (req, res) => {
    const { source, k, timestamp } = req.query;
    if (!source) return res.status(400).json({ message: "Missing source" });
    const result = await storage.calculateBlastRadius(
      String(source),
      Number(k) || 3,
      timestamp ? String(timestamp) : undefined
    );
    res.json(result);
  });

  app.get('/export/replay-dataset', async (req, res) => {
    const events = await storage.getEvents();
    const ndjson = events.map(e => JSON.stringify(e)).join('\n');
    const { scenario, seed } = storage.getScenarioInfo();
    const filename = `replay_${scenario}_seed${seed}_${events.length}events.ndjson`;
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(ndjson);
  });

  app.get('/export/scenario-metadata', async (_req, res) => {
    const { scenario, seed } = storage.getScenarioInfo();
    const events = await storage.getEvents();
    const scenarioInfo = AVAILABLE_SCENARIOS.find(s => s.name === scenario);
    
    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const minTs = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null;
    const maxTs = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

    const midpointMs = timestamps.length
      ? Math.min(...timestamps) + (Math.max(...timestamps) - Math.min(...timestamps)) * 0.6
      : 0;

    res.json({
      scenario,
      seed,
      event_count: events.length,
      time_span: minTs && maxTs ? `${minTs} → ${maxTs}` : null,
      intended_patterns: scenarioInfo?.expected_threats || [],
      description: scenarioInfo?.description || "",
      intent: scenarioInfo?.intent || "",
      recommended_timestamps: midpointMs ? [new Date(midpointMs).toISOString()] : []
    });
  });

  app.get('/export/graph-snapshot', async (req, res) => {
    const timestamp = req.query.timestamp as string | undefined;
    const snapshot = await storage.getGraphSnapshot(timestamp);
    const filename = `graph_snapshot_${timestamp || 'live'}_${snapshot.version.substring(0, 8)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(snapshot);
  });

  app.post('/export/path-evidence', async (req, res) => {
    const { path: nodePath, timestamp } = req.body;
    if (!nodePath || !Array.isArray(nodePath) || nodePath.length < 2) {
      return res.status(400).json({ message: "Path must be an array of at least 2 node IDs" });
    }

    const snapshot = await storage.getGraphSnapshot(timestamp);
    const edgeMap = new Map(snapshot.edges.map(e => [`${e.source}|${e.target}`, e]));
    
    const segments = [];
    for (let i = 0; i < nodePath.length - 1; i++) {
      const src = nodePath[i];
      const tgt = nodePath[i + 1];
      let edge = null;
      for (const e of snapshot.edges) {
        if (e.source === src && e.target === tgt) {
          edge = e;
          break;
        }
      }
      segments.push({
        source: src,
        target: tgt,
        label: edge?.label || "UNKNOWN",
        first_seen: edge?.first_seen || null,
        last_seen: edge?.last_seen || null,
        event_ids: edge?.provenance || []
      });
    }

    res.json({
      path: nodePath,
      segments,
      timestamp: timestamp || null,
      graph_hash: snapshot.version,
      total_events: segments.reduce((acc, s) => acc + s.event_ids.length, 0)
    });
  });

  const existingSnapshot = await storage.getGraphSnapshot();
  if (existingSnapshot.stats.event_count === 0) {
    console.log("Seeding initial data (CICD Compromise Scenario)...");
    const events = generateScenario("cicd_compromise");
    for (const event of events) {
      await storage.injectEvent(event);
    }
    storage.setScenarioInfo("cicd_compromise", 42);
    console.log(`Seeded ${events.length} events.`);
  }

  return httpServer;
}
