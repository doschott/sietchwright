# Structural support, pad size, and Inside view

Research for the 2026-09-04 raise-model pass. Fan notes, not Funcom tables.

## What Daniel reported

1. Support beams on the four corners are needed.
2. The raise does not keep the pad size he picked.
3. Inside view only shows the top two levels.

These hit every pad size.

## Support (in-game)

Sources: [CHOAM Facility Set](https://awakening.wiki/CHOAM_Facility_Set), community building guides (corner-column support, “nine steps” from a load-bearing foundation).

| Piece | What it actually supports |
|-------|---------------------------|
| Foundation | Load-bearing. Horizontal span about nine cells before “insufficient stability.” Straight up from a foundation is a load-bearing wall and does not eat that span. |
| Wall | Tiles on either side of the wall. |
| Center Column | Only the cell directly above. Fat post in the middle of a cell. |
| Corner Column | All floor tiles that touch that corner. Can sit inside walls. This is the piece people put on building corners. |
| Pillar bottom/middle/top | Thin decorative/support stack. Not required for a square CHOAM box. |

Sietchwright was placing **Center Column** in the four corner *cells*, unrotated, so a fat post sat in the room instead of a beam in the wall corner.

### Planner rule

- Every story gets a **Corner Column** on each outer corner of the pad, rotated to that outer vertex (SW, SE, NE, NW). Those four stay even when the corner cell is a hangar.
- Pads 8×8 and larger also get a **Center Column** on the interior grid every 5 cells (conservative vs the ~9-cell foundation span) so hangar halls and 10×10 keeps are not a hollow box.
- Do not put Center Columns in the four outer corners.
- Do not put Center Columns in courtyard open sky or inside a hangar hall volume (the stall rect for that story). Compact 6×5 and Compound 9×6 stay corner-only.

## Pad size

`applyConstraints` used to upgrade the pad when the fleet math wanted more cells (`minSizeForFleet`). The plan sheet also greyed out sizes that failed `sizeFitsFleet`. That is why a chosen Starter / Keep / Compact jumped to a bigger pad.

### Planner rule

- The pad the player ticks is the pad we raise, except: courtyard still needs Compact (open court math), tower still will not sit on Compound 9×6, staking still needs Advanced 10×10.
- Fleet packing already clamps to `wrapAlong` / `wrapDepth`. Keep clamping. Warn in the notes. Do not silently grow the fief.

## Inside view

Cutaway hides the roof and ghosts outer walls. Floor slabs stay opaque. From iso you look down onto the top deck, so a five-story raise reads as the top one or two volumes (a double-height hangar has no slab in the void, which is why “two” levels show).

### Planner rule

- In Inside view, **ghost every Floor** the same way we ghost outer walls. Keep stairs, hatches, corner columns, and shop markers solid.
- Still hide rooftops and rails.
- Do not add a fourth plan-sheet step.

## Stop doing

- Auto-upgrading pad size “to be helpful.”
- Center Column as a corner beam.
- Opaque upper floors in Inside view.
