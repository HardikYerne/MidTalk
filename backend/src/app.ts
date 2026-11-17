import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { env } from "./config/env.js";
import { connectMongo, closeMongo } from "./infrastructure/database/mongo.js";
import { registerApiRoutes } from "./routes/index.js";
import { attachRealtime } from "./plugins/realtime.js";

export async function buildApp() {
  const app = Fastify({ logger: { level: env.nodeEnv === "production" ? "info" : "debug", redact: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.refreshToken"] }, bodyLimit: 1024 * 1024 });
  await app.register(helmet);
  await app.register(cors, { origin: env.webOrigin, credentials: true });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
  await app.register(rateLimit, { max: env.rateLimitMax, timeWindow: "1 minute" });
  await app.register(jwt, { secret: env.jwtSecret });
  app.decorate("authenticate", async (req, reply) => { try { await req.jwtVerify(); } catch { await reply.code(401).send({ error: "UNAUTHENTICATED", message: "A valid access token is required." }); } });
  const db = await connectMongo();
  app.decorate("mongo", db);
  app.get("/health", async () => ({ status: "ok", service: "private-collaboration-api", timestamp: new Date().toISOString() }));
  app.get("/ready", async (_req, reply) => { try { await db.command({ ping: 1 }); return { status: "ready", checks: { http: "ok", mongodb: "ok" } }; } catch { return reply.code(503).send({ status: "not-ready" }); } });
  await registerApiRoutes(app);
  await attachRealtime(app);
  app.setNotFoundHandler(async (_req, reply) => reply.code(404).send({ error: "NOT_FOUND" }));
  app.setErrorHandler((error, req, reply) => { req.log.error({ err: error }, "Unhandled request error"); const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500; return reply.code(status).send({ error: status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR", message: status === 500 ? "An unexpected error occurred." : error.message }); });
  app.addHook("onClose", async () => { await closeMongo(); });
  return app;
}
