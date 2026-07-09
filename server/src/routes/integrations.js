import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { query } from '../db.js';
import { invokeLLM } from '../services/llm.js';
import { extractTextFromBuffer } from '../services/pdf.js';
import { gradeShortAnswers, gradeEssay } from '../services/grading.js';

// In-memory storage: the file never touches disk, so this works identically on
// a local server and on stateless serverless hosts. Vercel caps a serverless
// request body at ~4.5MB, so keep the limit under that.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json'];

const router = Router();

// Multer errors (e.g. file too large) arrive as errors on this handler.
function handleUpload(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const tooBig = err.code === 'LIMIT_FILE_SIZE';
            return res.status(tooBig ? 413 : 400).json({
                error: tooBig ? 'File is too large. Maximum size is 4MB.' : (err.message || 'Upload failed'),
            });
        }
        next();
    });
}

// POST /api/integrations/upload  (multipart field: "file")
// Extracts the text NOW and stores it in Postgres. Returns a file_url that
// references the stored document by id (no filesystem involved).
router.post('/upload', handleUpload, async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded (expected field "file")' });

        const ext = path.extname(req.file.originalname).toLowerCase();
        if (!supportedExtensions.includes(ext)) {
            return res.status(415).json({ error: `Unsupported file type: ${ext || 'unknown'}` });
        }

        const content = await extractTextFromBuffer(req.file.buffer, ext);
        if (!content) {
            return res.status(422).json({ error: 'Could not read any text from this document. If it is a scanned PDF, it needs OCR.' });
        }

        const { rows } = await query(
            `INSERT INTO documents (file_name, file_type, content, created_by)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [req.file.originalname, ext.replace('.', ''), content, req.user?.email || null]
        );

        // Relative URL keeps it origin-agnostic (same-origin on Vercel, proxied locally).
        const file_url = `/api/integrations/file/${rows[0].id}`;
        res.status(201).json({ file_url, file_name: req.file.originalname, file_type: ext.replace('.', '') });
    } catch (err) {
        console.error('[upload] error:', err.message);
        next(err);
    }
});

// Resolve a stored document id from a file_url (accepts the id itself or a path
// ending in the id).
function documentIdFromUrl(fileUrl) {
    try {
        return path.basename(new URL(fileUrl, 'http://local').pathname);
    } catch {
        return path.basename(String(fileUrl));
    }
}

// POST /api/integrations/extract  { file_url } -> { status, output: { content } }
// Reads the already-extracted text back from Postgres.
router.post('/extract', async (req, res) => {
    try {
        const { file_url } = req.body || {};
        if (!file_url) return res.status(400).json({ status: 'error', error: 'file_url is required' });

        const id = documentIdFromUrl(file_url);
        const { rows } = await query('SELECT content FROM documents WHERE id = $1', [id]);
        if (!rows[0]) return res.status(404).json({ status: 'error', error: 'Document not found' });

        res.json({ status: 'success', output: { content: rows[0].content } });
    } catch (err) {
        console.error('[extract] error:', err.message);
        res.status(500).json({ status: 'error', error: 'Failed to extract content from file' });
    }
});

// GET /api/integrations/file/:id -> raw extracted text (handy for debugging).
router.get('/file/:id', async (req, res) => {
    try {
        const { rows } = await query('SELECT content, file_name FROM documents WHERE id = $1', [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Document not found' });
        res.type('text/plain').send(rows[0].content);
    } catch (err) {
        console.error('[file] error:', err.message);
        res.status(500).json({ error: 'Failed to load document' });
    }
});

// POST /api/integrations/invoke-llm  { prompt, response_json_schema } -> parsed result
router.post('/invoke-llm', async (req, res, next) => {
    try {
        const { prompt, response_json_schema } = req.body || {};
        const result = await invokeLLM({ prompt, response_json_schema });
        res.json(result);
    } catch (err) { next(err); }
});

// POST /api/integrations/grade-short-answers
// { items: [{ question_id, question, expected_key_points, student_answer }] }
// -> { results: [{ question_id, score (0..1), is_correct, feedback }] }
// Grading prompts + guardrails live server-side so clients cannot weaken them.
router.post('/grade-short-answers', async (req, res, next) => {
    try {
        const results = await gradeShortAnswers(req.body?.items);
        res.json({ results });
    } catch (err) { next(err); }
});

// POST /api/integrations/grade-essay
// { question, rubric, max_score, answer }
// -> { score (0..max_score), feedback, criteria_breakdown[] }
router.post('/grade-essay', async (req, res, next) => {
    try {
        const { question, rubric, max_score, answer } = req.body || {};
        const result = await gradeEssay({ question, rubric, max_score, student_answer: answer });
        res.json(result);
    } catch (err) { next(err); }
});

export default router;
