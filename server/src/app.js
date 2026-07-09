import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { ensureSchema } from './db.js';
import { attachUser } from './auth.js';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import integrationRoutes from './routes/integrations.js';

export function createApp() {
    const app = express();

    // CORS: allow the configured frontend origin(s). When frontend and backend
    // share an origin (single Vercel project), this is effectively a no-op.
    const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.use(cors({ origin: origins.length ? origins : true, credentials: true }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(attachUser);

    app.get('/api/health', (_req, res) => res.json({ ok: true }));

    // Ensure the DB schema exists before handling any data request. Cached, so
    // this only actually runs once per warm instance (see ensureSchema).
    app.use('/api', async (_req, res, next) => {
        try {
            await ensureSchema();
            next();
        } catch (err) {
            console.error('[schema] init failed:', err.message);
            res.status(503).json({ error: 'Database is not reachable. Check DATABASE_URL.' });
        }
    });

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

    return app;
}

export default createApp;
