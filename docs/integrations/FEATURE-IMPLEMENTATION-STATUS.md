# MidTalk integration expansion — implementation status

This package adds concrete integration code while preserving the supplied MidTalk UI layout and styling. A configured integration is not automatically a production-ready deployment.

| Previously missing item | Added in this package | Remaining gate |
|---|---|---|
| E2EE / Signal key management | Authenticated device public-key bundle publish/retrieval API; crypto adapter contract; encrypted data remains opt-in metadata only | Signal Protocol implementation, device identity lifecycle, session establishment, key verification, multi-device recovery and independent cryptographic review. Do not label messages E2EE until the adapter is installed and tested. |
| LiveKit / TURN | LiveKit server dev container; meeting participant join-token generation using `livekit-server-sdk`; short-lived room grants | Configure production LiveKit URL/key/secret, TURN/ICE, TLS, firewall and regional SFU; validate real calls and failover. Local `--dev` mode is development only. |
| AI agent / transcription | Configurable OpenAI-compatible LLM meeting summary endpoint; owner-scoped agent actions; explicit per-user transcription consent; audio transcription endpoint; transcript storage; suggestion approval endpoint | Configure STT/LLM providers; add visible in-meeting agent participant and real-time audio capture pipeline; execute fixed tools via audited worker only after owner confirmation. Agent actions are queued, not arbitrary code execution. |
| Yjs collaboration | Separate WebSocket service with JWT authentication, project membership check, Yjs sync protocol and MongoDB document-state persistence | Add project invitation/role management, snapshot compaction, awareness/presence, horizontal fan-out, browser editor provider and operational monitoring. |
| VS Code extension | Extension scaffold, secure token storage through VS Code SecretStorage, explicit current-file sharing consent command | Implement authenticated Yjs client transport, selected-file sync and conflict/reconnect tests before transmitting source content. |
| Communities/projects/settings UI integration | Browser API helper methods and endpoints remain available; frontend helper loaded without changing visual styling | Existing static UI controls are not all bound to live API actions. Wire each control and test user journeys. |
| File attachment UI | Browser multipart upload helper obtains presigned part URLs, uploads chunks directly, reports progress, finalizes upload | Connect existing attachment picker/send flow to helper; configure object-storage CORS to expose `ETag`; add checksum verification, abort/resume UI and malware scanning policy. |
| Security / backup / load testing | Security and operations runbooks, backup/restore scripts and test checklist | Execute in target infrastructure, independent review, restore drill and representative load tests; no scale claim is made. |

## New API paths

- `PUT /api/v1/crypto/devices/:deviceId/bundle`
- `GET /api/v1/crypto/users/:userId/bundles`
- `POST /api/v1/meetings/:id/consent`
- `POST /api/v1/meetings/:id/transcribe` (multipart audio; requires consent and configured STT)
- `POST /api/v1/meetings/:id/transcripts` (consented transcript segment ingestion)
- `POST /api/v1/agent/meetings/:id/summarize` (consented transcript + configured LLM)
- `POST /api/v1/agent/suggestions/:id/approve`
- `POST /api/v1/meetings/:id/join-token` (real LiveKit JWT when credentials are configured)

## Local services

- API: `pnpm dev:api`
- Web: `pnpm dev:web`
- Yjs collaboration: `pnpm dev:collaboration`
- Infrastructure: `docker compose up -d`

The Yjs server uses `YJS_JWT_SECRET` (or falls back to `JWT_SECRET` when empty) and MongoDB. If configured separately, it must match the token-signing secret or use a dedicated collaboration-token issuer. Do not expose signing secrets in browser code.

## Frontend-to-backend wiring update

- The existing HTML/CSS UI is retained; no layout redesign was made.
- The browser API helper now attaches the short-lived access token from session storage to authenticated API requests.
- The chat attachment picker now uses the multipart upload API, posts a persisted `FILE` message, and renders stored file metadata after history sync or realtime delivery.
- File download/open actions request an authorization-checked short-lived download URL from the API.
- Local MinIO initialization applies a CORS policy that permits the local web origin and exposes `ETag`, which the multipart browser uploader needs.

### Remaining integration boundaries

- Profile save is connected; other settings controls must be audited individually before they can be described as persisted.
- The meeting, agent, communities, projects, collaboration and crypto screens still require complete UI workflows and end-to-end tests.
- E2EE requires a reviewed Signal Protocol implementation and key lifecycle design; the `encrypted` database flag is not encryption.
- LiveKit requires real credentials and browser media testing; local development credentials are not production credentials.
- Yjs and VS Code collaboration require multi-client synchronization tests and authorization review.
- MongoDB backup scripts are provided, but restore drills, retention, RPO/RTO, production hardening and load tests have not been completed.
