
import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { setServers } from "node:dns";
import {
  runOutboxWorker,
  stopOutboxWorker,
} from "./modules/platform/outbox-worker.js";

async function startServer() {
  // Configure DNS resolver before MongoDB SRV lookup
  setServers(["1.1.1.1", "1.0.0.1"]);

  const app = await buildApp();

  void runOutboxWorker().catch((error) => {
    app.log.error({ err: error }, "Outbox worker stopped");
  });

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    stopOutboxWorker();
    await app.close();
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Shutting down API");
    stopOutboxWorker();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void startServer().catch((error) => {
  console.error("Failed to start MidTalk API:", error);
  process.exitCode = 1;
});
