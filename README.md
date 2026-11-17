# Private Collaboration Platform

Monorepo organized around the supplied target structure. The existing MidTalk-branded UI and logo assets are retained under `frontend/public`. The current UI remains the original single-page workspace embedded by Next.js route shells; route-level UI extraction is a separate frontend refactor and has not been performed.

## Apps
- `frontend`: Next.js app and preserved MidTalk UI.
- `backend`: Fastify modular backend; all current APIs are registered through `src/routes/index.ts` under `/api/v1`.
- `backend/collaboration-server`: Yjs WebSocket server scaffold.
- `frontend/vscode-extension`: VS Code integration scaffold.

## Run locally
1. Copy `.env.example` to `.env` and set secrets/connection strings.
2. Start infrastructure: `docker compose up -d`.
3. Install workspace dependencies with `pnpm install`.
4. Start apps: `pnpm dev:all`.

## Verification status
This archive is structurally reorganized. It has not been dependency-installed, typechecked, built, launched, or integration-tested in this environment. Some domains are documented scaffolds; see `docs/api/route-module-matrix.md` and each `backend/src/modules/*/README.md` before treating a feature as implemented.
