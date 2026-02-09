import { GraphEngine } from "./graph_engine";
import { NormalizedEvent, GraphSnapshot } from "@shared/schema";
import { deriveThreats, ThreatMapResult } from "./lib/threat_engine";

export interface IStorage {
  injectEvent(event: NormalizedEvent): Promise<any>;
  getGraphSnapshot(atTimestamp?: string): Promise<GraphSnapshot>;
  resetGraph(): Promise<void>;
  getEvents(): Promise<NormalizedEvent[]>;
  findReachability(source: string, target: string, k: number, timestamp?: string): Promise<any>;
  analyzeThreats(): Promise<any>;
  calculateBlastRadius(source: string, k: number, timestamp?: string): Promise<any>;
  deriveThreatMap(timestamp?: string): Promise<ThreatMapResult>;
  setScenarioInfo(scenario: string, seed: number): void;
  getScenarioInfo(): { scenario: string; seed: number };
}

export class MemStorage implements IStorage {
  private engine: GraphEngine;

  constructor() {
    this.engine = new GraphEngine();
  }

  async injectEvent(event: NormalizedEvent): Promise<any> {
    const result = this.engine.processEvent(event);
    return {
      ...result,
      version: this.engine.getSnapshot().version
    };
  }

  async getGraphSnapshot(atTimestamp?: string): Promise<GraphSnapshot> {
    return this.engine.getSnapshot(atTimestamp);
  }

  async resetGraph(): Promise<void> {
    this.engine.reset();
  }

  async getEvents(): Promise<NormalizedEvent[]> {
    return this.engine.getEvents();
  }

  async findReachability(source: string, target: string, k: number, timestamp?: string): Promise<any> {
    const paths = this.engine.findPaths(source, target, k, timestamp);
    return {
      found: paths.length > 0,
      paths,
      timestamp: timestamp || null
    };
  }

  async analyzeThreats(): Promise<any> {
    return this.engine.detectThreats();
  }

  async calculateBlastRadius(source: string, k: number, timestamp?: string): Promise<any> {
    return {
      reachable_nodes: this.engine.calculateBlastRadius(source, k, timestamp),
      source,
      timestamp: timestamp || null
    };
  }

  async deriveThreatMap(timestamp?: string): Promise<ThreatMapResult> {
    const snapshot = this.engine.getSnapshot(timestamp);
    return deriveThreats(snapshot.nodes, snapshot.edges, timestamp || null);
  }

  setScenarioInfo(scenario: string, seed: number): void {
    this.engine.setScenarioInfo(scenario, seed);
  }

  getScenarioInfo(): { scenario: string; seed: number } {
    return this.engine.getScenarioInfo();
  }
}

export const storage = new MemStorage();
