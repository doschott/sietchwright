# Contributing to Sietchwright

Thanks for helping. You do not need to be an architect or a Dune lore expert. If you can raise a yard, find a bug, or name a CHOAM piece more accurately, that is enough.

## Code of conduct

Be kind. Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Harassment is not tolerated.

## Setup

Node 22+ (see `.nvmrc`).

```bash
git clone https://github.com/doschott/sietchwright.git
cd sietchwright
npm ci
npm run dev
```

Open http://localhost:5173.

## Checks before a PR

```bash
npm test
npm run typecheck
npm run build
```

CI runs the same commands on every push and pull request. Please keep `main` green.

The builder tests in `src/lib/build-from-spec.test.ts` are the contract: a custom spec must place the people door and garage on the walls the answers named.

## How we work

1. Open an issue first for anything larger than a typo. Use the bug or feature template.
2. Fork, or push a branch on a clone if you have write access: `feat/short-name` or `fix/short-name`.
3. Keep PRs small. One idea per PR.
4. Fill in the PR template. Include a screenshot if you changed the UI.
5. Wait for CI. Maintainers review when they can.

## Product rules

- Geometry is deterministic (`buildFromSpec`). Do not send a free-text prompt to an LLM to place pieces.
- Keep the questionnaire as the source of truth. If a combo is impossible (garage on a 1-story pad), disable it in the UI and explain why.
- Only one overlay panel at a time. Do not bring back stacked scrolling menus over the yard.
- No accounts or database in the default app. Plans live in `localStorage`.
- Share links always use `https://sietchwright.com` (`src/lib/site.ts`).
- In-game names and granite should cite a source (awakening.wiki, Funcom notes, or an in-client screenshot). Guessing is worse than a documented unknown.
- Copy is human. Hyphens are fine. Do not use em dashes.

## Project map

```
src/components/chrome/   UI chrome (plan sheet, kit, inspector, zoom)
src/components/scene/    React Three Fiber yard
src/lib/spec.ts          Questionnaire model
src/lib/build-from-spec.ts  Deterministic raise
src/lib/pieces.ts        CHOAM Facility piece table
src/lib/store.ts         Zustand yard state
docs/                    Architecture, CHOAM research, UI, keyboard
```

## Good first contributions

- Confirm Facility **Garage Door** cell width and height in-game and attach a screenshot.
- Add a preset that matches a popular community footprint (cite the video or post).
- Keyboard / screen-reader gaps.
- Tests for a spec combo that currently has none.

## License

By contributing you agree your work is MIT, same as the rest of the repo.
