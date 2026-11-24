import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/routes.js";
import { userRoutes } from "../modules/users/routes.js";
import { contactRoutes } from "../modules/contacts/routes.js";
import { conversationRoutes } from "../modules/conversations/routes.js";
import { messageRoutes } from "../modules/messages/routes.js";
import { fileRoutes } from "../modules/attachments/routes.js";
import { meetingRoutes } from "../modules/meetings/routes.js";
import { meetingConsentRoutes } from "../modules/meetings/consent-routes.js";
import { communityRoutes } from "../modules/communities/routes.js";
import { projectRoutes } from "../modules/projects/routes.js";
import { notificationRoutes } from "../modules/notifications/routes.js";
import { agentRoutes } from "../modules/agent/routes.js";
import { cryptoRoutes } from "../modules/encryption/routes.js";

export async function registerApiRoutes(app: FastifyInstance) {
  const modules = [authRoutes, userRoutes, contactRoutes, conversationRoutes, messageRoutes, fileRoutes, meetingRoutes, meetingConsentRoutes, communityRoutes, projectRoutes, notificationRoutes, agentRoutes, cryptoRoutes];
  for (const register of modules) await app.register(register, { prefix: "/api/v1" });
}
