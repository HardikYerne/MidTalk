# Frontend milestone — Private Collaboration Platform

## Implemented in this milestone

- Responsive Next.js App Router workspace shell.
- Workspace switcher, primary navigation, account menu and notifications affordance.
- Messaging workspace with conversation list, local conversation search, selected conversation details, message history and responsive mobile conversation navigation.
- Local-only message composer (Enter to send; Shift+Enter for newline).
- Contacts, meetings, files, communities, projects and settings overview screens.
- Settings categories for profile, privacy, security, notifications, appearance and storage/preferences entry points.
- Shared visual language, responsive layouts, empty states, preview notices and accessible focus states.

## Deliberate limitations

This is a frontend UI milestone, not a complete working collaboration product. Conversation data is hard-coded demo content held in client state. Sending a message only appends it to the local browser state; it is not sent to another user and is not persisted. Buttons for meetings, uploads, contact discovery, profile updates, notifications, calls, communities, projects and account controls display a notice because the corresponding backend APIs and realtime/media services are not yet implemented.

The frontend does not claim that E2EE, file transfer, WebRTC, presence, account security settings, or any backend integration is operational.

## Run

From the monorepo root, with Node.js 20+, pnpm 9+, and dependencies installed:

```bash
pnpm install
pnpm --filter @platform/web dev
```

Open `http://localhost:3000`.

## Files changed

- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
