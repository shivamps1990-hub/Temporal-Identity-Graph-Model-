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

      if (scenario) {
        const seed = req.body.seed || 42;
        const generatedEvents = generateScenario(scenario, seed);
        eventsToProcess = [...eventsToProcess, ...generatedEvents];
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

  app.get(api.analysis.reachability.path, async (req, res) => {
    const { source, target, k } = req.query;
    if (!source || !target) return res.status(400).json({ message: "Missing source or target" });
    
    const result = await storage.findReachability(
      String(source), 
      String(target), 
      Number(k) || 5
    );
    res.json(result);
  });

  app.get(api.analysis.threats.path, async (req, res) => {
    const threats = await storage.analyzeThreats();
    res.json(threats);
  });

  app.get(api.analysis.blastRadius.path, async (req, res) => {
    const { source, k } = req.query;
    if (!source) return res.status(400).json({ message: "Missing source" });
    const result = await storage.calculateBlastRadius(String(source), Number(k) || 3);
    res.json(result);
  });

  const existingSnapshot = await storage.getGraphSnapshot();
  if (existingSnapshot.stats.event_count === 0) {
    console.log("Seeding initial data (CICD Compromise Scenario)...");
    const events = generateScenario("cicd_compromise");
    for (const event of events) {
      await storage.injectEvent(event);
    }
    console.log(`Seeded ${events.length} events.`);
  }

  return httpServer;
}
