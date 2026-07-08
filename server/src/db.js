import pkg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.');
    process.exit(1);
}

const useSsl = String(process.env.DATABASE_SSL).toLowerCase() === 'true';

// Strip SSL-negotiation params from the URL and drive SSL via the `ssl` option instead.
// `channel_binding=require` and `sslmode` (parsed as verify-full by newer pg) both cause
// TLS resets (ECONNRESET) with node-postgres against Neon/Supabase poolers.
function sanitizeConnectionString(raw) {
    try {
        const url = new URL(raw);
        ['channel_binding', 'sslmode'].forEach((p) => url.searchParams.delete(p));
        return url.toString();
    } catch {
        return raw; // not a parseable URL (e.g. key=value DSN) — leave as-is
    }
}

const connectionString = sanitizeConnectionString(process.env.DATABASE_URL);
const isNeon = /\.neon\.tech/i.test(connectionString);

let poolInstance;
if (isNeon) {
    // Neon: use the official serverless driver, which tunnels Postgres over
    // WebSockets on port 443. This works on networks that block/reset raw
    // Postgres traffic on port 5432 (a common cause of ECONNRESET on startup).
    neonConfig.webSocketConstructor = ws;
    poolInstance = new NeonPool({ connectionString });
    console.log('[db] using Neon serverless driver (WebSocket over 443)');
} else {
    poolInstance = new Pool({
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
}

export const pool = poolInstance;

export const query = (text, params) => pool.query(text, params);

// Runs schema.sql. Idempotent (all statements use IF NOT EXISTS).
export async function runMigrations() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('[db] schema ready');
}
