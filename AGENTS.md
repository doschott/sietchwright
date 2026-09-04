# Agent notes (Sietchwright)

This file is for humans and coding agents working in this repo.

- Node 22+. `npm ci`, `npm test`, `npm run typecheck`, `npm run build`.
- Do not stack Plan + Kit + Inspector over the 3D yard. One overlay at a time (`useYard.overlay`).
- `buildFromSpec` is deterministic. Do not call an LLM to place pieces.
- Vehicle stalls and fleet packing live in `src/lib/vehicles.ts`. Cite `docs/choam.md` when you change footprints. `thopter` in old saves is scout. Bike shares buggy. Assault is 3-high pentashield.
- Share links: `src/lib/site.ts` (`https://sietchwright.com`), never localhost.
- Granite and in-game names: `src/lib/pieces.ts`. Cite wiki or in-client evidence when you change them.
- No accounts. Do not add Better Auth, a database, or sign-in to the public planner.
- Copy: no em dashes. Hyphens are fine.
- Fan project. Do not claim Funcom affiliation.
