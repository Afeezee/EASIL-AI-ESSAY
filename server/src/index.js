import 'dotenv/config';
import { createApp } from './app.js';
import { ensureSchema, pool } from './db.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

// Local/long-running server: create the schema up front, then listen.
ensureSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`[easil-server] listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start (schema init):', err);
        pool.end();
        process.exit(1);
    });
