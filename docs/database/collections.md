# MongoDB collections

Indexes are initialized by `backend/src/infrastructure/database/mongo.ts`. Current collections include users, sessions, devices, contacts, messageRequests, blocks, conversations, messages, participantState, files, fileParts, meetings, meetingParticipants, meetingArtifacts, communities, channels, memberships, invitations, projects, projectMembers, documents, notifications, outbox, auditEvents, agents, agentMemory, agentActions, agentSuggestions, cryptoDeviceBundles, and meetingConsents.

This list documents initialized indexes; it is not a claim that every listed collection has a complete feature workflow.
