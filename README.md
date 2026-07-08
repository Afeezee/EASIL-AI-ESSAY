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

## Vercel deployment (GitHub)

This app is already structured for a Vercel frontend deployment from a GitHub repository:

1. Push the repository to GitHub.
2. In Vercel, create a new project and import the repository.
3. Use the repository root as the Root Directory, keep the build command as `npm run build`, and keep the output directory as `dist`.
4. In Project Settings → Environment Variables, add `VITE_API_URL` and set it to your deployed backend URL (for example, a Render/Railway/Fly.io URL).
5. Deploy the project and confirm the frontend loads correctly.

If you are using the self-hosted backend from this repo, deploy that separately and point the frontend to it with `VITE_API_URL`.

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
