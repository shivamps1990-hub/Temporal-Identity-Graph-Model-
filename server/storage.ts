import { GraphEngine } from "./graph_engine";
import { NormalizedEvent, GraphSnapshot } from "@shared/schema";

export interface IStorage {
  injectEvent(event: NormalizedEvent): Promise<any>;
  getGraphSnapshot(atTimestamp?: string): Promise<GraphSnapshot>;
  resetGraph(): Promise<void>;
  getEvents(): Promise<NormalizedEvent[]>;
  findReachability(source: string, target: string, k: number): Promise<any>;
  analyzeThreats(): Promise<any>;
  calculateBlastRadius(source: string, k: number): Promise<any>;
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

  async findReachability(source: string, target: string, k: number): Promise<any> {
    const paths = this.engine.findPaths(source, target, k);
    return {
      found: paths.length > 0,
      paths
    };
  }

  async analyzeThreats(): Promise<any> {
    return this.engine.detectThreats();
  }

  async calculateBlastRadius(source: string, k: number): Promise<any> {
    return {
      reachable_nodes: this.engine.calculateBlastRadius(source, k)
    };
  }
}

export const storage = new MemStorage();
