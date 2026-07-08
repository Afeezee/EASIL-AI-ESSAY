-- EASIL schema. Idempotent: safe to run on every boot.
-- gen_random_uuid() is built into Postgres core (v13+); no extension required.

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT,
    role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
    created_date  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                 TEXT NOT NULL,
    description           TEXT,
    difficulty            TEXT DEFAULT 'medium',   -- easy | medium | hard
    short_answer_duration INTEGER,
    essay_duration        INTEGER,
    source_material       TEXT,
    marking_guide         TEXT,
    global_grading_rubric TEXT,
    question_source       TEXT,                    -- ai_generated | instructor_uploaded
    questions             JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_questions       INTEGER,
    question_counts       JSONB,
    instructor_id         TEXT,
    created_by            TEXT,                    -- creator email (Base44 parity)
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
    -- double precision (NOT numeric) so node-pg returns JS numbers, not strings.
    total_score         DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_possible_score  DOUBLE PRECISION NOT NULL DEFAULT 0,
    percentage          DOUBLE PRECISION NOT NULL DEFAULT 0,
    time_started        TIMESTAMPTZ,
    time_completed      TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress | completed
    created_by          TEXT,
    created_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_date        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz_attempts(quiz_id);
