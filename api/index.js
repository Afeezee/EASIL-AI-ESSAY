// Vercel serverless entry for the EASIL backend.
//
// The whole Express app (server/src/app.js) is exported as a single function.
// vercel.json rewrites every /api/* request to this function, so Express sees
// the original path (e.g. /api/integrations/upload) and routes it normally.
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
