// Schema as an inlined string (not read from a .sql file) so it always bundles
// correctly into a Vercel serverless function. Idempotent: safe to run on every
// cold start. gen_random_uuid() is built into Postgres core (v13+).

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT,
    role          TEXT NOT NULL DEFAULT 'user',
    created_date  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                 TEXT NOT NULL,
    description           TEXT,
    difficulty            TEXT DEFAULT 'medium',
    short_answer_duration INTEGER,
    essay_duration        INTEGER,
    source_material       TEXT,
    marking_guide         TEXT,
    global_grading_rubric TEXT,
    question_source       TEXT,
    questions             JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_questions       INTEGER,
    question_counts       JSONB,
    instructor_id         TEXT,
    created_by            TEXT,
    created_date          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id             UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_name        TEXT NOT NULL,
    student_email       TEXT,
    student_id_number   TEXT,
    answers             JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_score         DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_possible_score  DOUBLE PRECISION NOT NULL DEFAULT 0,
    percentage          DOUBLE PRECISION NOT NULL DEFAULT 0,
    time_started        TIMESTAMPTZ,
    time_completed      TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'in_progress',
    created_by          TEXT,
    created_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded documents: text is extracted at upload time and stored here, so the
-- upload/extract flow needs NO local filesystem and works on stateless
-- serverless hosts (Vercel) where each request may hit a different instance.
CREATE TABLE IF NOT EXISTS documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name     TEXT,
    file_type     TEXT,
    content       TEXT,
    created_by    TEXT,
    created_date  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz_attempts(quiz_id);
`;
