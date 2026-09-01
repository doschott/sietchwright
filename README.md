# Sietchwright

In-browser **Dune: Awakening** CHOAM-kit 3D base planner.

Answer a short questionnaire (pad size, stories, shape, door facing, vehicle bay). Sietchwright raises a schematic you can orbit, inspect, and share — foundations, walls, two-high garage doors, stairs, hatches, the whole standard set.

![Sietchwright raising a CHOAM keep](docs/preview.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/doschott/sietchwright)

**Not affiliated with Funcom, Legendary, or the Herbert estate.** Dune, Dune: Awakening, CHOAM, and related names belong to their owners. This is a fan planning tool.

## What it does

- **Questions, not a prompt.** Size, stories, box / courtyard / hangar / watchtower, people door, vehicle, extras.
- **The yard follows those answers.** People door on the wall you named. Two-cell-wide, two-story garage on the wall you named, with a clear bay behind it.
- **CHOAM kit.** Foundation, wall, door, window, passageway, garage door, stairs, hatch, railing, and the rest — granite bill included.
- **Iso / top / south cameras.** Place extra pieces by hand after a raise.
- **Stays in your browser.** No account. The last yard is saved in `localStorage`.
- **Share on X.** Tweet the name, piece count, and brief.

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19
- Three.js via [React Three Fiber](https://r3f.docs.pmnd.rs/) + drei
- Tailwind v4, Zustand
- Builds to [Vercel](https://vercel.com) through Nitro’s `vercel` preset

## Run locally

Node 22+.

```bash
npm ci
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

```bash
npm test          # spec builder checks
npm run typecheck
npm run build     # production client + Vercel output
```

## Deploy on Vercel

This repo is ready for Vercel Git deploys. Fastest path:

1. Open [Deploy with Vercel](https://vercel.com/new/clone?repository-url=https://github.com/doschott/sietchwright), or Import `doschott/sietchwright` from the Vercel dashboard
2. Build command: `npm run build` (already in `vercel.json`)
3. No environment variables. Auth and database stay off.

Nitro writes `.vercel/output` during `vite build`. Vercel serves that. Every push to `main` can ship a production build once the project is linked.

If the Vercel GitHub App is set to selected repositories, add `sietchwright` under GitHub → Settings → Applications → Vercel → Repository access.

## CHOAM notes

- Grid is square. Rotation `0` is south (`+Z`), `90` east, `180` north, `270` west.
- **Garage door** is two cells along the wall and two stories tall. A 1-story request with a vehicle is raised to two stories so the door fits.
- Courtyard leaves an open inner court. Hangar keeps a double-height bay.

## Contributing

Issues and PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Daniel Schott
