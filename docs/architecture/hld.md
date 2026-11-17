# Architecture overview

Begin with a modular monolith for core business logic. Independently scalable runtimes will be introduced for realtime application events, Yjs collaboration, media SFU/TURN and object storage.

| Component | Responsibility |
|---|---|
| Next.js | Web interface |
| Fastify | Authentication, authorization and business APIs |
| MongoDB | Durable application records |
| Redis | Cache, ephemeral presence and realtime coordination |
| MinIO/S3 | File bytes and multipart objects |
| Socket.IO | Application events, not bulk file/media payloads |
| WebRTC + SFU | Audio/video/screen media |
| Yjs | Collaborative document synchronization |

All protected operations require server-side authorization. Optional E2EE applies only to explicitly selected messages/files. Browser screen sharing does not imply remote-control permission.
