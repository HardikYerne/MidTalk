# System context

The web client communicates with the Fastify API over HTTPS and Socket.IO for application events. MongoDB is the durable data store; Redis supports realtime fanout when configured; MinIO/S3 stores file objects; LiveKit provides meeting media; the Yjs collaboration server handles collaborative document sessions. The VS Code extension connects through the collaboration integration.

See `hld.md` and `../api/route-module-matrix.md` for current implementation boundaries.
