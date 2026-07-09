// Vercel serverless entry for the EASIL backend.
//
// vercel.json rewrites every /api/* request to this function ("/api"), and
// Vercel preserves the original request path, so the Express app sees e.g.
// /api/integrations/upload and routes it exactly as it does locally. This is
// the canonical Vercel + Express pattern (bracket-free filename so the
// functions config glob matches cleanly).
//
// Required Vercel environment variables (Project Settings -> Environment Variables):
//   DATABASE_URL          - Neon/Postgres connection string
//   JWT_SECRET            - long random string
//   GROQ_API_KEY          - Groq API key
//   GROQ_MODEL            - (optional) defaults to llama-3.3-70b-versatile
//   BLOB_READ_WRITE_TOKEN - (optional) auto-set when a Vercel Blob store is connected

import { createApp } from '../server/src/app.js';

const app = createApp();

export default function handler(req, res) {
    return app(req, res);
}
