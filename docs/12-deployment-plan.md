# 12 — Deployment Plan

## Platform

Two targets:

| Target | Host | Domain |
|--------|------|--------|
| Cloud | Vercel | suggested `hazard-map.lasam-mpdc.obratech.net` |
| On-prem | Dedicated Ubuntu server + Cloudflare Tunnel | hostname you choose, e.g. `lasam.dost02.com` |

**Build:** `npm run build` → static `dist/` (nginx in Docker for on-prem).

No server database is required for the prototype.

## Vercel

1. Push repository to GitHub
2. Connect Vercel project
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Configure custom subdomain DNS

## On-prem (dedicated server)

Separate Ubuntu host from events. Clone, `./scripts/deploy-onprem.sh`, create a **new** Cloudflare Tunnel pointing to `http://127.0.0.1:80`. Push branch `onprem` to auto-deploy.

Full steps: [ONPREM_SETUP.md](./ONPREM_SETUP.md).
