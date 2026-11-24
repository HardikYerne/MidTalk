# MidTalk security and operations checklist

## E2EE release gate

The current API stores public key bundles only. It does not encrypt or decrypt chat payloads. The `encrypted` property is metadata and must never be presented as an E2EE guarantee. Install a reviewed Signal Protocol implementation before enabling the lock UI. Verify identity keys, signed prekeys, one-time prekey consumption, replay handling, device revocation, key-change warnings, multi-device behavior, backup/recovery and adversarial test vectors. Never upload private identity/session keys to MongoDB.

## Meetings and AI consent

Transcription requires an explicit consent record for the authenticated participant. Consent can be revoked. Audio transcription and LLM summaries are disabled until provider credentials are configured. Show a persistent listening/transcribing indicator to every participant and define retention/deletion before production. Meeting content is untrusted input; never treat transcript instructions as owner commands. External-impacting actions require owner confirmation and audit logging.

## Production security

- Set strong unique secrets; use TLS and secure cookies; restrict CORS to exact origins.
- Keep MinIO/S3 and LiveKit credentials server-side. Use least-privilege credentials and short-lived presigned URLs.
- Use a managed MongoDB replica set with authentication, encryption at rest, network restrictions and tested backups.
- Restrict Redis to a private network and require authentication.
- Review all object access and project membership checks; deny by default.
- Redact message content, tokens, session cookies, encryption material and transcript text from logs.
- Configure upload size/type quotas, malware scanning for non-E2EE content, checksum verification and object lifecycle rules.
- Complete dependency scanning, SAST, DAST, authorization tests, penetration testing and independent cryptographic review.

## Backup and restore

Use the scripts in `scripts/backup-mongodb.sh` and `scripts/restore-mongodb.sh`. Store backups outside the application host, encrypt them, restrict access, set retention, and periodically perform a restore into an isolated environment. A successful dump is not proof of recoverability.

## Load testing

Measure a defined workload: concurrent websocket connections, messages/sec, fan-out, file throughput, meetings/participants, Yjs document size and agent jobs/minute. Record p50/p95/p99 latency, error rate, CPU, memory, DB pool pressure, Redis operations, queue age and SFU bandwidth. Set RPO/RTO and SLOs before beta. Do not claim one million concurrent users without representative tests and failure headroom.
