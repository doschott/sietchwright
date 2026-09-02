# UI

The 3D yard is the product. Menus exist to raise and modify a sietch, then get out of the way.

## Problem we shipped against

Three scrolling regions (questionnaire dock, CHOAM kit, inspector) sat on the canvas at once. On a 1440×900 desktop the dock hid the vehicle answers and covered the building after a raise. There was no zoom control besides the mouse wheel.

## Rules

1. **One overlay at a time.** Plan, kit, or inspector. Never all three.
2. **Thin chrome always.** Top bar (cameras, share) and bottom dock (Plan, Kit, Raise).
3. **Raise closes the plan sheet** so you see what you built.
4. **Zoom is first-class.** `+` `-` Fit buttons, keys `+` `-` `F`, mouse wheel still works.
5. **Hide menus** with `H` when you want a screenshot or a clear orbit.

## Layout

| Surface | Desktop | Phone |
|---------|---------|-------|
| Plan sheet | Right column, ~24rem | Bottom sheet, max 58vh |
| CHOAM kit | Left column, ~18rem | Bottom sheet, max 58vh |
| Inspector | Right column | Bottom sheet, or compact bar if a piece is selected |
| Zoom | Cluster on the yard | Same |
| Bottom dock | Always | Always |

## Plan sheet steps

1. Pad, stories, shape, presets
2. People door, vehicle, garage facing
3. Extras (airlock, cistern, workshop, loft, lookout)

Raise is always on the bottom dock, so you can raise the defaults without finishing every step.

## Personas we designed for

**New player, not an architect.** Wants: questions in English, a building they can see, a bill of named pieces. Pain: overlapping menus. Fix: plan sheet + raise + hide chrome.

**Veteran builder.** Wants: kit placement, rotate/delete, granite bill, garage facing. Pain: inspector buried. Fix: inspector as the only right-hand panel, kit as the only left-hand panel.

**Phone / tablet.** Wants: big taps, the yard still visible. Pain: 42vh dock plus two side columns. Fix: one bottom sheet, dock stays one row.

**Keyboard / screen reader.** Wants: labeled buttons, no pointer-only zoom. Fix: `+` `-` `F` `H` `B` `K` Esc, aria-labels on zoom and overlays.

**Contributor.** Wants: a green CI, a map of the repo, issue templates. Fix: this docs set plus `.github/`.

## What we will not do

- A free-text LLM prompt that places pieces
- Accounts
- Covering the yard with three scroll areas again
