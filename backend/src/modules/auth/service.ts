import argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { getDb } from "../../infrastructure/database/mongo.js";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const refreshToken = () => randomBytes(48).toString("base64url");
const ARGON = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const activeSession = { revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } };

export class AuthError extends Error {
  constructor(public code: string, message: string, public statusCode: number) { super(message); }
}

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(input: { email: string; username: string; displayName: string; password: string }) {
    const db = getDb(), emailNormalized = input.email.toLowerCase(), usernameNormalized = input.username.toLowerCase();
    const passwordHash = await argon2.hash(input.password, ARGON);
    const now = new Date();
    try {
      const result = await db.collection("users").insertOne({
        email: input.email, emailNormalized, username: input.username, usernameNormalized,
        displayName: input.displayName, passwordHash, status: "ACTIVE", createdAt: now, updatedAt: now
      });
      return { id: result.insertedId.toHexString(), email: input.email, username: input.username, displayName: input.displayName, createdAt: now };
    } catch (e) {
      if (typeof e === "object" && e !== null && "code" in e && e.code === 11000)
        throw new AuthError("IDENTITY_UNAVAILABLE", "Email or username is already in use.", 409);
      throw e;
    }
  }

  private async findByIdentifier(identifier: string) {
    const id = identifier.toLowerCase();
    return getDb().collection("users").findOne({ $or: [{ emailNormalized: id }, { usernameNormalized: id }] });
  }

  private async passwordMatches(user: any, password: string) {
    return user ? argon2.verify(user.passwordHash, password).catch(() => false) : false;
  }

  async login(input: { identifier: string; password: string; deviceName: string }) {
    const user = await this.findByIdentifier(input.identifier);
    const valid = await this.passwordMatches(user, input.password);
    if (!user || !valid) throw new AuthError("INVALID_CREDENTIALS", "Invalid username/email or password.", 401);
    // Only revealed after the password is verified, so it can't be used to probe for accounts.
    if (user.status === "DEACTIVATED")
      throw new AuthError("ACCOUNT_DEACTIVATED", "This account is deactivated. Reactivate it to sign in again.", 403);
    if (user.status !== "ACTIVE") throw new AuthError("INVALID_CREDENTIALS", "Invalid username/email or password.", 401);

    const deviceId = randomUUID(), raw = refreshToken(), now = new Date();
    await getDb().collection("sessions").insertOne({
      userId: user._id, tokenHash: hash(raw), deviceId, deviceName: input.deviceName,
      createdAt: now, expiresAt: new Date(now.getTime() + env.refreshTokenTtlDays * 86400000)
    });
    await getDb().collection("devices").updateOne({ userId: user._id, deviceId }, {
      $set: { deviceName: input.deviceName, lastSeenAt: now, status: "ACTIVE" },
      $setOnInsert: { createdAt: now }
    }, { upsert: true });
    const accessToken = await this.app.jwt.sign({ sub: user._id.toString(), username: user.username, deviceId }, { expiresIn: env.accessTokenTtl });
    return { user: this.publicUser(user), accessToken, refreshToken: raw, tokenType: "Bearer" };
  }

  async refresh(raw: string) {
    const db = getDb(), tokenHash = hash(raw);
    const session = await db.collection("sessions").findOne({ tokenHash, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!session) throw new AuthError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.", 401);
    const next = refreshToken();
    const updated = await db.collection("sessions").updateOne(
      { _id: session._id, tokenHash, revokedAt: { $exists: false } },
      { $set: { tokenHash: hash(next), rotatedAt: new Date() } }
    );
    if (updated.modifiedCount !== 1) throw new AuthError("REFRESH_TOKEN_REUSE", "Refresh token has already been used.", 401);
    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user || user.status !== "ACTIVE") throw new AuthError("ACCOUNT_UNAVAILABLE", "Account is unavailable.", 403);
    const accessToken = await this.app.jwt.sign({ sub: user._id.toString(), username: user.username, deviceId: session.deviceId }, { expiresIn: env.accessTokenTtl });
    return { user: this.publicUser(user), accessToken, refreshToken: next, tokenType: "Bearer" };
  }

  async logout(raw: string) {
    await getDb().collection("sessions").updateOne({ tokenHash: hash(raw), revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
  }

  /** Sign out everywhere, optionally keeping one device (used after a password change). */
  async logoutAll(userId: ObjectId, exceptDeviceId?: string) {
    const filter: any = { userId, revokedAt: { $exists: false } };
    if (exceptDeviceId) filter.deviceId = { $ne: exceptDeviceId };
    await getDb().collection("sessions").updateMany(filter, { $set: { revokedAt: new Date() } });
  }

  async changePassword(userId: ObjectId, currentDeviceId: string, currentPassword: string, newPassword: string) {
    const users = getDb().collection("users");
    const user = await users.findOne({ _id: userId });
    if (!user || user.status !== "ACTIVE") throw new AuthError("ACCOUNT_UNAVAILABLE", "Account is unavailable.", 403);
    if (!(await this.passwordMatches(user, currentPassword)))
      throw new AuthError("INVALID_PASSWORD", "Current password is incorrect.", 403);
    const passwordHash = await argon2.hash(newPassword, ARGON);
    await users.updateOne({ _id: userId }, { $set: { passwordHash, passwordChangedAt: new Date(), updatedAt: new Date() } });
    await this.logoutAll(userId, currentDeviceId); // other devices must sign in again
  }

  async listSessions(userId: ObjectId, currentDeviceId: string) {
    const rows = await getDb().collection("sessions")
      .find({ userId, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 }).toArray();
    return rows.map(s => ({
      deviceId: s.deviceId, deviceName: s.deviceName, createdAt: s.createdAt,
      lastActiveAt: s.rotatedAt ?? s.createdAt, current: s.deviceId === currentDeviceId
    }));
  }

  async revokeSession(userId: ObjectId, deviceId: string) {
    const r = await getDb().collection("sessions").updateOne({ userId, deviceId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    if (r.modifiedCount !== 1) throw new AuthError("SESSION_NOT_FOUND", "Session not found.", 404);
    await getDb().collection("devices").updateOne({ userId, deviceId }, { $set: { status: "REVOKED" } });
  }

  /** Reversible: the account is hidden and every session is revoked. Nothing is deleted. */
  async deactivate(userId: ObjectId, password: string) {
    const users = getDb().collection("users");
    const user = await users.findOne({ _id: userId });
    if (!user || user.status !== "ACTIVE") throw new AuthError("ACCOUNT_UNAVAILABLE", "Account is unavailable.", 403);
    if (!(await this.passwordMatches(user, password)))
      throw new AuthError("INVALID_PASSWORD", "Password is incorrect.", 403);
    const now = new Date();
    await users.updateOne({ _id: userId }, { $set: { status: "DEACTIVATED", deactivatedAt: now, updatedAt: now } });
    await this.logoutAll(userId);
    await getDb().collection("devices").updateMany({ userId }, { $set: { status: "REVOKED" } });
  }

  async reactivate(input: { identifier: string; password: string; deviceName: string }) {
    const user = await this.findByIdentifier(input.identifier);
    const valid = await this.passwordMatches(user, input.password);
    if (!user || !valid || user.status !== "DEACTIVATED")
      throw new AuthError("INVALID_CREDENTIALS", "Invalid username/email or password.", 401);
    await getDb().collection("users").updateOne({ _id: user._id }, { $set: { status: "ACTIVE", updatedAt: new Date() }, $unset: { deactivatedAt: "" } });
    return this.login(input);
  }

  private publicUser(user: any) {
    return { id: user._id.toString(), email: user.email, username: user.username, displayName: user.displayName, createdAt: user.createdAt };
  }
}
