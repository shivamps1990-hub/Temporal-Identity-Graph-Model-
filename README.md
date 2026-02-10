# Temporal-Identity-Graph-Model-
Temporal Identity Graph Model for Analyzing Non-Human Identity Paths in IT-OT Convergent Environments A graph-based approach to modeling how identity relationships evolve over time, enabling path-based risk analysis across cloud, CI/CD, Kubernetes, and operational technology systems.

---

## Getting Started — Local Development

This section explains how to clone, configure, and run this project locally on your machine. The goal is to provide a development environment that closely mirrors the research prototype while enabling experimentation, extension, and further modeling.

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v20 or later) — [Download here](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- **PostgreSQL** (optional — the app works fully in-memory without a database)

### 1. Clone the Repository

```bash
git clone https://github.com/shivamps1990-hub/Temporal-Identity-Graph-Model-.git
cd Temporal-Identity-Graph-Model-
```

### 2. Install Dependencies

Install all Node.js packages (both frontend and backend):

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

The app runs fully in-memory by default — no database is required. If you want to use PostgreSQL for persistent storage, create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/temporal_identity_graph
SESSION_SECRET=your-secret-key-here
```

If using PostgreSQL, push the database schema:

```bash
npm run db:push
```

### 4. Run the Application (Development Mode)

Start both the backend API server and frontend dev server with a single command:

```bash
npm run dev
```

This launches:
- **Express API server** — serves the REST endpoints
- **Vite dev server** — serves the React frontend with hot module replacement

The app will be available at:

```
http://localhost:5000
```

On startup, the app automatically seeds a demo scenario (CI/CD Compromise) with 25 synthetic identity events so you can immediately explore the graph, run path analysis, and view threat detection.

### 5. Build for Production

To create an optimized production build:

```bash
npm run build
```

This compiles:
- The React frontend into `dist/public/`
- The Express server into `dist/index.cjs`

Then start the production server:

```bash
npm start
```

### 6. Type Checking

To verify TypeScript types across the entire project:

```bash
npm run check
```

### 7. Project Structure

```
client/              # React frontend (Vite + TypeScript)
  src/
    pages/           # Route pages (Home, Dashboard, Analysis, Threats, About)
    components/      # UI components (GraphCanvas, sidebar, etc.)
    hooks/           # Custom React hooks (graph, analysis)
    lib/             # Utilities (API client, query client)

server/              # Express backend (TypeScript)
  graph_engine.ts    # In-memory temporal property graph engine
  routes.ts          # REST API route handlers
  storage.ts         # Storage interface (in-memory + optional PostgreSQL)
  lib/
    dataset_gen.ts   # Synthetic dataset generator

shared/              # Shared between frontend and backend
  schema.ts          # Zod schemas, type definitions, domain models
  routes.ts          # Typed API route contracts
```

### 8. Key API Endpoints

Once the app is running, these endpoints are available:

| Endpoint | Method | Description |
|---|---|---|
| `/api/graph/snapshot` | GET | Current graph state (nodes, edges, stats) |
| `/api/graph/reset` | POST | Clear the graph entirely |
| `/api/events/inject` | POST | Inject a single identity event |
| `/api/events/replay` | POST | Replay events or load a named scenario |
| `/api/scenarios` | GET | List available demo scenarios |
| `/api/analysis/reachability` | GET | Find paths between two identity nodes |
| `/api/analysis/blast-radius` | GET | Calculate blast radius from a source node |
| `/api/analysis/threats` | GET | Run automated threat detection |
| `/api/analysis/threat-map` | GET | Get full threat map with severity breakdown |

### 9. Stopping the Application

Press `Ctrl + C` in the terminal where `npm run dev` is running.

To clean up installed packages:

```bash
rm -rf node_modules
```

---

This setup ensures you can iterate rapidly, run experiments, modify models, and collaborate with others using their local machines without dependencies on Replit or cloud services.
