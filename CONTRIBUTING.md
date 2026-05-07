# Contributing

Polyglot monorepo. Each component is independently buildable and
tested with its own toolchain.

## Quick start

From the repo root:

```bash
make help        # list every target
make build       # build api + frontend
make test        # run all tests
make lint        # checkstyle + eslint + tsc --noEmit
make compose-up  # bring the full stack up
```

| Component | Toolchain | Where |
|---|---|---|
| `services/api` | Java 21, Maven Wrapper | `services/api/` (pom.xml) |
| `frontend` | Node ≥ 20, Next.js 15 | `frontend/` (package.json) |

## Local dev

Three terminals — Postgres in Docker, the API natively, the frontend
natively. No system Maven needed; `mvnw` ships with the project.

```bash
# Terminal 1 — Postgres
docker run --rm --name chronos-pg \
  -e POSTGRES_USER=chronos -e POSTGRES_PASSWORD=chronos -e POSTGRES_DB=chronos \
  -p 5432:5432 postgres:16-alpine

# Terminal 2 — API
cd services/api
./mvnw spring-boot:run

# Terminal 3 — frontend
cd frontend
npm install
npm run dev
```

The API serves <http://localhost:8080>; the frontend serves <http://localhost:3000>.

For Google OAuth to work end-to-end, set
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment
before starting the API. Without those, the OAuth flow short-circuits
into a local-only `dev` user — handy for offline development.

## Branches and PRs

- One logical change per commit; small PRs land faster.
- The PR template asks for the components touched, a test plan,
  and a screenshot for any frontend change.
- CI (`.github/workflows/ci.yml`) runs lint + test in a parallel
  matrix across Java and TS on every push to `main` and every PR.
  Keep all jobs green.

## Touching the assistant's tool surface

The `ToolRegistry` lives at
`services/api/src/main/java/com/dsofikitis/chronos/ai/tools/`. Adding
a new tool:

1. Implement the `ToolHandler` interface — `name()`, `inputSchema()`,
   `handle(JsonNode input, UUID userId)`.
2. Add a `@Component`-annotated bean for the handler. The registry
   picks it up via constructor injection.
3. Update [ARCHITECTURE.md → Tool schema](ARCHITECTURE.md#tool-schema-the-assistants-api).
4. Add a test under `services/api/src/test/.../ai/tools/` that
   exercises the happy-path JSON in / out.

Both LLM backends (Anthropic and Ollama) read the same registry —
your new tool is automatically available to both.

## Touching auth

The `JwtService` issues HS256 tokens with a `sub` claim of the user's
internal UUID. Cookies are emitted by `AuthCookieWriter` with
`HttpOnly + Secure (when not local) + SameSite=Lax`.

If you change cookie / claim semantics, also update:
- `frontend/lib/auth.ts` — the server-side cookie reader
- `application.yml` — the `chronos.jwt.*` properties
- One test in `AuthCookieWriterTest`

## Touching the schema

Add a new Flyway migration in
`services/api/src/main/resources/db/migration/`:

```
V{N+1}__brief_description.sql
```

Migrations are versioned and immutable — never edit a published one.
Flyway runs them on API startup; the test slice spins up an H2 with
the same migrations.

## Adding a new component language

If you bring in a third toolchain (a Go worker, a Python ML
service), add a job to `.github/workflows/ci.yml` and per-target
rules to the top-level `Makefile`. Make sure the tests are runnable
in CI without external network access beyond `mvn`/`npm`/your
package manager.
