# Chronos Agenda

> A full-stack personal agenda with a Claude-powered planning assistant —
> talk to your calendar in natural language, get a clean week view, and
> share your schedule via a stable .ics URL.

A Next.js 15 + TypeScript frontend backed by a Java 21 + Spring Boot 4
API, with Postgres for storage and the Anthropic Claude API for the
chat-driven planning assistant. Google OAuth handles login; every row
in the database is scoped by `user_id`. There's no Google Calendar
sync — Chronos is the source of truth, and the `.ics` export gives you
a read-only feed any calendar app can subscribe to.

## What this is for

Most calendar apps treat AI as a side-panel. Chronos puts the chat at
the center: typing *"shift my Tuesday standup to Wednesday and add a
30-minute prep block before it"* should produce an event diff the
assistant can actually apply, not just a paragraph of advice. The
backend is the trust boundary — the LLM's tool calls go through
authenticated REST endpoints with the same `@PreAuthorize` checks the
UI uses, so the assistant cannot do anything the user couldn't do.

| Capability | Where it shows up |
|---|---|
| **Conversational planner** | Claude API tool-use loop in `services/api/src/main/java/com/dsofikitis/chronos/ai/`. Tools: `list_events`, `create_event`, `update_event`, `delete_event`, `list_tasks`, `create_task`. Server-side; the browser never sees an Anthropic API key. |
| **Pluggable LLM** | One unified `AGENT_MODE` / `AGENT_KEY` switch picks Claude or Gemini at runtime. If neither is set, the assistant falls back to a local Ollama chat model (configurable via `CHRONOS_OLLAMA_URL`). Demo runs without external credentials. |
| **OAuth2 Google login** | Spring Security 6 + `oauth2-client` + custom `JwtService`. The session token is a signed JWT in an HttpOnly cookie; the frontend re-issues it through Next.js server actions so the browser never holds it. |
| **Per-user data isolation** | JPA `@PreAuthorize` + `@Filter`-style row guards on every controller. Cross-user reads are 404, not 403, on purpose (no oracle). |
| **Calendar + tasks** | Events (start/end/all-day/recurrence) and Tasks (due-by, priority, status). Two domains, one assistant. |
| **`.ics` export** | Stable opaque-token URL per user, served by `IcsController` with proper cache headers. Plug it into Apple Calendar, Google Calendar, Thunderbird — read-only feed. |
| **Polyglot monorepo** | Java for the API (Spring Boot 4 + JPA + Flyway), TypeScript for the entire frontend (Next.js 15 App Router + Tailwind). |

## Architecture at a glance

```
   ┌───────────────────────────┐                ┌──────────────────────────┐
   │ Next.js 15 frontend (TS)  │   REST + SSE   │ Spring Boot API (Java)   │
   │   · /agenda  week view    │ ─────────────▶    · /api/events          |
   │   · /chat    Claude panel │                │   · /api/tasks           │
   │   · /login   Google OAuth │                │   · /api/assistant/chat  │
   │   · /settings .ics URL    │                │   · /api/ics/{token}     │
   └─────────────┬─────────────┘                └────────────┬─────────────┘
                 │ HttpOnly                                  │
                 │ session cookie                            │
                 ▼                                           ▼
        ┌────────────────┐                          ┌────────────────────┐
        │ Google IdP     │ ◀─ OAuth2 code flow ──── | Spring Security   |
        │ accounts.      │                          │ oauth2Login filter │
        │ google.com     │                          └────────────────────┘
        └────────────────┘                                   │
                                                             ▼
                                                    ┌────────────────────┐
                                                    │ Postgres 16        │
                                                    │   · users          │
                                                    │   · events         │
                                                    │   · tasks          │
                                                    │   · ics_tokens     │
                                                    │   · chat_messages  │
                                                    └────────────────────┘
                  Tool calls (when assistant needs them)
                  ┌─────────────────────────────────┐
   ┌──────────────┴──────────┐       ┌──────────────┴──────────┐
   │ Anthropic Claude API    │  OR   │ Local Ollama            │
   │ (default if key set)    │       │ (CHRONOS_OLLAMA_URL)    │
   └─────────────────────────┘       └─────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the request lifecycle, the
tool schema the assistant calls, and the rationale behind each
language pick.

## Quickstart

```bash
make compose-up        # postgres + api + frontend
make demo              # creates a sample week of events + asks Claude to summarize
```

After `make compose-up` the stack is reachable on localhost:

| Port | Service | What |
|---|---|---|
| 8080 | api | `/api/*` REST + SSE; `/actuator/health` |
| 3000 | frontend | Next.js, the agenda UI |
| 5432 | postgres | persistent storage |

Tear down with `make compose-down`.

## Run locally without Docker

The Compose path is recommended, but if you want every moving part
on bare metal — Postgres in Docker, Java + Node natively — see
[CONTRIBUTING.md → Local dev](CONTRIBUTING.md#local-dev).

## Configuration

The API reads everything from environment variables (see
[`services/api/src/main/resources/application.yml`](services/api/src/main/resources/application.yml)).
A top-level `.env` at the repo root is auto-loaded on startup —
copy [`.env.example`](.env.example) to `.env` and fill in.

| Env var | Default | What |
|---|---|---|
| `AGENT_MODE` | unset | `claude` or `gemini`. Empty / unrecognized → Ollama fallback. |
| `AGENT_KEY` | unset | API key for whichever provider `AGENT_MODE` selects. |
| `CHRONOS_CLAUDE_MODEL` | `claude-opus-4-7` | Anthropic model id |
| `CHRONOS_GEMINI_MODEL` | `gemini-2.5-flash` | Google Gen-AI model id |
| `CHRONOS_OLLAMA_URL` | `http://localhost:11434` | Local-LLM endpoint |
| `CHRONOS_OLLAMA_MODEL` | `qwen2.5:3b` | Local-LLM model |
| `CHRONOS_DB_URL` | `jdbc:postgresql://localhost:5432/chronos` | JDBC URL |
| `CHRONOS_DB_USER` / `CHRONOS_DB_PASSWORD` | `chronos` / `chronos` | DB credentials |
| `CHRONOS_JWT_SECRET` | random per-process | HS256 secret. Set explicitly in prod. |
| `CHRONOS_OAUTH_ENABLED` | `false` | Set to `true` together with `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to activate Google OAuth2. |

## Development

Polyglot monorepo. Each component builds and tests independently.

| Component | Toolchain | Build | Test |
|---|---|---|---|
| `services/api` | Java 21, Maven Wrapper | `./mvnw package` | `./mvnw test` |
| `frontend` | Node ≥ 20, Next.js 15 | `npm run build` | `npm test` |

`make help` lists every target. CI (`.github/workflows/ci.yml`) runs
the same lint + test matrix across Java and TS on every push to
`main` and every PR.

## License

MIT. Copyright (c) 2026 Dimitris Sofikitis @dSofikitis.
