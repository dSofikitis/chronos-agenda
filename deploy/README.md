# deploy

| Path | What |
|---|---|
| `compose/docker-compose.yml` | Postgres + api + frontend, the full local stack. |

## Compose

`make compose-up` from the repo root builds all three images and brings the
stack up. `make demo` seeds a sample week of events for the local-dev user.

`docker compose -f deploy/compose/docker-compose.yml down` tears it down.

To enable Google OAuth + Claude:

```bash
GOOGLE_CLIENT_ID=...  GOOGLE_CLIENT_SECRET=...  ANTHROPIC_API_KEY=...  make compose-up
```

Without those, the API short-circuits to a deterministic local-dev user and
the assistant falls back to a local Ollama on `host.docker.internal:11434`.
