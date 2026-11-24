import type { FastifyInstance, FastifyReply } from "fastify";
import { getDb } from "../../infrastructure/database/mongo.js";
import { AuthError, AuthService } from "./service.js";
import { env } from "../../config/env.js";
import { changePasswordSchema, confirmPasswordSchema, loginSchema, reactivateSchema, registerSchema } from "./schemas.js";
import { currentUserId } from "../../utils/auth.js";

const deviceIdOf = (req: { user: unknown }) => (req.user as { deviceId: string }).deviceId;

const COOKIE = "midtalk_refresh";
const cookieOpts = { httpOnly: true, secure: env.cookieSecure, sameSite: "lax" as const, path: "/api/v1/auth" };
// Stricter limit on endpoints that check passwords.
const strict = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AuthError) return reply.code(error.statusCode).send({ error: error.code, message: error.message });
  throw error;
}
const invalid = (reply: FastifyReply, p: { error: { flatten(): unknown } }) =>
  reply.code(400).send({ error: "VALIDATION_ERROR", details: p.error.flatten() });

export async function authRoutes(app: FastifyInstance) {
  const auth = new AuthService(app);
  const withCookie = (reply: FastifyReply, r: Awaited<ReturnType<AuthService["login"]>>) => {
    reply.setCookie(COOKIE, r.refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });
    return { user: r.user, accessToken: r.accessToken, tokenType: r.tokenType };
  };

  app.post("/auth/register", strict, async (req, reply) => {
    const p = registerSchema.safeParse(req.body);
    if (!p.success) return invalid(reply, p);
    try { return reply.code(201).send({ user: await auth.register(p.data) }); } catch (e) { return handleError(e, reply); }
  });

  app.post("/auth/login", strict, async (req, reply) => {
    const p = loginSchema.safeParse(req.body);
    if (!p.success) return invalid(reply, p);
    try { return withCookie(reply, await auth.login(p.data)); } catch (e) { return handleError(e, reply); }
  });

  app.post("/auth/refresh", async (req, reply) => {
    const raw = (req.cookies as any)?.[COOKIE];
    if (!raw) return reply.code(401).send({ error: "INVALID_REFRESH_TOKEN" });
    try { return withCookie(reply, await auth.refresh(raw)); } catch (e) { return handleError(e, reply); }
  });

  app.post("/auth/logout", async (req, reply) => {
    const raw = (req.cookies as any)?.[COOKIE];
    if (raw) await auth.logout(raw);
    reply.clearCookie(COOKIE, { path: cookieOpts.path });
    return reply.code(204).send();
  });

  app.post("/auth/logout-all", { preHandler: [app.authenticate] }, async (req, reply) => {
    await auth.logoutAll(currentUserId(req));
    reply.clearCookie(COOKIE, { path: cookieOpts.path });
    return reply.code(204).send();
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await getDb().collection("users").findOne({ _id: currentUserId(req) });
    if (!user || user.status !== "ACTIVE") return reply.code(404).send({ error: "USER_NOT_FOUND" });
    return { user: { id: user._id.toString(), email: user.email, username: user.username, displayName: user.displayName, createdAt: user.createdAt } };
  });

  app.post("/auth/change-password", { preHandler: [app.authenticate], ...strict }, async (req, reply) => {
    const p = changePasswordSchema.safeParse(req.body);
    if (!p.success) return invalid(reply, p);
    try {
      await auth.changePassword(currentUserId(req), deviceIdOf(req), p.data.currentPassword, p.data.newPassword);
      return reply.code(204).send();
    } catch (e) { return handleError(e, reply); }
  });

  app.get("/auth/sessions", { preHandler: [app.authenticate] }, async req =>
    ({ items: await auth.listSessions(currentUserId(req), deviceIdOf(req)) }));

  app.delete("/auth/sessions/:deviceId", { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      await auth.revokeSession(currentUserId(req), String((req.params as any).deviceId));
      return reply.code(204).send();
    } catch (e) { return handleError(e, reply); }
  });

  app.post("/auth/deactivate", { preHandler: [app.authenticate], ...strict }, async (req, reply) => {
    const p = confirmPasswordSchema.safeParse(req.body);
    if (!p.success) return invalid(reply, p);
    try {
      await auth.deactivate(currentUserId(req), p.data.password);
      reply.clearCookie(COOKIE, { path: cookieOpts.path });
      return reply.code(204).send();
    } catch (e) { return handleError(e, reply); }
  });

  app.post("/auth/reactivate", strict, async (req, reply) => {
    const p = reactivateSchema.safeParse(req.body);
    if (!p.success) return invalid(reply, p);
    try { return withCookie(reply, await auth.reactivate(p.data)); } catch (e) { return handleError(e, reply); }
  });
}
