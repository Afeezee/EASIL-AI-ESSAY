import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'insecure-dev-secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: EXPIRES_IN }
    );
}

// Populates req.user if a valid Bearer token is present. Never rejects —
// downstream routes decide whether auth is required (students are anonymous).
export function attachUser(req, _res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
        try {
            const payload = jwt.verify(token, SECRET);
            req.user = { id: payload.sub, email: payload.email, role: payload.role };
        } catch {
            // ignore invalid/expired tokens -> treated as anonymous
        }
    }
    next();
}

// Guard for endpoints that require a logged-in instructor.
export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    next();
}
