# Frontend UI architecture

## Design direction

The Relay HTML prototype is used as a reference for interaction patterns only. The frontend does not reproduce its markup or visual styling. The current product UI uses a separate visual system: a light workspace canvas, violet accent, compact workspace sidebar, top utility bar, and responsive content layouts.

## Primary navigation

- Messages
- Contacts
- Meetings
- Files
- Communities
- Projects
- Personal agent
- Settings

## Messaging workspace

The desktop messaging view uses a three-column composition:

1. Conversation navigation and search.
2. Active conversation, message history, and composer.
3. Contact context and shared files.

The conversation list includes a private Note to Self entry. Message requests have a dedicated entry point. The current messages are local preview data; the API and Socket.IO are not connected.

## Personal agent workspace

The agent area has three views:

- Overview: prompt composer, quick actions, approval queue, and meeting companion preview.
- Activity: local activity history.
- Personal memory: owner-facing memory preview with remove/clear controls.

The interface communicates the intended safety model: owner-only operation, fixed capabilities, normal authorization, and confirmation for actions affecting other people. The current controls update local preview state only; they do not invoke an agent service.

## Other modules

Contacts, meetings, files, communities, projects, and settings have separate module entry pages. Their cards and tabs are sample UI data pending API integration. Settings cards represent profile/identity, privacy/presence, security/sessions, notifications, and appearance/storage.

## Responsive behavior

The existing responsive sidebar and mobile messaging layout are retained. The agent workspace switches from a two-column dashboard to a single-column layout at narrower widths.

## Implementation status

This is a frontend prototype, not a completed product implementation. No real authentication session, persistence, Socket.IO messaging, upload service, WebRTC meeting, collaboration sync, or agent backend is connected by this UI milestone.
