# Changelog

All notable changes to Sietchwright are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Fixed

- Four outer corners now use CHOAM **Corner Columns** (rotated to the outer vertex) on every story, not Center Columns in the room
- The pad you pick is the pad we raise. Fleet packing clamps into it instead of upgrading the fief
- Inside view ghosts floor slabs so you can see every story, not only the top two
- Inside view applies ghost opacity as material props (walls and garage doors included). A Three.js `instanceof Mesh` walk did not run in the live bundle, so the roof hid but the envelope stayed solid
- `package-lock.json` is generated with npm 10.9.8 (Node 22) so GitHub Actions `npm ci` finds the optional `lru-cache@11.5.2` peer. npm 11 on Node 26 omitted that entry and turned CI red.

### Added

- Starter 4×4 vehicle hangar is a real option. Compact pads stack a garage under the fly-in
- Stories 1–5 with no staking units. Vertical staking still raises the cap toward 8
- Scout ornithopter (two high, garage) and assault ornithopter (three high, pentashield) as separate vehicles. Old `thopter` saves are scout
- Sandbike shares a buggy bay. Scout may share an assault hall
- Storage question on step 3: none, chests, small containers, storage containers, medium
- Starter hangar preset: 4×4, five stories, buggy garage, scout above, chests, starter shops
- Placeable markers for chests and starter fabs/refineries on their own deck
- Windows on every story so Inside view reads as stacked floors

### Changed

- Workshop extra is labeled Starter shops (fabricator, vehicle, weapons, survival, garment, small chemical, small ore)
- Hangar living is vertical. Starter is no longer greyed out for Vehicle hangar
- GitHub Actions `checkout` and `setup-node` are v7
- Dependabot groups npm patch/minor updates and ignores TypeScript and `@types/node` majors

### Removed

- Grok template auth, app-data, and database leftover (`src/lib/auth`, `src/lib/app-data`, `src/lib/db.ts`)
- Unused template packages (Better Auth, jose, kysely, pglite, pg, react-table, unused Radix/form/chart kits)

### Added (earlier this week)

- Plan step 1: how many staking units wide and high (0-5 each, Advanced fief, 10 total)
- Plan step 2: how many of each parked vehicle (1-4), with extra garages when the count is more than one
- Crawler drive-in is a 2×2 Garage Door. Carrier fly-in is a vertical pentashield, stacked above the crawler when both are selected
- North compass under the Sietchwright name card. It rotates with the camera so N is yard north (−Z)
- Inside view (button + `I`): hide the roof and ghost outer walls so builders can see rooms and hangar halls
- Plan the Sietch step 2 is a multi-select for parked vehicles: sandbike, buggy, ornithopter, carrier, crawler
- Advanced 10×10 pad. A carrier hall (6×6) plus a crawler well (4×4) plus living cells fit an advanced sub-fief
- Fleet hangar packing: 'thopter + buggy + bike get three stalls on Compound 9×6; a carrier nests the smaller craft
- Advanced fleet hangar preset

### Security

- Removed the Grok live-preview OAuth client secret from HEAD
- Auth is fail-closed unless `VITE_AUTH_ENABLED=true` at build time
- Production response headers: nosniff, referrer-policy, DENY framing, no camera/mic

## [0.2.0] - 2026-09-01

### Added

- One-panel menu system: Plan, CHOAM kit, and inspector no longer stack over the yard
- Three-step plan sheet (pad, doors, extras) with presets on step 1
- Thin bottom dock for Plan / Kit / Raise
- Zoom in, zoom out, and fit-yard controls, plus `+` `-` `F` keys
- Hide menus (`H`) for a clear look at the raised sietch
- Canonical share URL `https://sietchwright.com` on the Share on X button
- CHOAM Facility granite table aligned to awakening.wiki
- Open-source contributor kit: code of conduct, security policy, issue and PR templates, Dependabot, CODEOWNERS, architecture and CHOAM docs

### Fixed

- Typecheck failed on a missing Grok-template `scripts/sign-out-plan.mjs`
- Questionnaire overflow hid vehicle options and covered the 3D build

### Changed

- After a raise, chrome recedes so the schematic stays visible
- `package.json` homepage points at sietchwright.com

## [0.1.0] - 2026-09-01

### Added

- Public MIT repo, questionnaire raise, CHOAM kit, iso/top/south cameras, localStorage save, Vercel deploy button
