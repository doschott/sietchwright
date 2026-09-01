# Contributing

Thanks for helping with Sietchwright.

## Setup

Node 22+.

```bash
npm ci
npm run dev
```

## Checks before a PR

```bash
npm test
npm run typecheck
npm run build
```

The builder tests in `src/lib/build-from-spec.test.ts` are the contract: a custom spec must place the people door and garage on the walls the answers named.

## Notes

- Geometry is deterministic (`buildFromSpec`). Do not send a free-text prompt to an LLM to place pieces.
- Keep the questionnaire as the source of truth. If a combo is impossible (garage on a 1-story pad), disable it in the UI and explain why.
- No accounts or database in the default app. Plans live in `localStorage`.
