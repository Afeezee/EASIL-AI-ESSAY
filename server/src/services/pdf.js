import fs from 'node:fs';
import path from 'node:path';
// pdf-parse's index.js runs a debug harness when required directly; import the lib entry.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

function normalizeText(value) {
    return (value || '').toString().trim();
}

export async function extractDocumentText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    switch (ext) {
        case '.pdf': {
            const data = await pdfParse(buffer);
            return normalizeText(data.text);
        }
        case '.txt':
        case '.md':
        case '.rtf': {
            return normalizeText(buffer.toString('utf8'));
        }
        case '.json': {
            const parsed = JSON.parse(buffer.toString('utf8'));
            return normalizeText(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
        }
        case '.doc':
        case '.docx': {
            try {
                const { default: mammoth } = await import('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                return normalizeText(result.value);
            } catch (err) {
                console.warn('[extract] mammoth unavailable, falling back to text buffer:', err.message);
                return normalizeText(buffer.toString('utf8'));
            }
        }
        default: {
            return normalizeText(buffer.toString('utf8'));
        }
    }
}

// Backward-compatible helper for existing callers.
export async function extractPdfText(filePath) {
    return extractDocumentText(filePath);
}
