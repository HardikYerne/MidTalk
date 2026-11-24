import { z } from "zod";

const password = z.string().min(12).max(128);

export const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().trim().min(1).max(80),
  password
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(128),
  deviceName: z.string().trim().min(1).max(100).default("Web browser")
});

export const tokenSchema = z.object({ refreshToken: z.string().min(32).max(512) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password
}).refine(v => v.currentPassword !== v.newPassword, {
  path: ["newPassword"],
  message: "New password must be different from the current password."
});

// Used for both deactivation and reactivation checks.
export const confirmPasswordSchema = z.object({ password: z.string().min(1).max(128) });

export const reactivateSchema = loginSchema;
