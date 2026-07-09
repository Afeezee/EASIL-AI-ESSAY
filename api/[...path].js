// Vercel serverless catch-all for the EASIL backend.
//
// This file name ([...path].js) is Vercel's optional catch-all convention: it
// receives EVERY request under /api/* (e.g. /api/integrations/upload,
// /api/entities/Quiz, /api/health) via filesystem routing — no rewrite needed,
// and req.url preserves the full original path so the Express app routes it
// exactly as it does locally.
//
// Required Vercel environment variables (Project Settings -> Environment Variables):
//   DATABASE_URL   - Neon/Postgres connection string
//   JWT_SECRET     - long random string
//   GROQ_API_KEY   - Groq API key
//   GROQ_MODEL     - (optional) defaults to llama-3.3-70b-versatile
//   CORS_ORIGIN    - (optional) not needed when frontend + backend share the domain

import { createApp } from '../server/src/app.js';

const app = createApp();

export default function handler(req, res) {
    return app(req, res);
}
