import pkg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { SCHEMA_SQL } from './schema.js';

const { Pool } = pkg;

// Note: we do NOT process.exit() here if DATABASE_URL is missing. On serverless
// that would hard-kill the function; instead every query rejects with a clear
// message and app.js turns it into a 503. The local entrypoint (index.js)
// surfaces the same rejection at startup.
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

const connectionString = process.env.DATABASE_URL
    ? sanitizeConnectionString(process.env.DATABASE_URL)
    : null;
const isNeon = !!connectionString && /\.neon\.tech/i.test(connectionString);

let poolInstance;
if (!connectionString) {
    // No DB configured: every query rejects with a clear, actionable message.
    const reject = () => Promise.reject(new Error('DATABASE_URL is not set. Configure it in the environment.'));
    poolInstance = { query: reject, end: async () => {} };
} else if (isNeon) {
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

// Ensure the schema exists. Idempotent (every statement uses IF NOT EXISTS).
// The promise is cached so concurrent requests on a warm serverless instance
// share one migration run instead of racing.
let schemaPromise = null;
export function ensureSchema() {
    if (!schemaPromise) {
        schemaPromise = pool
            .query(SCHEMA_SQL)
            .then(() => console.log('[db] schema ready'))
            .catch((err) => {
                schemaPromise = null; // allow a retry on the next request
                throw err;
            });
    }
    return schemaPromise;
}

// Backwards-compatible alias for the local server entrypoint.
export const runMigrations = ensureSchema;
