# Identity and authentication — current implementation

Routes:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (Bearer access token)
- `GET /health`
- `GET /ready`

Registration validates email, username, display name and a 12-character-minimum password. Passwords are hashed using Argon2id. Email and username are normalized and uniquely indexed. Login creates a random refresh token; only its SHA-256 hash is stored. Refresh rotates the token. Access tokens are signed JWTs.

## Outstanding production work
- Secure HttpOnly/SameSite browser cookie delivery and CSRF protection.
- Email verification, password reset, account recovery.
- Device/session listing and revocation endpoints.
- Refresh token family reuse detection.
- Audit logs and security tests.
- Replace development secrets and credentials before deployment.
- Add automated tests and verify dependency compatibility/runtime behavior.
