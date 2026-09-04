# Architecture

Sietchwright is a single-page planner. The visitor never needs an account. A raise is a pure function from a questionnaire (`BriefSpec`) to a list of placed CHOAM pieces (`Plan`).

## Runtime

```
Browser
  AppShell
    Viewport (React Three Fiber Canvas)
    Chrome (one overlay at a time)
  Zustand store (src/lib/store.ts)
  localStorage key sietchwright:v3
```

There is no production API. Vercel serves the static client plus Nitro's `vercel` output from `vite build`.

## Raise path

1. UI writes `spec` through `setSpec` / `applySpec` (`src/lib/spec.ts` constraints).
2. `raiseFromSpec` calls `buildFromSpec(spec)` (`src/lib/build-from-spec.ts`).
3. The plan is normalized, named, and stored.
4. Overlay closes. Camera fits the new bounds.

`specChecks` is the honesty bar: people door on the named face, garage on the named face, stories, courtyard void, and so on. Unit tests in `src/lib/build-from-spec.test.ts` lock that contract.

## Overlay state

`overlay`: `none` | `brief` | `kit` | `inspect`

Opening one closes the others. Selecting a piece opens inspect. Raising sets overlay to `none` so the building is visible.

Zoom is a pulse (`zoomBy('in' | 'out' | 'fit')`) consumed by `CameraRig` in `src/components/scene/YardScene.tsx`. OrbitControls still handles mouse-wheel zoom between pulses.

## Files

| Path | Role |
|------|------|
| `src/lib/spec.ts` | Questions, presets, constraints. Story cap 5 without staking. Storage type. |
| `src/lib/vehicles.ts` | Stall sizes and fleet packing |
| `src/lib/stations.ts` | Starter shops and storage crate packing |
| `src/lib/support.ts` | Corner Column posts and interior Center Column grid |
| `src/lib/cutaway.ts` | Inside view: hide roof, ghost outer walls and floors. Roof vs floor hatch. |
| `src/lib/build-from-spec.ts` | Deterministic geometry |
| `src/lib/pieces.ts` | CHOAM Facility table |
| `src/lib/plan.ts` | Plan, bounds, piece counts |
| `src/lib/site.ts` | Canonical URL |
| `src/lib/camera.ts` | Frame, zoom, and compass yaw |
| `src/lib/storage.ts` | localStorage v3 |
| `.github/dependabot.yml` | Weekly npm patch/minor groups; ignore TS and `@types/node` majors |
| `src/components/chrome/` | Plan sheet, kit, inspector, dock, zoom |
| `src/components/scene/` | 3D yard |

## Auth

There is no account system. The Grok template auth, app-data, and database files were removed. Do not add Better Auth or a database to the public planner.

## Deploy

- GitHub `main` → Vercel project `sietchwright`
- Production host: `https://sietchwright.com`
- `vercel.json` sets `npm ci` and `npm run build`
- GitHub Actions CI must stay green; it does not gate Vercel by itself, so do not push a red `main`
