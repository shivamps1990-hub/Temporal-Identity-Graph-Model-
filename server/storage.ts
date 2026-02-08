import { GraphEngine } from "./graph_engine";
import { NormalizedEvent, GraphSnapshot } from "@shared/schema";

export interface IStorage {
  // Graph Operations
  injectEvent(event: NormalizedEvent): Promise<any>;
  getGraphSnapshot(): Promise<GraphSnapshot>;
  resetGraph(): Promise<void>;
  
  // Analysis
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

  async getGraphSnapshot(): Promise<GraphSnapshot> {
    return this.engine.getSnapshot();
  }

  async resetGraph(): Promise<void> {
    this.engine.reset();
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
    // Re-use BFS logic effectively
    // Simple mock/wrapper for now as engine.findPaths is target-specific
    // But we can iterate.
    return { reachable_nodes: [] }; // Placeholder for the prototype step
  }
}

export const storage = new MemStorage();
