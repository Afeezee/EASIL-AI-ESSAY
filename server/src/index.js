import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrations, pool } from './db.js';
import { attachUser } from './auth.js';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import integrationRoutes from './routes/integrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// CORS: allow the configured frontend origin(s).
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(attachUser);

// Serve uploaded files so file_url is publicly fetchable.
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/integrations', integrationRoutes);

// 404 for unknown API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler.
app.use((err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

runMigrations()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`[easil-server] listening on http://localhost:${PORT}`);
            console.log(`[easil-server] allowed origins: ${origins.join(', ') || '(all)'}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start (migrations):', err);
        pool.end();
        process.exit(1);
    });
