# Security Policy

## Biological Immunity-Inspired Adaptive Security Framework

CollaBuild implements a Biological Immunity-Inspired Adaptive Security Framework
designed to provide continuous, context-aware and adaptive protection. The
framework takes conceptual inspiration from biological immune systems and modern
agentic AI architectures to continuously observe, understand, detect, remember,
respond and adapt to security threats.

### Security Objectives

- Continuous security monitoring
- Behaviour-based anomaly detection
- Context-aware threat analysis
- Threat and incident memory
- Adaptive security policies
- Proactive threat identification
- Automated and human-approved response
- Continuous security improvement
- Dependency and software supply-chain security

### Adaptive Security Lifecycle

The framework follows the lifecycle:

`Sense → Contextualise → Detect → Remember → Decide → Respond → Learn → Adapt`

1. **Sense** – Collect security-relevant signals from application logs, API
   activity, authentication events, network activity, system events, code and
   configuration, dependency information, and security alerts.
2. **Contextualise** – Evaluate events against user behaviour, application
   behaviour, device/service behaviour, time and frequency, access patterns,
   previous incidents, and known threat intelligence. The objective is to
   distinguish normal from potentially harmful behaviour rather than relying
   exclusively on static rules.
3. **Detect** – Identify known vulnerabilities, suspicious behaviour, anomalous
   activity, dependency vulnerabilities, potentially malicious changes, and
   unusual API or authentication activity.
4. **Remember (Immune Memory)** – Record incidents, threat characteristics,
   affected components, previous responses, false-positive observations, and
   recovery outcomes so future events can be evaluated against previously
   observed patterns.
5. **Decide** – A security decision engine evaluates severity and context.
   Classifications: Informational, Low, Moderate, High, Critical, Unknown.
   High-impact actions should preferably require human approval unless
   explicitly configured otherwise.
6. **Adaptive Response** – Depending on threat level, recommend or perform
   increased monitoring, alert generation, rate limiting, session restriction,
   dependency update, component isolation, access restriction, or policy
   escalation.
7. **Learn and Adapt** – Use observations and validated responses to improve
   future detection and response policies, forming a continuous feedback loop.

### Agentic Security Capabilities

- **Context-aware reasoning** – evaluate events using multiple sources of evidence
- **Security tool integration** – dependency scanners, vulnerability databases,
  log analysers, static-analysis tools, API monitoring, threat-intelligence
  sources, and CI/CD security checks
- **Proactive security** – identify emerging risks before they become confirmed
  incidents where sufficient evidence exists
- **Human-in-the-loop** – automated actions proportional to risk; critical or
  potentially destructive actions support human review and approval

### Security Design Principles

- **Least Privilege** – components receive only required permissions
- **Defence in Depth** – security should not depend on a single mechanism
- **Continuous Monitoring** – observations continue throughout the lifecycle
- **Adaptive Defence** – controls respond to changing threat patterns
- **Context Before Action** – consider context before security-sensitive actions
- **Memory-Assisted Detection** – previous incidents improve future detection
- **Human Oversight** – high-impact decisions support human review
- **Fail-Safe Behaviour** – security failures should not expose protected resources

---

## Supported Versions

Security fixes primarily target the latest maintained version of the project.

| Version           | Security support     |
| ----------------- | -------------------- |
| Latest            | Supported            |
| Previous release  | Limited support      |
| Older releases    | Not supported        |

---

## Dependency Security

This repository uses **GitHub Dependabot** to monitor dependencies and help
identify and remediate vulnerable dependencies. See
[`.github/dependabot.yml`](.github/dependabot.yml).

Recommended repository settings (enable in GitHub > Settings > Code security):

- Dependency graph
- Dependabot alerts
- Dependabot security updates (automatic PRs when a fix is available)
- Dependabot version updates
- Enable Dependabot to create PRs automatically for vulnerable dependencies
- Request reviewers for all Dependabot PRs
- Require status checks (CI) to pass before merging Dependabot PRs

Security and version-update PRs are **grouped** and labelled to simplify review
and maintenance. Each dependency has a locked version (see below).

---

## Version Control for Every Update

To keep the project auditable and reproducible, every dependency update is
**version-controlled**:

1. **Lockfiles** – `package-lock.json` pins the exact resolved versions of all
   transitive and direct dependencies for both `backend/` and `frontend/`. These
   lockfiles are committed and must be kept in sync with `package.json`. Do not
   ignore or delete them.
2. **Dependabot PRs** – Every update (security or version) arrives as a **pull
   request** that:
   - bumps both `package.json` and `package-lock.json`
   - names the change per Semantic Versioning (`MAJOR.MINOR.PATCH`)
   - is labelled (`security`, `dependencies`, scope labels)
   - includes `@dependabot` changelog metadata for review
3. **Semantic Versioning** – Project and dependency versions follow
   [SemVer](https://semver.org/). A change is a:
   - **MAJOR** – breaking change (e.g. `v1.x` → `v2.x`)
   - **MINOR** – backwards-compatible feature
   - **PATCH** – backwards-compatible bug fix
4. **Release tagging** – Releases are tagged (e.g. `v1.0.0`) and match the
   version in `package.json`. See "Release Checklist" below.
5. **CI gate** – All Dependabot PRs must pass the CI pipeline (type-check, lint,
   build, security scan) before merging, ensuring updated dependencies do not
   introduce regressions.
6. **Review** – All high-impact updates are gated by human review before merge.

### Lockfile verification

```bash
# Verify lockfile is in sync with package.json
cd backend  && npm install --package-lock-only --dry-run
cd frontend && npm install --package-lock-only --dry-run
```

### Release checklist

```bash
# After merging updates, cut a release:
# 1. Bump version in package.json (SemVer)
# 2. Update CHANGELOG
# 3. Commit and tag
git tag -a v1.1.0 -m "Release v1.1.0"
git push --tags
```

> The full project version lives in `VERSION` (see root). Patch it in the same
> commit as any SemVer bump so the running service reports the correct version.

---

## Reporting a Security Vulnerability

**Do not** disclose vulnerabilities publicly through GitHub Issues, pull
requests, discussions, or other public channels.

Report the vulnerability **privately** to the project maintainer including:

- Description of the vulnerability
- Affected component
- Steps required to reproduce
- Potential impact
- Suggested mitigation, if available
- Relevant logs or proof-of-concept information

Please allow reasonable time for investigation and remediation before public
disclosure.

### Responsible Disclosure

- Avoid public disclosure before remediation
- Avoid accessing or modifying data that does not belong to you
- Avoid disrupting production or third-party services
- Avoid testing against systems without authorization
- Avoid exposing credentials, personal data, or other sensitive information

---

## Scope

This security policy applies to the framework, its source code, configuration,
dependencies, documentation, and associated security automation. Third-party
services and dependencies remain subject to their respective policies.
