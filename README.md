# OPEN_VIBE_SCAN

Open-source black-box website security scanning for modern web applications, with a plain-English public information site.

This repository contains two connected products:

- **VibeScan** — the scanner application and report experience.
- **SecScan** — the public education, coverage, safety, and responsible-use site for VibeScan.

## Repository layout

| Path | Purpose |
| --- | --- |
| `artifacts/vibescan` | VibeScan web application |
| `artifacts/secscan-info` | SecScan public information site |
| `artifacts/api-server` | Express API, scan worker, probes, reports, and monitoring |
| `lib/db` | Drizzle schema and database access |
| `lib/api-zod` | Shared API validation schemas |
| `lib/api-client-react` | Generated React API client |
| `lib/replit-auth-web` | Shared authentication hook |

## Local setup

1. Install Node.js 24 and pnpm.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env` and configure a PostgreSQL database plus the providers you want to use.
4. Build the shared packages with `pnpm run typecheck:libs`.

Run the scanner frontend:

```bash
pnpm --filter @workspace/vibescan run dev
```

Run the API server in another terminal:

```bash
pnpm --filter @workspace/api-server run dev
```

Run the public information site:

```bash
pnpm --filter @workspace/secscan-info run dev
```

## Responsible use

Only scan systems you own or have explicit permission to test. VibeScan is designed for bounded, defensive assessment of public web applications; it is not a license to perform unauthorized reconnaissance or disruptive testing.

The scanner is black-box by design. It complements code review, authenticated testing, and professional penetration testing; it does not prove that an application is secure or free of vulnerabilities.

## Configuration

Environment variable names and safe placeholders are documented in `.env.example`. Never commit real API keys, database credentials, session secrets, or provider tokens.

## License

Released under the MIT License. See `LICENSE`.
