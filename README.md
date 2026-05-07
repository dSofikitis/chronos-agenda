# Chronos Agenda

> A full-stack personal agenda with a Claude- or Gemini-powered planning
> assistant — talk to your calendar in natural language, get a clean week
> view (with multi-day event support and Wallet-style mobile cards), and
> share your schedule via a stable .ics URL.

A Next.js 15 + TypeScript frontend backed by a Java 21 + Spring Boot 3.5
API, with Postgres for storage. The chat-driven assistant is pluggable:
one `AGENT_MODE` env var chooses between **Anthropic Claude**, **Google
Gemini**, or a local **Ollama** fallback. Google OAuth handles login;
every row in the database is scoped by `user_id`. There's no Google
Calendar sync — Chronos is the source of truth, and the `.ics` export
gives you a read-only feed any calendar app can subscribe to.

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
| **Multi-day events** | Both all-day spans and time-specific spans across multiple days. Middle days render as all-day in the week grid; first / last days show start- and end-time chips with continuation chevrons. Forms have a Timed / All-day mode toggle. |
| **Polyglot monorepo** | Java for the API (Spring Boot 3.5 + JPA + Flyway), TypeScript for the entire frontend (Next.js 15 App Router + Tailwind, Wallet-style mobile cards via portal'd modals). |

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

The Compose path is recommended, but the entire stack also runs on
bare metal in three terminals. This is the path the project has been
exercised against on Windows + macOS during development.

### 1. Postgres (Windows: winget; macOS: brew)

```powershell
# Windows — installs as a Windows service that auto-starts.
winget install PostgreSQL.PostgreSQL.16
# Default superuser password is `postgres`. Once the service is up:
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -U postgres -c `
  "CREATE ROLE chronos LOGIN PASSWORD 'chronos'; CREATE DATABASE chronos OWNER chronos;"
```

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE ROLE chronos LOGIN PASSWORD 'chronos'; \
                  CREATE DATABASE chronos OWNER chronos;"
```

### 2. Java 21 (any distribution; Microsoft OpenJDK is a clean choice)

```powershell
# Windows — winget needs admin and may collide with other MSI installs.
# Portable zip is the no-friction alternative:
$ProgressPreference = "SilentlyContinue"
Invoke-WebRequest "https://aka.ms/download-jdk/microsoft-jdk-21.0.11-windows-x64.zip" `
  -OutFile $env:TEMP\jdk21.zip
Expand-Archive $env:TEMP\jdk21.zip -DestinationPath $env:USERPROFILE\.tools
[Environment]::SetEnvironmentVariable("JAVA_HOME",
  "$env:USERPROFILE\.tools\jdk-21.0.11+10", "User")
[Environment]::SetEnvironmentVariable("Path",
  "$([Environment]::GetEnvironmentVariable('Path','User'));$env:JAVA_HOME\bin", "User")
```

```bash
# macOS
brew install --cask temurin@21
```

### 3. `.env` at the repo root

Copy `.env.example` to `.env` and fill in at least:

```
AGENT_MODE=gemini
AGENT_KEY=your-google-ai-studio-key
CHRONOS_JWT_SECRET=any-stable-string-here
```

`AGENT_MODE=claude` works the same way with an Anthropic key. Leave
both blank to fall back to a local Ollama on `localhost:11434`.

### 4. Start the API

```bash
cd services/api
./mvnw spring-boot:run        # Spring Boot picks up `.env` via spring.config.import
```

Wait for `Started ChronosApiApplication in N seconds`. Verify:

```bash
curl http://localhost:8080/actuator/health   # {"status":"UP"}
```

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
CHRONOS_API_URL=http://localhost:8080 \
NEXT_PUBLIC_CHRONOS_API_URL=http://localhost:8080 \
npm run dev
```

Open <http://localhost:3000>. Click **Use the local dev account** —
when `GOOGLE_CLIENT_ID` is unset (the default), the API short-
circuits to a deterministic dev user so you can iterate without a
real OAuth app. The full Google OAuth flow activates the moment you
set `CHRONOS_OAUTH_ENABLED=true` and the matching Google client
credentials.

### 6. Open it from your phone (optional)

Both ports listen on all interfaces. Find your LAN IP and open
`http://<LAN_IP>:3000` from a device on the same Wi-Fi. Server
actions proxy through the Next.js process to `localhost:8080` on
the dev box, so no extra config is needed for the phone.

### Verified workflows

What's been smoke-tested end-to-end during development:

- `POST /api/auth/dev-login` → cookie set, `/api/auth/me` returns the user.
- `POST /api/events`, `PATCH /api/events/{id}`, `DELETE /api/events/{id}`
  via curl and via the in-UI forms.
- `POST /api/assistant/chat` with `AGENT_MODE=gemini` — replies pick up
  the visible week + today's date from the request preamble.
- `DELETE /api/assistant/history` — clears the user's chat history
  cleanly (Spring Data `@Modifying` + `int` return type).
- Multi-day events span correctly in the week grid and day modal.
- Friendly error message on rate-limit / invalid-key / wrong-model.
- Hot reload across theme + accent + density preference changes; the
  inline pre-hydration script avoids any flash of wrong colors on
  reload, including the chosen accent.

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
| `frontend` | Node ≥ 20, Next.js 16 | `npm run build` | `npm test` (vitest), `npm run test:e2e` (Playwright) |

End-to-end: the [`e2e`](frontend/e2e) suite drives a real browser
through dev-login → event/task CRUD → modal flows → theme + accent
persistence → assistant bubble. Locally, `npm run test:e2e` starts
the Next.js dev server itself; the API + Postgres need to be up
beforehand. CI brings everything up in
[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) with a
Postgres service container, a built API jar, and a production
`next start` server before running Playwright.

`make help` lists every target. CI (`.github/workflows/ci.yml`) runs
the same lint + test matrix across Java and TS on every push to
`main` and every PR; `e2e.yml` runs the Playwright suite.

## License

MIT. Copyright (c) 2026 Dimitris Sofikitis @dSofikitis.
