# Deployment Guide

CollaBuild is designed to be **easy to deploy**. The recommended path is a
single-node production stack via Docker Compose (one command), or the manual
build for platforms like Railway/Render/Vercel.

---

## 1. Quick Deploy (Docker Compose — Recommended)

Single command on any machine / VPS with Docker:

```bash
git clone https://github.com/Ari-Han-t/collabuild.git
cd collabuild

# Bring up the whole stack behind one nginx entry point
docker compose -f docker-compose.prod.yml up -d --build
```

Then open **http://localhost:8080**.

The production stack includes:

| Service   | Container | Notes                                        |
| --------- | --------- | -------------------------------------------- |
| frontend  | nginx     | Serves the SPA and proxies `/api` + WebSocket |
| backend   | node      | REST API + Socket.io on port 3000             |
| postgres  | postgres15 | Persistence (optional for mock mode)          |
| redis     | redis7    | Cache / pub-sub (optional for mock mode)      |

**Configuration** via environment variables (copy `.env.prod.example`):

```bash
cp .env.prod.example .env
# edit .env as needed, e.g.:
#   PORT=8080
#   JWT_SECRET=generate-a-long-random-secret
#   CORS_ORIGIN=https://yourdomain.com
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Updating

```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 2. Docker Compose (Development, hot-reload)

```bash
docker compose up --build
# Frontend http://localhost:5173 · Backend http://localhost:3000
```

---

## 3. Manual / PaaS Deployment (Railway, Render, Vercel, Fly)

### Backend (Node 18+)

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, etc.
npm run build
npm start
```

### Frontend static build

```bash
cd frontend
npm install
# For Vercel/Railway static hosting:
VITE_API_URL=https://api.yourdomain.com VITE_WS_URL=wss://api.yourdomain.com npm run build
# serve the `dist/` folder; point /api and /socket.io at the backend
```

> In production the frontend calls the backend through the same origin
> (`/api` and `/socket.io`). On PaaS set `VITE_API_URL=/api`,
> `VITE_WS_URL=/socket.io` and configure a reverse proxy / rewrite so `/api`
> and `/socket.io` hit the backend service.

---

## 4. Versioning & Releases

Every update is version-controlled:

- **Lockfiles** (`package-lock.json`) pin exact versions — commit them.
- **Dependabot** opens grouped PRs for security + version updates (see
  `.github/dependabot.yml` and `SECURITY.md`).
- **SemVer tags** (`v1.2.3`) trigger the Docker publish workflow
  (`.github/workflows/docker-publish.yml`), producing immutable, tagged images
  on GHCR.

Cutting a release:

```bash
# 1. bump the version in package.json, CHANGELOG.md, and VERSION
# 2. commit
# 3. tag and push
git tag -a v1.1.0 -m "Release v1.1.0"
git push --tags
```

The action publishes `ghcr.io/<owner>/collabuild-backend:<ver>` and
`...-frontend:<ver>` with a `latest` tag for mainline.

---

## 5. Production Reverse Proxy / SSL

If you deploy the nginx container behind your own host, or want to add TLS:

```bash
# Example: run behind Caddy for automatic HTTPS
# or add to nginx.conf:
#   listen 443 ssl;
#   server_name yourdomain.com;
```

For DMZ-only hosts, expose `80` and terminate TLS at your edge (Caddy, Nginx,
Cloudflare, or an AWS ALB).

---

## 6. Database Migrations (Persistent mode)

The backend runs out of the box with an in-memory mock DB (zero setup). To use
the persistent PostgreSQL schema:

```bash
cd backend
npx prisma migrate deploy   # apply migrations
npm run db:seed             # optional demo data
```

---

## 7. Monitoring & Operations

- Container logs: `docker compose -f docker-compose.prod.yml logs -f`
- Health check: `curl http://localhost:8080/health` → `{"status":"ok"}`
- Processes auto-restart via `restart: unless-stopped`
