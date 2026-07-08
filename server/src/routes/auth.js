import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

function publicUser(row) {
    return { id: row.id, email: row.email, full_name: row.full_name, role: row.role, created_date: row.created_date };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, full_name } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
        if (String(password).length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

        const existing = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
        if (existing.rowCount > 0) return res.status(409).json({ error: 'An account with that email already exists' });

        const hash = await bcrypt.hash(password, 10);
        const { rows } = await query(
            `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
             RETURNING id, email, full_name, role, created_date`,
            [email, hash, full_name || null]
        );
        const user = rows[0];
        res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

        const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
        const user = rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

        res.json({ token: signToken(user), user: publicUser(user) });
    } catch (err) { next(err); }
});

// GET /api/auth/me  -> current user (Base44 User.me() parity)
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await query(
            'SELECT id, email, full_name, role, created_date FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!rows[0]) return res.status(401).json({ error: 'Authentication required' });
        res.json(publicUser(rows[0]));
    } catch (err) { next(err); }
});

export default router;
