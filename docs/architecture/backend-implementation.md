# MidTalk backend implementation map

This document maps the code package to the supplied HLD and Complete Plan. It is a status record, not a claim that all product capabilities are complete.

## Runtime

- `frontend`: Next.js shell; serves `public/midtalk-ui.html` without redesigning its base layout. The HTML uses the API and Socket.IO clients to sign in, load conversations, start direct/group conversations, display requests, send text messages and update the basic profile.
- `backend`: Fastify modular monolith; versioned REST under `/api/v1`, Socket.IO attached to the same HTTP server.
- `backend/src/db/mongo.ts`: collection indexes.
- `backend/src/modules/platform/outbox-worker.ts`: durable outbox polling and notification record creation.
- `docker-compose.yml`: local MongoDB replica set, Redis and MinIO.

## Data ownership

| Module | Collections | Code
|---|---|---|
| Identity | users, sessions, devices | `modules/auth`, `modules/users` |
| Social graph | contacts, messageRequests, blocks | `modules/contacts` |
| Chat | conversations, messages, participantState | `modules/conversations`, `modules/messages` |
| Files | files, fileParts | `modules/files` |
| Meetings | meetings | `modules/meetings` |
| Communities | communities, channels, memberships | `modules/communities` |
| Projects | projects, projectMembers | `modules/projects` |
| Platform | notifications, outbox | `modules/notifications`, `modules/platform` |
| Agent | agents, agentActions | `modules/agent` |

## Messaging invariants

1. The sender ID comes from the authenticated request/socket, not the client payload.
2. The API verifies conversation membership and blocks.
3. A first-contact conversation stays `REQUEST_PENDING`; only the request sender can send the initial message. Acceptance activates the conversation.
4. `clientMessageId` is unique per sender/conversation; retry returns the stored message.
5. Conversation sequence increments and message/outbox insert run in a MongoDB transaction.
6. REST history sync uses `afterSeq`; Socket.IO is the fast path, not the source of truth.

## Not yet implemented

See the root README section “Explicitly not complete yet”. In particular, no E2EE cryptography is active, LiveKit token issuance is disabled, the agent has no tool executor, and the Yjs collaboration service is not present.
