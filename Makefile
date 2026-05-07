.DEFAULT_GOAL := help
.PHONY: help build test lint api-build api-test api-lint api-run \
        front-build front-test front-lint front-typecheck front-dev \
        compose-up compose-down compose-logs demo

help:  ## list every target
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?##"}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ---------- top-level rollups ----------

build:  ## build api jar + frontend bundle
	$(MAKE) api-build front-build

test:  ## run mvn test + vitest
	$(MAKE) api-test front-test

lint:  ## run mvn -B verify (warnings) + eslint + tsc
	$(MAKE) api-lint front-lint front-typecheck

# ---------- api ----------

api-build:
	cd services/api && ./mvnw -B -q -DskipTests package

api-test:
	cd services/api && ./mvnw -B test

api-lint:
	cd services/api && ./mvnw -B -q -DskipTests verify

api-run:
	cd services/api && ./mvnw -B spring-boot:run

# ---------- frontend ----------

front-build:
	cd frontend && npm install --no-audit --no-fund && npm run build

front-test:
	cd frontend && npm install --no-audit --no-fund && npm test

front-lint:
	cd frontend && npm run lint

front-typecheck:
	cd frontend && npm run typecheck

front-dev:
	cd frontend && npm run dev

# ---------- compose ----------

compose-up:  ## bring up postgres + api + frontend
	docker compose -f deploy/compose/docker-compose.yml up -d --build
	@echo
	@echo "Chronos stack up:"
	@echo "  api:      http://localhost:8080"
	@echo "  frontend: http://localhost:3000"
	@echo
	@echo "Without GOOGLE_CLIENT_ID, click 'Use the local dev account' on /login."

compose-down:
	docker compose -f deploy/compose/docker-compose.yml down

compose-logs:
	docker compose -f deploy/compose/docker-compose.yml logs -f

demo:  ## seed a sample week of events
	bash examples/curl/seed-week.sh
