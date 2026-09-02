# Cyber-defense review: public `doschott/sietchwright`

**Date:** 2026-09-02  
**Function:** security (cyber-defense pass on a public GitHub repo)  
**Scope:** `https://github.com/doschott/sietchwright` (clone `~/sietchwright`, origin `main` at review start `45e166f`)  
**Not in scope:** scanning other people's networks; dumping vaults; rotating xAI broker keys we do not own.

Honesty bar: claim = evidence. No secrets are repeated in this file.

## Verdict

**No enterprise-os, edos, Bitwarden, Discord, droplet, or sister-product secrets in this repo.**  
**No malware, native binaries, or npm install-time scripts that could infect a visitor or a contributor.**  
**Users get a static 3D planner in the browser.** Plans stay in `localStorage` on their machine.

One Grok-template leftover was neutralized on this pass (preview OAuth client secret in source; auth now fail-closed). Git history still contains the old template string. That string is a low-privilege `*.grok-sandbox.com` preview client, not an enterprise credential. We did not rewrite public history.

## What was scanned

| Check | Evidence |
|-------|----------|
| Tracked secret-like files | Only `.env.example` (comments). `.gitignore` drops `.env`, `.vercel`, `.grok` |
| GitHub secret scanning (open) | Empty list |
| GitHub Dependabot alerts | `0` |
| `npm audit` (prod + dev) | 0 vulnerabilities |
| package-lock lifecycle scripts (`preinstall` / `install` / `postinstall`) | None |
| Production JS bundles | No `grok_preview`, no preview secret, no `auth.grok.me`, no `better-auth` |
| Live `/api/auth`, `/api/rtc` | HTTP 404 (SPA HTML). Those APIs are not mounted |
| Enterprise names (`edos`, `enterprise-os`, `bitwarden`, `dosai.net`, `openclaw`, `poketrader`) | No matches in tracked source |
| Emails | `doschott@gmail.com` in CoC/SECURITY (intentional). Tests use `example.com` |
| Images (`og.jpg`, `x-banner.jpg`, `icon-180.png`, `favicon.svg`, `docs/preview.png`) | Real PNG/JPEG/SVG. No `<script>`, no embedded URLs besides the SVG namespace |
| CI | checkout + setup-node + `npm ci/test/typecheck/build`. No `pull_request_target`, no repo secrets |
| Client XSS | React text nodes; `JSON.parse` of `localStorage` is try/catch and then typed `parseSpec` |
| postMessage bridge | Activates only when framed by an allowlisted Grok parent; production is top-level so it noops |

## Findings

### 1. Grok preview OAuth client secret in source (fixed in HEAD)

- **Severity:** low for this company; medium as OSS hygiene
- **Category:** hardcoded credential (template leftover)
- **Location:** `src/lib/auth/preview.ts` (was a 64-char hex `PREVIEW_CLIENT_SECRET`)
- **Description:** Grok app-builder template bakes a shared live-preview OAuth client for `*.grok-sandbox.com`. It is not a Bitwarden item, not an edos key, and the live site never shipped it in the browser bundle.
- **Impact:** Anyone cloning the old commit could replay a **preview-only** client against Grok's sandbox broker. They could not sign into enterprise-os, Vercel, GitHub, or sibling products with it.
- **Remediation:** HEAD now ships an empty secret. Auth is fail-closed unless `VITE_AUTH_ENABLED=true` at build time (`.env.production`). Client bundle on www.sietchwright.com did not contain the old value.
- **Residual:** git history of the initial public commit still has the template string. Force-pushing history was refused (branch protection; Vercel already built from those SHAs). Rotate at the Grok broker if xAI still uses that shared preview client.

### 2. Auth fail-open if env unset (fixed in HEAD)

- **Severity:** low
- **Location:** `src/lib/auth/client.ts` (`authEnabled` was `!== "false"`)
- **Description:** Unset `VITE_AUTH_ENABLED` used to mean "auth on". The planner UI does not render sign-in, and `/api/auth` 404s, so visitors were not actually federating. Still the wrong default for a public fan tool.
- **Remediation:** `authEnabled` is now `=== "true"`. Server treats anything other than `true` as disabled. `.env.production` sets `false`.

### 3. Missing browser isolation headers (fixed in HEAD)

- **Severity:** informational
- **Location:** production responses had HSTS only
- **Remediation:** `vercel.json` now sends `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

## User-facing malware / virus question

Visitors loading https://sietchwright.com (or www) download HTML, CSS, JS, fonts from Google Fonts, and WebGL. There is no installer, no native addon, no `eval` of remote code, no npm lifecycle script, and no camera/mic permission. A visitor cannot "catch a virus" from this site in the ordinary sense. They can still be phished by a **lookalike domain** that is not this repo; that is out of git's control.

Contributors running `npm ci` pull from the npm registry at the lockfile SHAs. Keep Dependabot on. Do not add `postinstall` that curls the network.

## Not found (and we looked)

- Vercel tokens, GitHub PATs, SSH keys, cloud keys
- Discord webhooks, Stripe live keys, database URLs
- Internal hostnames, droplet IPs, UniFi, Sentinel mailbox contents
- Executable binaries or office macros
- Hidden `.grok/` project config (gitignored)

## Residuals

| Item | Status |
|------|--------|
| Old preview secret in git history | Present; low privilege; no history rewrite |
| Duplicate Vercel git project `sietchwright-planner` | Still connected; extra attack surface is another deploy, not a secret |
| No Content-Security-Policy yet | Left off; a tight CSP can break Three.js + Google Fonts without a dedicated pass |
| Grok template auth/pglite/pg still in the tree | Dead for production (APIs 404); keep compiling, do not turn on |

## Department close

Cyber-defense: this public repo does not leak the enterprise, does not infect visitors, and the one template credential in source is emptied on HEAD.
