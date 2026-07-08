import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { invokeLLM } from '../services/llm.js';
import { extractDocumentText } from '../services/pdf.js';
import { gradeShortAnswers, gradeEssay } from '../services/grading.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json'];

const router = Router();

// POST /api/integrations/upload  (multipart field: "file")  -> { file_url }
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (expected field "file")' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!supportedExtensions.includes(ext)) {
        return res.status(415).json({ error: `Unsupported file type: ${ext || 'unknown'}` });
    }

    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    const file_url = `${publicUrl}/uploads/${req.file.filename}`;
    res.status(201).json({ file_url, file_name: req.file.originalname, file_type: ext.replace('.', '') });
});

// POST /api/integrations/extract  { file_url, json_schema } -> { status, output: { content } }
router.post('/extract', async (req, res, next) => {
    try {
        const { file_url } = req.body || {};
        if (!file_url) return res.status(400).json({ status: 'error', error: 'file_url is required' });

        // Resolve local file from the URL we handed out. Guard against path traversal.
        const filename = path.basename(new URL(file_url, 'http://local').pathname);
        const filePath = path.join(UPLOAD_DIR, filename);
        if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
            return res.status(404).json({ status: 'error', error: 'File not found' });
        }

        const content = await extractDocumentText(filePath);
        res.json({ status: 'success', output: { content } });
    } catch (err) {
        console.error('[extract] error:', err.message);
        res.json({ status: 'error', error: 'Failed to extract content from file' });
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
