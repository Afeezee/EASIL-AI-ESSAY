import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Config-driven, so the SDK-compatible surface (Quiz / QuizAttempt) is data, not code.
// Only whitelisted columns can be written or filtered on -> no SQL injection via field names.
const ENTITIES = {
    Quiz: {
        table: 'quizzes',
        writable: [
            'title', 'description', 'difficulty', 'short_answer_duration', 'essay_duration',
            'source_material', 'marking_guide', 'global_grading_rubric', 'question_source',
            'questions', 'total_questions', 'question_counts', 'instructor_id',
        ],
        jsonColumns: ['questions', 'question_counts'],
        filterable: ['id', 'created_by', 'instructor_id', 'difficulty', 'question_source'],
        sortable: ['created_date', 'updated_date', 'title'],
    },
    QuizAttempt: {
        table: 'quiz_attempts',
        writable: [
            'quiz_id', 'student_name', 'student_email', 'student_id_number', 'answers',
            'total_score', 'max_possible_score', 'percentage', 'time_started', 'time_completed', 'status',
        ],
        jsonColumns: ['answers'],
        filterable: ['id', 'quiz_id', 'created_by', 'status', 'student_email'],
        sortable: ['created_date', 'updated_date', 'total_score', 'percentage'],
    },
};

function getEntity(req, res) {
    const cfg = ENTITIES[req.params.entity];
    if (!cfg) {
        res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });
        return null;
    }
    return cfg;
}

// Base44 sort string: "field" (asc) or "-field" (desc). Default: -created_date.
function buildOrderBy(cfg, sort) {
    let field = 'created_date';
    let dir = 'DESC';
    if (sort && typeof sort === 'string') {
        const desc = sort.startsWith('-');
        const name = desc ? sort.slice(1) : sort;
        if (cfg.sortable.includes(name)) {
            field = name;
            dir = desc ? 'DESC' : 'ASC';
        }
    }
    return `ORDER BY ${field} ${dir}`;
}

// Serialize incoming values for insert/update (stringify JSON columns).
function serialize(cfg, key, value) {
    if (cfg.jsonColumns.includes(key)) return JSON.stringify(value ?? null);
    return value;
}

// GET /api/entities/:entity            -> list (optional ?sort=)
// GET /api/entities/:entity?filter=... -> filter (JSON-encoded equality conditions)
router.get('/:entity', async (req, res, next) => {
    const cfg = getEntity(req, res);
    if (!cfg) return;
    try {
        const conditions = [];
        const values = [];
        if (req.query.filter) {
            let parsed;
            try { parsed = JSON.parse(req.query.filter); }
            catch { return res.status(400).json({ error: 'filter must be valid JSON' }); }
            for (const [key, val] of Object.entries(parsed || {})) {
                if (!cfg.filterable.includes(key)) continue; // ignore non-filterable keys
                values.push(val);
                conditions.push(`${key} = $${values.length}`);
            }
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderBy = buildOrderBy(cfg, req.query.sort);
        const { rows } = await query(`SELECT * FROM ${cfg.table} ${where} ${orderBy}`, values);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/entities/:entity/:id -> single record
router.get('/:entity/:id', async (req, res, next) => {
    const cfg = getEntity(req, res);
    if (!cfg) return;
    try {
        const { rows } = await query(`SELECT * FROM ${cfg.table} WHERE id = $1`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// POST /api/entities/:entity -> create
router.post('/:entity', async (req, res, next) => {
    const cfg = getEntity(req, res);
    if (!cfg) return;
    try {
        const body = req.body || {};
        const cols = [];
        const placeholders = [];
        const values = [];
        for (const key of cfg.writable) {
            if (body[key] === undefined) continue;
            values.push(serialize(cfg, key, body[key]));
            cols.push(key);
            placeholders.push(`$${values.length}`);
        }
        // created_by mirrors Base44: the authenticated user's email (null for anonymous students).
        values.push(req.user?.email || null);
        cols.push('created_by');
        placeholders.push(`$${values.length}`);

        const { rows } = await query(
            `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
            values
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// PATCH /api/entities/:entity/:id -> partial update (Base44 update semantics)
router.patch('/:entity/:id', async (req, res, next) => {
    const cfg = getEntity(req, res);
    if (!cfg) return;
    try {
        const body = req.body || {};
        const sets = [];
        const values = [];
        for (const key of cfg.writable) {
            if (body[key] === undefined) continue;
            values.push(serialize(cfg, key, body[key]));
            sets.push(`${key} = $${values.length}`);
        }
        if (sets.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
        sets.push(`updated_date = now()`);
        values.push(req.params.id);
        const { rows } = await query(
            `UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// DELETE /api/entities/:entity/:id
router.delete('/:entity/:id', async (req, res, next) => {
    const cfg = getEntity(req, res);
    if (!cfg) return;
    try {
        const { rowCount } = await query(`DELETE FROM ${cfg.table} WHERE id = $1`, [req.params.id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) { next(err); }
});

export default router;
