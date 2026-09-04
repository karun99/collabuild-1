# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/). Each dependency/security update is
version-controlled via Dependabot PRs and release tags (see `SECURITY.md`).

## [Unreleased]

## [1.0.0] - 2026-01

### Added
- Real-time collaborative canvas (rect, circle, line, freehand, text, eraser)
- Live object list, properties panel, and history log
- Authentication (register / login / profile) with JWT
- Project management (create / list / edit / delete / share)
- WebSocket real-time sync via Socket.io
- Dark/light theming foundation with Tailwind
- In-memory mock database for zero-config development
- Prisma schema for PostgreSQL persistence (ready for production)

### Security & DevOps
- GitHub Dependabot configuration for npm, Docker, and GitHub Actions
- `SECURITY.md` with the adaptive security framework policy
- Version control for every dependency update (lockfiles, SemVer tags, grouped PRs)
- Docker support with production and development compose files
- Nginx-based single-node deployment (one-command `docker compose -f docker-compose.prod.yml up`)
- GitHub Actions CI (type-check, lint, build, docker build) and image publishing

[1.0.0]: https://github.com/Ari-Han-t/collabuild/releases/tag/v1.0.0
