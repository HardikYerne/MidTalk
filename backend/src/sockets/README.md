# Socket transport
The current Socket.IO implementation is in `plugins/realtime.ts` and is re-exported from `index.ts`. Domain event handlers should be split into `events/` as they are extracted.
