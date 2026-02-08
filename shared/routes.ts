import { z } from 'zod';
import { NormalizedEventSchema, GraphSnapshotSchema, ReachabilityResultSchema, ThreatResultSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Ingestion & Control
  events: {
    inject: {
      method: 'POST' as const,
      path: '/api/events/inject' as const,
      input: NormalizedEventSchema,
      responses: {
        200: z.object({
          success: z.boolean(),
          graph_version: z.string(),
          nodes_affected: z.number()
        }),
        400: errorSchemas.validation,
      },
    },
    replay: {
      method: 'POST' as const,
      path: '/api/events/replay' as const,
      input: z.object({
        events: z.array(NormalizedEventSchema).optional(),
        scenario: z.string().optional(), // 'baseline', 'cicd_compromise' etc for server-side loading
        reset: z.boolean().default(true) // Should we reset graph before replay?
      }),
      responses: {
        200: z.object({
          graph_hash: z.string(),
          stats: z.object({
            events_processed: z.number(),
            final_nodes: z.number(),
            final_edges: z.number(),
          })
        }),
        400: errorSchemas.validation,
      },
    }
  },

  // Graph Query
  graph: {
    snapshot: {
      method: 'GET' as const,
      path: '/api/graph/snapshot' as const,
      input: z.object({
        timestamp: z.string().optional(), // Optional ISO timestamp to view historical state
      }).optional(),
      responses: {
        200: GraphSnapshotSchema,
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/graph/reset' as const,
      responses: {
        204: z.void()
      }
    }
  },

  // Analysis
  analysis: {
    reachability: {
      method: 'GET' as const,
      path: '/api/analysis/reachability' as const,
      input: z.object({
        source: z.string(),
        target: z.string(),
        k: z.coerce.number().default(5), // max hops
      }),
      responses: {
        200: ReachabilityResultSchema,
      },
    },
    threats: {
      method: 'GET' as const,
      path: '/api/analysis/threats' as const,
      responses: {
        200: z.array(ThreatResultSchema),
      },
    },
    blastRadius: {
      method: 'GET' as const,
      path: '/api/analysis/blast-radius' as const,
      input: z.object({
        source: z.string(),
        k: z.coerce.number().default(3),
      }),
      responses: {
        200: z.object({
          reachable_nodes: z.array(z.object({
            id: z.string(),
            distance: z.number(),
            risk: z.number()
          }))
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
