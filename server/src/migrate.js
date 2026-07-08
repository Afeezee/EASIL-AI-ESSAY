import 'dotenv/config';
import { runMigrations, pool } from './db.js';

runMigrations()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
