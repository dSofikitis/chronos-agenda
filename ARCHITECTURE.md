# Architecture

Where the parts live, how they talk, and why each language was picked.

## Components

| Component | Language | Responsibility |
|---|---|---|
| `services/api/` | Java 21 + Spring Boot 4 | REST + SSE API. Auth (Google OAuth2 + JWT cookies), events / tasks CRUD, the assistant tool-use loop, `.ics` export. |
| `frontend/` | TypeScript (Next.js 15 App Router) | Agenda UI: week + day views, chat panel, login flow, settings. Server actions proxy authenticated calls to the API; the bearer cookie never leaves the server side. |

## Why those languages

- **Java + Spring Boot for the API.** The whole portfolio is
  Python + Rust + Go + TS. Adding Java diversifies the language
  story for reviewers; Spring Boot 4 + Spring Security + JPA +
  Flyway is also a recognizable enterprise stack. Tool-use against
  the Anthropic API maps cleanly to a `Map<String, Tool>` registry
  with `@PostMapping` controllers acting as the handlers.
- **Next.js + TypeScript for the frontend.** App Router server
  actions hold the JWT cookie server-side; the client only sees a
  data-shaped response. Same toolchain as PhishShield's dashboard,
  so layouts and tooling are familiar.

## Per-request lifecycle (a chat turn)

```
User types: "shift my Tuesday standup to Wednesday at 10am"
            │
            ▼
frontend ChatPanel.tsx
  · POST /api/assistant/chat with { message } + cookie session
            │
            ▼
api  AssistantController
  · Resolves user from JWT
  · Builds the conversation: system prompt + history (chat_messages) + user turn
            │
            ▼
api  AssistantService
  · If ANTHROPIC_API_KEY set, talk to Claude with tool definitions:
        list_events, create_event, update_event, delete_event,
        list_tasks, create_task
  · Otherwise, fall back to a local Ollama model with the same tools,
    via JSON-mode prompting
            │
            ▼
LLM returns tool calls
  · Each tool call is executed in-process by the matching ToolHandler,
    re-using the same EventService/TaskService that the REST endpoints use
  · Per-user authorization is enforced inside the service layer, not in
    the tool wiring — the assistant cannot bypass it
            │
            ▼
Tool results are appended to the conversation, sent back to the LLM
  · Loop continues until the LLM emits a final text turn (no tool use)
            │
            ▼
api  Persists assistant message + any tool side-effects (already done)
            │
            ▼
SSE stream pushes incremental tokens back to the browser
```

## Trust boundaries

- **Browser ↔ frontend**: cookies only. The frontend never exposes
  a session JWT to JavaScript; every API call goes through a Next.js
  server action that re-injects the cookie.
- **frontend ↔ api**: HttpOnly JWT cookie. CORS is restricted to the
  configured frontend origin in `application.yml`.
- **api ↔ Anthropic**: outbound only. The API key lives only in the
  api process environment.
- **api ↔ Ollama**: localhost (or `CHRONOS_OLLAMA_URL`). Same shape
  as the Anthropic call, swappable at runtime.
- **api ↔ Postgres**: trusted network inside Compose. Every query
  is parameterized; every `@Repository` method scopes by user_id.

## Tool schema (the assistant's API)

The same JSON schema is sent to both Claude and Ollama. Ollama uses
the schema as an instruction for JSON-mode output; Claude uses it
natively as `tools=[...]`.

| Tool | Inputs | Output |
|---|---|---|
| `list_events` | `{ from: ISO date, to: ISO date }` | array of `{ id, title, startsAt, endsAt, allDay, location, notes }` |
| `create_event` | `{ title, startsAt, endsAt, allDay?, location?, notes? }` | new event row |
| `update_event` | `{ id, ...fields }` | updated row |
| `delete_event` | `{ id }` | `{ ok: true }` |
| `list_tasks` | `{ status?: 'open'|'done'|'all' }` | array of `{ id, title, dueBy, priority, status }` |
| `create_task` | `{ title, dueBy?, priority?, notes? }` | new task row |

All ISO-8601 timestamps are zoned UTC; the frontend renders them in
the user's local timezone.

## Storage layout

Postgres in production / Compose. The API uses Flyway for
versioned migrations under `services/api/src/main/resources/db/migration/`.

| Table | Purpose |
|---|---|
| `users` | One row per Google identity. PK is the API's own UUID; `google_subject` is unique. |
| `events` | Calendar events. Owned by `user_id`. Times are stored UTC. |
| `tasks` | Tasks. Owned by `user_id`. |
| `ics_tokens` | One opaque URL-safe token per user; the `.ics` URL embeds it. Tokens are revocable from the settings page. |
| `chat_messages` | Conversation history per user, role ∈ `{user, assistant, tool}`. The assistant is conditioned on the last N messages. |

## Threat model

What this system tries to defend against:

- A user ending up authenticated as someone else. Cookie is HttpOnly,
  Secure (in prod), SameSite=Lax; JWT is HS256-signed; every
  controller scopes queries by the JWT's user_id claim.
- The assistant being tricked into mutating another user's data.
  Tools delegate to the same service layer the REST endpoints use,
  which authorizes per-user before touching any row.
- LLM prompt injection from event content. Event titles / notes /
  locations come back to the LLM as quoted JSON inside a tool
  result; the system prompt instructs the model to treat tool
  output as data, not instructions. (Not bulletproof — defense in
  depth assumes the assistant cannot do anything the user
  couldn't.)

What it explicitly does **not** defend against:

- A compromised Google account (we trust the IdP).
- An adversarial LLM operator (we trust Anthropic / our own Ollama).
- Long-lived sessions on shared devices — set a short cookie TTL
  and require re-login if that's a concern for your deployment.

## Extension points

- **Two-way Google Calendar sync.** The schema is friendly to it —
  events already carry an opaque external-id column. Hook a sync
  worker that reads the user's Google Calendar API and writes diffs.
- **Recurring events.** Today's MVP supports single instances. The
  RFC 5545 recurrence-rule string is on the events table but
  expansion happens client-side; a server-side expander would be a
  natural follow-up.
- **Multi-account / shared agendas.** `users` already supports >1
  row; adding an `agenda_members` join table would shard events
  across tenants without a schema rewrite.
- **More tools.** The `ToolRegistry` is keyed by name — adding
  `find_free_slot` or `summarize_week` is one class + one map entry.
