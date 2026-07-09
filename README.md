# EASIL — Essay Assessment Integrating Large Language Model

EASIL lets instructors upload course material (PDF), auto-generate short-answer + essay
assessments, share them with students, auto-grade essays with an LLM, and track results.

This repository is the **self-hosted** version. The original app ran on
[Base44](https://base44.com) (a managed backend). Everything Base44 provided —
database, auth, file storage, PDF extraction, and LLM calls — has been replaced by an
open backend you own and control.

```
┌────────────────────────┐        HTTP/JSON        ┌────────────────────────────┐
│  Frontend (Vite/React) │  ───────────────────►   │  Backend (Node/Express)    │
│  Tailwind + shadcn/ui  │                         │                            │
│  src/api/base44Client  │  ◄───────────────────   │  Postgres  ·  JWT auth      │
│  (drop-in SDK shim)    │                         │  Groq (Llama)  ·  pdf-parse │
└────────────────────────┘                         └────────────────────────────┘
```

## What replaced Base44

| Base44 feature | Self-hosted replacement |
|---|---|
| `entities.Quiz` / `QuizAttempt` (DB + RLS) | Postgres tables + generic REST entity API (`server/src/routes/entities.js`) |
| `auth` / `User.me()` | JWT auth — register / login / me (`server/src/routes/auth.js`) |
| `integrations.UploadFile` | Multipart upload to local disk, served at `/uploads` |
| `integrations.ExtractDataFromUploadedFile` | `pdf-parse` text extraction |
| `integrations.InvokeLLM` | **Groq** (Llama 3.3) via OpenAI-compatible API |

The frontend was **not rewritten**. Only `src/api/base44Client.js` changed: it now exposes
the same `base44.entities / .auth / .integrations` shape, so `api/entities.js`,
`api/integrations.js`, and every page work unchanged.

## Recommended services

- **Database — [Neon](https://neon.tech)** (free serverless Postgres, zero install). Any
  Postgres works: local, Supabase, Railway, RDS, etc.
- **LLM — [Groq](https://console.groq.com)** (free tier, very fast Llama inference). Model
  is configurable via `GROQ_MODEL`.
- **Hosting** — frontend on **Vercel/Netlify** (static build), backend on
  **Render/Railway/Fly.io**. Point `VITE_API_URL` at the deployed backend and set the
  backend's `CORS_ORIGIN` to the deployed frontend URL.

---

## Vercel deployment (single project: frontend + backend)

Both the frontend **and** the backend deploy from this one repo on Vercel. The Express
backend runs as a serverless function (`api/index.js`), so uploads, grading, auth, and the
database all work on Vercel with no separate backend host.

How it fits together:
- The static frontend is built to `dist/` and served by Vercel.
- `vercel.json` rewrites every `/api/*` request to the serverless function in `api/index.js`,
  which mounts the full Express app from `server/src/app.js`.
- Backend runtime dependencies are listed in the **root** `package.json` (Vercel only runs
  `npm install` at the root), so the function can resolve them.
- Uploaded documents are **not** written to disk — text is extracted on upload and stored in
  Postgres (`documents` table), so it survives stateless serverless invocations.

Steps:
1. Push the repository to GitHub.
2. In Vercel, **New Project → Import** the repo. Keep the defaults (root directory `.`,
   build `npm run build`, output `dist`) — `vercel.json` already configures everything.
3. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Neon/Postgres connection string
   - `JWT_SECRET` — a long random string
   - `GROQ_API_KEY` — your Groq key
   - `GROQ_MODEL` *(optional)* — defaults to `llama-3.3-70b-versatile`
   - Leave `VITE_API_URL` **unset** — the frontend calls same-origin `/api` automatically.
4. Deploy. The schema is created automatically on the first API request.
5. Verify: open `https://<your-app>.vercel.app/api/health` → `{"ok":true}`, then sign up and
   create an assessment.

### Uploads & the 4.5MB serverless limit (Vercel Blob)

Vercel caps a serverless request body at ~4.5MB. The app handles this automatically:

- **With Vercel Blob configured**, the browser uploads the file **directly to Blob storage**
  (no size limit from the function). The backend only mints a short-lived upload token and,
  on `extract`, fetches the file from Blob and pulls out the text.
- **Without Blob**, it falls back to a direct multipart upload through the function, capped at
  4MB.

To enable large uploads on Vercel:
1. In your Vercel project: **Storage → Create Database → Blob**, and connect it to the project.
   Vercel automatically injects the `BLOB_READ_WRITE_TOKEN` environment variable.
2. Redeploy. That's it — the frontend detects Blob is available and uses it; no code change.

Locally (no Blob token) the app just uses the 4MB multipart path, which is fine for dev.

### Alternative: split hosting
Prefer the frontend on Vercel and the backend elsewhere? Deploy `server/` to
Render/Railway/Fly.io, set the frontend's `VITE_API_URL` to that backend URL, and set the
backend's `CORS_ORIGIN` to the Vercel frontend URL.

## Local setup

### Prerequisites
- Node.js 18+ (tested on Node 24)
- A Postgres database URL (get a free one at [neon.tech](https://neon.tech))
- A Groq API key (free at [console.groq.com/keys](https://console.groq.com/keys))

### 1. Backend

```bash
cd server
cp .env.example .env       # then edit .env (see below)
npm install
npm start                  # creates tables on first boot, listens on :4000
```

Fill in `server/.env`:

```ini
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_SSL=true          # true for Neon/Supabase/RDS; empty for local Postgres
JWT_SECRET=<long random string>
GROQ_API_KEY=<your groq key>
CORS_ORIGIN=http://localhost:5173
PUBLIC_URL=http://localhost:4000
```

Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 2. Frontend

```bash
# from the repo root
cp .env.example .env.local  # sets VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

### 3. Use it
1. Open the app, click **Sign In**, and **Create an account** (instructor).
2. Go to **Create Assessment**, upload a PDF, configure, and **Generate**.
3. **Save**, copy the student link, open it, and take the assessment.
4. Check **Analytics** for results.

---

## API reference (backend)

Base URL: `http://localhost:4000`

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET  /api/entities/:entity` — list (`?sort=-created_date`) or filter (`?filter={"created_by":"x"}`)
- `GET  /api/entities/:entity/:id` · `POST` · `PATCH /:id` · `DELETE /:id`
  (`:entity` is `Quiz` or `QuizAttempt`)
- `POST /api/integrations/upload` (multipart `file`) → `{ file_url }`
- `POST /api/integrations/extract` `{ file_url }` → `{ status, output: { content } }`
- `POST /api/integrations/invoke-llm` `{ prompt, response_json_schema }` → parsed JSON

---

## Security notes (parity vs. hardening)

To keep the frontend byte-for-byte identical, some student-facing reads are **public** —
the pages call `Quiz.list()` / `QuizAttempt.list()` and filter client-side by id, exactly
as they did on Base44. That means quiz and attempt records are readable without auth. This
is fine for shared-link quizzes but is looser than production RLS. Recommended hardening
(does not change the UI meaningfully):

- Serve students a single quiz via `GET /api/entities/Quiz/:id` instead of `list()`.
- Scope `QuizAttempt` reads to the owning instructor (`created_by`) or a per-attempt token.
- Add rate limiting on `/api/integrations/*` (LLM/upload cost control).

These are called out so the app can run as-is out of the box, with a clear path to lock down.

---

Original app by [Cereus Technologies](https://cereustechnologies.com).
Live reference: https://easil.cereustechnologies.com
