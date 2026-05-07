CREATE TABLE users (
    id              UUID         PRIMARY KEY,
    google_subject  VARCHAR(128) UNIQUE,
    email           VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    timezone        VARCHAR(64)  NOT NULL DEFAULT 'UTC',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users (email);

CREATE TABLE events (
    id              UUID         PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(512) NOT NULL,
    starts_at       TIMESTAMPTZ  NOT NULL,
    ends_at         TIMESTAMPTZ  NOT NULL,
    all_day         BOOLEAN      NOT NULL DEFAULT FALSE,
    location        VARCHAR(512),
    notes           TEXT,
    rrule           VARCHAR(255),
    external_id     VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT events_time_order CHECK (ends_at >= starts_at)
);

CREATE INDEX events_user_starts_idx ON events (user_id, starts_at);
CREATE INDEX events_user_ends_idx   ON events (user_id, ends_at);

CREATE TABLE tasks (
    id              UUID         PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(512) NOT NULL,
    due_by          TIMESTAMPTZ,
    priority        SMALLINT     NOT NULL DEFAULT 2,  -- 0 low, 1 normal, 2 high
    status          VARCHAR(16)  NOT NULL DEFAULT 'open', -- open|done
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT tasks_priority_range CHECK (priority BETWEEN 0 AND 2),
    CONSTRAINT tasks_status_values  CHECK (status IN ('open', 'done'))
);

CREATE INDEX tasks_user_status_idx ON tasks (user_id, status);
CREATE INDEX tasks_user_due_idx    ON tasks (user_id, due_by);

CREATE TABLE ics_tokens (
    user_id         UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(64)  UNIQUE NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

CREATE TABLE chat_messages (
    id              UUID         PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(16)  NOT NULL, -- user|assistant|tool
    content         TEXT         NOT NULL,
    tool_name       VARCHAR(64),
    tool_call_id    VARCHAR(128),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chat_role_values CHECK (role IN ('user', 'assistant', 'tool'))
);

CREATE INDEX chat_user_created_idx ON chat_messages (user_id, created_at);
