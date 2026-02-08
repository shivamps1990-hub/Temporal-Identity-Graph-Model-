import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Default to a local connection if not set, to allow app to start even without a provisioned DB
// (Since the prototype is mainly in-memory, but we keep this for consistency)
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
