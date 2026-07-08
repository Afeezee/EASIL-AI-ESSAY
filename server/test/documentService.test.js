import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractDocumentText } from '../src/services/pdf.js';

test('extracts text from plain text files', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'easil-docs-'));
  const filePath = path.join(tmpDir, 'notes.txt');
  fs.writeFileSync(filePath, 'Intro line\nSecond line', 'utf8');

  const content = await extractDocumentText(filePath);

  assert.equal(content, 'Intro line\nSecond line');
});

test('extracts structured text from JSON files', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'easil-docs-'));
  const filePath = path.join(tmpDir, 'content.json');
  fs.writeFileSync(filePath, JSON.stringify({ title: 'Week 1', sections: ['A', 'B'] }), 'utf8');

  const content = await extractDocumentText(filePath);

  assert.match(content, /Week 1/);
  assert.match(content, /"sections"/);
});
