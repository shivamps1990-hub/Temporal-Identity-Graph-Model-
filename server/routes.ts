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
    res.json({ ...snapshot, license: "Apache-2.0" });
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
      total_events: segments.reduce((acc, s) => acc + s.event_ids.length, 0),
      license: "Apache-2.0"
    });
  });

  // === RESEARCH VALIDATION ENDPOINTS ===

  app.post('/api/research/upload-dataset', async (req, res) => {
    try {
      const { events, acknowledge_no_accuracy } = req.body;

      if (!acknowledge_no_accuracy) {
        return res.status(400).json({
          message: "Upload requires acknowledgment that this system does not evaluate detection or classification metrics. Set acknowledge_no_accuracy to true."
        });
      }

      if (!events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ message: "Events array is required and must not be empty." });
      }

      const validated: NormalizedEvent[] = [];
      const errors: { index: number; error: string }[] = [];

      for (let i = 0; i < events.length; i++) {
        try {
          const parsed = api.events.inject.input.parse(events[i]);
          validated.push(parsed);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.push({ index: i, error: err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
          } else {
            errors.push({ index: i, error: "Unknown validation error" });
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: `${errors.length} event(s) failed schema validation`,
          validation_errors: errors,
          valid_count: validated.length
        });
      }

      await storage.resetGraph();

      let processed = 0;
      for (const event of validated) {
        await storage.injectEvent(event);
        processed++;
      }

      storage.setScenarioInfo("researcher_upload", 0);
      const snapshot = await storage.getGraphSnapshot();

      res.json({
        dataset_id: snapshot.version,
        events_processed: processed,
        graph_hash: snapshot.version,
        nodes: snapshot.stats.node_count,
        edges: snapshot.stats.edge_count
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Dataset upload failed" });
    }
  });

  app.post('/api/research/validate-structure', async (req, res) => {
    try {
      const { expected_paths } = req.body;

      if (!expected_paths || !Array.isArray(expected_paths)) {
        return res.status(400).json({ message: "expected_paths array is required" });
      }

      const snapshot = await storage.getGraphSnapshot();
      const edgeMap = new Map<string, boolean>();
      for (const edge of snapshot.edges) {
        edgeMap.set(`${edge.source}|${edge.target}`, true);
      }

      const validated_paths: { path: string[]; status: string }[] = [];
      const missing_paths: { path: string[]; missing_segment: { from: string; to: string } }[] = [];

      for (const expectedPath of expected_paths) {
        if (!Array.isArray(expectedPath) || expectedPath.length < 2) continue;

        let pathValid = true;
        let missingFrom = "";
        let missingTo = "";

        for (let i = 0; i < expectedPath.length - 1; i++) {
          const key = `${expectedPath[i]}|${expectedPath[i + 1]}`;
          if (!edgeMap.has(key)) {
            pathValid = false;
            missingFrom = expectedPath[i];
            missingTo = expectedPath[i + 1];
            break;
          }
        }

        if (pathValid) {
          validated_paths.push({ path: expectedPath, status: "reconstructed" });
        } else {
          missing_paths.push({ path: expectedPath, missing_segment: { from: missingFrom, to: missingTo } });
        }
      }

      const allEdgePairs = snapshot.edges.map(e => `${e.source}->${e.target}`);
      const expectedPairSets = new Set(
        expected_paths.flatMap((p: string[]) => {
          const pairs: string[] = [];
          for (let i = 0; i < p.length - 1; i++) pairs.push(`${p[i]}->${p[i + 1]}`);
          return pairs;
        })
      );
      const unexpected_paths = allEdgePairs
        .filter(p => !expectedPairSets.has(p))
        .slice(0, 20);

      res.json({ validated_paths, missing_paths, unexpected_paths });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Structural validation failed" });
    }
  });

  app.post('/api/research/validate-temporal', async (req, res) => {
    try {
      const { path, expected_windows } = req.body;

      if (!path || !Array.isArray(path) || path.length < 2) {
        return res.status(400).json({ message: "path must be an array of at least 2 node IDs" });
      }
      if (!expected_windows || !Array.isArray(expected_windows)) {
        return res.status(400).json({ message: "expected_windows array is required" });
      }

      const snapshot = await storage.getGraphSnapshot();
      const edgeMap = new Map(
        snapshot.edges.map(e => [`${e.source}|${e.target}`, e])
      );

      const edgeWindows: { from: string; to: string; first_seen: string; last_seen: string }[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const key = `${path[i]}|${path[i + 1]}`;
        const edge = edgeMap.get(key);
        if (edge) {
          edgeWindows.push({
            from: path[i],
            to: path[i + 1],
            first_seen: edge.first_seen,
            last_seen: edge.last_seen
          });
        }
      }

      let overlapStart = 0;
      let overlapEnd = Infinity;
      for (const ew of edgeWindows) {
        overlapStart = Math.max(overlapStart, new Date(ew.first_seen).getTime());
        overlapEnd = Math.min(overlapEnd, new Date(ew.last_seen).getTime());
      }

      const observed_windows = edgeWindows.length === path.length - 1 && overlapStart <= overlapEnd
        ? [{ start: new Date(overlapStart).toISOString(), end: new Date(overlapEnd).toISOString() }]
        : [];

      let matches = false;
      if (observed_windows.length > 0) {
        for (const ew of expected_windows) {
          const ewStart = new Date(ew.start).getTime();
          const ewEnd = new Date(ew.end).getTime();
          if (overlapStart <= ewEnd && overlapEnd >= ewStart) {
            matches = true;
            break;
          }
        }
      }

      res.json({
        path,
        expected_windows,
        observed_windows,
        edge_details: edgeWindows,
        matches
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Temporal validation failed" });
    }
  });

  app.post('/api/research/verify-determinism', async (req, res) => {
    try {
      const allEvents = await storage.getEvents();
      if (allEvents.length === 0) {
        return res.status(400).json({ message: "No events in current dataset to verify" });
      }

      const sortedEvents = [...allEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const { GraphEngine: GE } = await import("./graph_engine");

      const engine1 = new GE();
      for (const event of sortedEvents) engine1.processEvent(event);
      const snap1 = engine1.getSnapshot();

      const engine2 = new GE();
      for (const event of sortedEvents) engine2.processEvent(event);
      const snap2 = engine2.getSnapshot();

      const deterministic = snap1.version === snap2.version;

      res.json({
        deterministic,
        graph_hash: snap1.version,
        replay_count: 2,
        events_replayed: sortedEvents.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Determinism verification failed" });
    }
  });

  // === END RESEARCH VALIDATION ENDPOINTS ===

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
