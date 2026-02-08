# Temporal Identity Graph - Research Prototype

## Overview

This is a cybersecurity research prototype that demonstrates a **Temporal Identity Graph** model for analyzing Non-Human Identities (NHIs) across cloud, IT, CI/CD, Kubernetes, and OT environments. The core idea is that access in modern systems isn't just about static permissions — it emerges from chains of identity relationships that coexist over time. The prototype lets you model, visualize, and analyze these temporal identity paths.

The application provides:
- An in-memory temporal graph engine that processes identity events deterministically
- Synthetic dataset generation for demo scenarios (CI/CD compromise, OT bridge attacks, etc.)
- Interactive force-directed graph visualization with temporal replay controls
- Path reachability analysis, blast radius calculation, and automated threat detection
- Event-sourced, append-only architecture enabling replay of identity state at any point in time

**This is a research/education tool, not production software.** There is no authentication, no ML, and no auto-remediation.

Author: Shivam Pratap Singh — IAM practitioner with 10+ years of experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)

- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with 4 pages: Dashboard (live graph), Analysis (path reachability & blast radius), Threats (automated detection), and About
- **State Management**: TanStack React Query for server state; local React state for UI
- **Graph Visualization**: `react-force-graph-2d` for interactive force-directed graph rendering with color-coded node types (HUMAN, WORKLOAD, SERVICE_ACCOUNT, PLC, HMI)
- **UI Components**: shadcn/ui (new-york style) with Radix primitives, Tailwind CSS, dark cybersecurity theme with monospace fonts (JetBrains Mono, Inter)
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode is the default and only theme. Sharp corners (0px radius) for a technical feel.
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (Express + TypeScript)

- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **Graph Engine**: Custom in-memory property graph (`server/graph_engine.ts`) implementing a deterministic update function `U(G, event)`. Nodes and edges are stored in Maps with temporal metadata (first_seen, last_seen) and provenance tracking.
- **Storage Layer**: `MemStorage` class wrapping the graph engine. Implements `IStorage` interface for potential future swap to persistent storage.
- **Dataset Generator**: `server/lib/dataset_gen.ts` generates synthetic identity events using a seedable pseudo-random number generator for deterministic, replayable scenarios.
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schemas for both input validation and response typing. The API contract is shared between client and server.

### Shared Layer (`shared/`)

- **Schema** (`shared/schema.ts`): Defines all domain models using Zod — node types (HUMAN, WORKLOAD, SERVICE_ACCOUNT, PLC, HMI), edge labels (AUTHENTICATES_WITH, ASSUMES, ACCESSES, COMMUNICATES_WITH, CONTROLS), normalized event schema, and graph snapshot schema. Also contains Drizzle/PostgreSQL table definitions though the primary data store is in-memory.
- **Routes** (`shared/routes.ts`): Typed API route definitions with Zod validation schemas, shared between frontend and backend for type safety.

### Key API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/events/inject` | POST | Inject a single normalized identity event |
| `/api/events/replay` | POST | Replay a batch of events or load a named scenario |
| `/api/graph/snapshot` | GET | Get current graph state (nodes, edges, metadata) |
| `/api/graph/reset` | POST | Clear the graph entirely |
| `/api/analysis/reachability` | GET | Find paths between two identity nodes |
| `/api/analysis/threats` | GET | Run automated threat detection |
| `/api/analysis/blast-radius` | GET | Calculate blast radius from a source node |

### Database

- **Primary storage is in-memory** — the graph engine uses JavaScript Maps, not a database
- Drizzle ORM with PostgreSQL is configured (`drizzle.config.ts`, `server/db.ts`) but is secondary. The schema in `shared/schema.ts` includes `pgTable` definitions alongside the Zod domain models. The database connection falls back gracefully to a local default if `DATABASE_URL` is not set.
- Use `npm run db:push` to push schema to PostgreSQL when needed

### Build & Development

- **Dev**: `npm run dev` — runs tsx with Vite dev server middleware for HMR
- **Build**: `npm run build` — Vite builds the client, esbuild bundles the server to `dist/index.cjs`
- **Production**: `npm start` — serves the built assets from `dist/public`
- Vite is configured with Replit-specific plugins (error overlay, cartographer, dev banner) that activate only in development on Replit

## External Dependencies

### Core Libraries
- **Express** — HTTP server
- **Drizzle ORM** + **drizzle-zod** — PostgreSQL ORM (secondary to in-memory engine)
- **Zod** — Schema validation throughout the stack
- **TanStack React Query** — Server state management
- **react-force-graph-2d** — Graph visualization
- **d3-force** — Physics engine for graph layout
- **uuid** — Event ID generation
- **date-fns** — Date formatting

### UI Libraries
- **shadcn/ui** component library (Radix primitives + Tailwind)
- **lucide-react** — Icons
- **class-variance-authority** + **clsx** + **tailwind-merge** — Styling utilities
- **wouter** — Client-side routing
- **cmdk** — Command palette component
- **vaul** — Drawer component
- **recharts** — Charts (available but not primary)

### Database
- **PostgreSQL** via `pg` driver and `connect-pg-simple` for session storage
- Database is optional for the core prototype functionality — everything works in-memory

### Infrastructure
- Designed to run on Replit with `DATABASE_URL` environment variable for PostgreSQL
- No external API integrations (no auth providers, no SIEM, no cloud APIs)
- No Docker configuration in the current setup (runs directly via npm scripts)