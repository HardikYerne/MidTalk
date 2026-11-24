# Frontend route to backend module matrix

| Frontend route | API/domain modules | Current status |
|---|---|---|
| `/chat` | conversations, messages, presence, encryption | Conversations and messages implemented; presence and full E2EE incomplete |
| `/contacts` | contacts, users | Implemented |
| `/requests` | message-requests (currently contacts module) | Accept/reject/block implemented |
| `/calls` | meetings, screen-sharing, remote-control | Meeting token route exists; screen-sharing/remote-control APIs incomplete |
| `/meetings` | meetings | Create/list/join-token implemented |
| `/calendar` | scheduling, meetings | Scheduling-specific APIs not implemented |
| `/files` | attachments, transfers | Multipart upload/download URL flow exists; resumable orchestration incomplete |
| `/communities` | communities, channels, moderation | Community create/list and channel creation exist; moderation incomplete |
| `/organizations` | organizations, permissions | Not implemented yet |
| `/projects` | projects, permissions, collaboration | Project create/list exists; task/member workflow incomplete |
| `/settings` | users, devices, auth, permissions | Profile/preferences and auth session handling exist; device management incomplete |

All implemented API routes are registered under `/api/v1`. Unimplemented domains are explicitly marked rather than returning fake success responses.
