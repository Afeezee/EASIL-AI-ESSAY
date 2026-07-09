import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { handleUpload } from '@vercel/blob/client';
import { query } from '../db.js';
import { invokeLLM } from '../services/llm.js';
import { extractTextFromBuffer } from '../services/pdf.js';
import { gradeShortAnswers, gradeEssay } from '../services/grading.js';

// In-memory storage: the file never touches disk, so this works identically on
// a local server, a long-lived host (Railway), and stateless serverless hosts.
// MAX_UPLOAD_MB is configurable: keep it <=4 on Vercel (its serverless body cap
// is ~4.5MB); a long-lived host like Railway can go much higher.
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 25;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });
const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json'];
const blobContentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/json',
];

const router = Router();

// POST /api/integrations/blob-token
// Mints a client-upload token for Vercel Blob. This lets the browser upload the
// file DIRECTLY to Blob storage, bypassing the ~4.5MB serverless request-body
// limit. Only active when a Blob store is connected (BLOB_READ_WRITE_TOKEN set).
router.post('/blob-token', async (req, res) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        // Signal "not configured" so the client falls back to multipart upload.
        return res.status(501).json({ error: 'Blob storage is not configured on this deployment' });
    }
    try {
        const jsonResponse = await handleUpload({
            request: req,
            body: req.body,
            onBeforeGenerateToken: async (pathname) => {
                const ext = path.extname(pathname).toLowerCase();
                if (!supportedExtensions.includes(ext)) {
                    throw new Error(`Unsupported file type: ${ext || 'unknown'}`);
                }
                return {
                    allowedContentTypes: blobContentTypes,
                    addRandomSuffix: true,
                    maximumSizeInBytes: 25 * 1024 * 1024,
                };
            },
            // Fires server-to-server after the browser finishes uploading.
            // No-op here: we extract lazily in /extract so this works on
            // localhost too (where this callback can't be reached).
            onUploadCompleted: async () => {},
        });
        res.json(jsonResponse);
    } catch (err) {
        console.error('[blob-token] error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Multer errors (e.g. file too large) arrive as errors on this handler.
function handleMultipartUpload(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const tooBig = err.code === 'LIMIT_FILE_SIZE';
            return res.status(tooBig ? 413 : 400).json({
                error: tooBig ? `File is too large. Maximum size is ${MAX_UPLOAD_MB}MB.` : (err.message || 'Upload failed'),
            });
        }
        next();
    });
}

// POST /api/integrations/upload  (multipart field: "file")
// Extracts the text NOW and stores it in Postgres. Returns a file_url that
// references the stored document by id (no filesystem involved).
router.post('/upload', handleMultipartUpload, async (req, res, next) => {
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

// Only fetch text from Vercel Blob's own hosts (SSRF guard).
function isAllowedBlobUrl(u) {
    try {
        const { protocol, host } = new URL(u);
        return protocol === 'https:' && /\.blob\.vercel-storage\.com$/i.test(host);
    } catch {
        return false;
    }
}

// POST /api/integrations/extract  { file_url } -> { status, output: { content } }
// Two upload paths converge here:
//   - Blob client upload: file_url is an https Blob URL -> fetch + extract now.
//   - Multipart upload:   file_url is /api/integrations/file/<id> -> read the
//     text already extracted and stored in Postgres.
router.post('/extract', async (req, res) => {
    try {
        const { file_url } = req.body || {};
        if (!file_url) return res.status(400).json({ status: 'error', error: 'file_url is required' });

        if (/^https?:\/\//i.test(file_url)) {
            if (!isAllowedBlobUrl(file_url)) {
                return res.status(400).json({ status: 'error', error: 'Only Vercel Blob URLs are accepted' });
            }
            const resp = await fetch(file_url);
            if (!resp.ok) return res.status(404).json({ status: 'error', error: 'Could not fetch uploaded file' });

            const ext = path.extname(new URL(file_url).pathname).toLowerCase();
            const buffer = Buffer.from(await resp.arrayBuffer());
            const content = await extractTextFromBuffer(buffer, ext);
            if (!content) {
                return res.status(422).json({ status: 'error', error: 'Could not read any text from this document.' });
            }

            // Persist so grading/analytics have a record, mirroring the multipart path.
            await query(
                `INSERT INTO documents (file_name, file_type, content, created_by) VALUES ($1, $2, $3, $4)`,
                [path.basename(new URL(file_url).pathname), ext.replace('.', ''), content, req.user?.email || null]
            );
            return res.json({ status: 'success', output: { content } });
        }

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
