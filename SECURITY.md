# Security policy

Sietchwright is a static in-browser planner. There is no user account and no server database in the default app. Plans live in `localStorage` on the visitor's machine. There is no native installer and no camera or microphone access.

Do not commit `.env` files, tokens, or OAuth secrets. There is no sign-in.

## Supported versions

The `main` branch and the production site at [sietchwright.com](https://sietchwright.com) are supported.

## What to report

Please report:

- Cross-site scripting in the planner UI
- Secrets accidentally committed to git
- Dependency issues with a realistic exploit path
- Anything that could steal or overwrite another origin's data

Please do **not** open a public issue for a vulnerability.

## How to report

Use GitHub's **private vulnerability reporting** on this repository (Security tab), or email doschott@gmail.com with:

1. A short description
2. Steps to reproduce
3. Impact
4. A patch if you have one

You should get an acknowledgement within a few days.

## What we will not treat as a vulnerability

- "I can write to my own localStorage"
- Game balance or CHOAM granite numbers that disagree with a wiki page (open a normal issue)
- Missing auth (there is no sign-in on purpose)
