# Deploy

Production Git deploys: push `main` on [doschott/sietchwright](https://github.com/doschott/sietchwright). Vercel project **sietchwright** (team `doschotts-projects`) builds with `npm ci` and `npm run build`.

| Host | Role |
|------|------|
| https://sietchwright.com | Canonical. Share on X uses this URL. |
| https://www.sietchwright.com | Should redirect or alias to apex. |
| https://sietchwright.vercel.app | Automatic production alias |

## Custom domain

The domain is registered at Name.com through Vercel (NS `ns1.vercel-dns.com` / `ns2.vercel-dns.com`). If the apex returns `DEPLOYMENT_NOT_FOUND`, it is on Vercel's edge but **not aliased** to the project yet.

In the Vercel dashboard for **sietchwright** (not `sietchwright-planner`):

1. Project → Settings → Domains
2. Add `sietchwright.com` and `www.sietchwright.com`
3. Leave Vercel Authentication **off** for the production custom domain so the community can open it without SSO

There is a second Git-connected project, `sietchwright-planner`. Keep one. Disconnect git on the extra project so every push does not ship twice.

## CI

GitHub Actions workflow `.github/workflows/ci.yml` must stay green. `main` requires the `check` status. Vercel does not wait on Actions, so do not push a red `main`.
