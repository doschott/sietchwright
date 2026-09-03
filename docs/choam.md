# CHOAM Facility notes (planner)

Fan research for Sietchwright. Not affiliated with Funcom. Patch mix is launch through Chapter 3 (1.3.x). Where sources disagree, this file says so.

Primary sources:

- [Funcom: Building in Dune: Awakening](https://duneawakening.com/news/building-in-dune-awakening-claim-your-piece-of-arrakis/)
- [Chapter 3 patch notes](https://duneawakening.com/news/dune-awakening-chapter-3-patch-notes/)
- [awakening.wiki CHOAM Facility Set](https://awakening.wiki/CHOAM_Facility_Set)
- [awakening.wiki CHOAM Shelter Set](https://awakening.wiki/CHOAM_Shelter_Set)

## Which kit

Sietchwright models **CHOAM Facility** (Advanced Construction Kit), not CHOAM Shelter (Basic Construction Kit) and not Atreides/Harkonnen cosmetics. Sets snap to the same grid, so a Facility schematic can be filled with another set in-game.

Furniture CHOAM packs sold for Solari are decor, not structure.

## Grid

- Square cells. Walls sit on **cell edges**.
- Rotation in this app: `0` south (`+Z`), `90` east, `180` north, `270` west.
- Stories are **wall tiles**. A garage door spans two wall tiles.

## Pieces we emit

Foundation, Floor, Wall, Half Wall, Door, Window, Passageway, Garage Door, Stairs, Ramp, Rooftop, Hatch, Center Column, Corner Column, Railing, Ladder.

**Wall 2** is a visual variant of Wall, same size. The planner currently emits Wall. A later PR can alternate Wall / Wall 2 for looks.

## Garage Door (working model)

Funcom added "Large Garage Doors" to CHOAM Facility in 1.3.0. They have not published width × height in cells.

Sietchwright treats Facility **Garage Door** as **2 cells wide × 2 stories tall**. That matches the community 2×2 request that existed before 1.3, and it is why a 1-story vehicle spec is bumped to two stories.

**Please measure in-client** and open an issue with a screenshot if that is wrong. Do not copy the Dune Man 2×3 garage onto Facility without evidence.

Launch **Wide Door** is a different piece: two cells wide, one story. Buggies historically squeeze through CHOAM Wide Door and clip the lintel. The planner uses Garage Door for vehicle bays.

## Granite (Facility wiki)

| Piece | Granite |
|-------|---------|
| Foundation | 15 |
| Wall, Window, Passageway, Floor, Rooftop, Stairs, Ramp, Half Wall, columns, railing, ladder | 10 |
| Door, Hatch | 17 |
| Garage Door / Wide Door | 30 (wiki). Some databases say 20. We follow the wiki until measured. |

## Footprints we name

| Id | Cells | Notes |
|----|-------|--------|
| starter | 4×4 | Tight. Tutorial in-game is 2×2; a real basic fief is closer to 5×5. |
| compact | 6×5 | Default. |
| keep | 7×7 | Courtyard works here. |
| compound | 9×6 | Scout hangars, or a 'thopter + buggy + bike row. |
| advanced | 10×10 | Advanced Sub-Fief. Carrier + crawler + smaller craft. |

Basic Sub-Fief usable pad is about **5×5** once walls eat a cell. Advanced Sub-Fief is **10×10** foundations and about **12** wall-tiles high before staking ([awakening.wiki](https://awakening.wiki/Advanced_Sub-Fief_Console)).

## Staking units (base extenders)

Only an **Advanced Sub-Fief Console** takes staking units. Funcom's Communinet Signal #7 and player-measured bases agree:

- **5 horizontal** staking units max
- **5 vertical** staking units max
- **10 total** (you cannot spend all 10 in one direction)

Each horizontal unit adds another **10×10** plot on one face of the claim. Each vertical unit raises the whole claim (about 5 wall-tiles up and some down). Taxes were removed in 1.3; the 5+5 cap remains.

Sietchwright keeps this simple:

- Questions: how many **wide** (0–5) and how many **high** (0–5).
- Wide grows the pad by 10 cells along the garage wall (or east-west if there is no garage).
- High raises the story cap: `3 + high`, max 8. We do not emit 12–40 wall-tiles of empty air.
- Any staking unit bumps the pad to Advanced 10×10.

We do not simulate underground, worms, or snapping onto POIs.

## Vehicle bays (player-measured, not Funcom tables)

Door size is not parking size. Leave walk-around unless you want a coffin garage.

| Vehicle | Tight / in-game | Planner stall (walk-around) | Height |
|---------|-----------------|-----------------------------|--------|
| Sandbike | 1×1 to 1×2 | 2×2 (solo hangar still 4×3) | 1 wall |
| Buggy | 2×2 (1×2 is tight) | 3×3 | 1.5–2 walls |
| Scout ornithopter | 2×3 to 3×3 | 4×4 (solo hangar still 5×4) | 2 walls |
| Sandcrawler | 3×4 well | 4×4 dedicated stall | 2 walls |
| Carrier ornithopter | 5×6 min, 6×10 proper; some builders use 4×7 | 6×6 hall | 3 walls (we still emit a two-high garage door) |

Sources: [awakening.wiki Carrier Ornithopter](https://awakening.wiki/Carrier_Ornithopter) (5×6 min / 6×10 proper), community hangar guides (crawler 3×4 well, scout 2×3, buggy 2×2), and the existing CHOAM notes above.

**Fleet packing**

- Bike, buggy, and scout each get their own stall when no carrier is selected. A 'thopter + buggy + bike row is 9×4 and fits Compound 9×6.
- A **carrier hall is 6×6**. Scout, buggy, and bike park in that hall (they fit under/beside a landed carrier).
- A **crawler always gets its own 4×4 well**. It does not share the carrier pad.
- Carrier + crawler + the three small craft is a 10×6 hangar on an Advanced 10×10 pad, with living cells behind the halls.

Sietchwright's solo thopter bay is sized for a **scout** plus walk-around. Pick Carrier when you fly a carryall. The two-high CHOAM Garage Door is still the opening we emit; leave the carrier hall open to the sky or add a third story in-game.

## Airlock, water, power

- **Airlock** is not a kit piece. It is a door + passageway vestibule so the living volume stays enclosed when the garage is open.
- **Cisterns** go inside. **Windtraps** need sky; they fail if Enclosed/Watersealed. The planner's cistern extra is a hatch, not a windtrap.
- Power, taxes, and Deep Desert wipes are out of scope. Taxes were removed in 1.3.

## Competitors

TroubleChute, dunecalc, VectorMind, and various sheets count mats and power. None raise a 3D CHOAM schematic from a questionnaire. Sietchwright is complementary.

## Uncertainty

| Claim | Confidence |
|-------|------------|
| Facility Garage Door = 2×2 | Medium. Verify in-client. |
| Wide Door = 2×1 | High |
| Granite 30 for garage | Wiki preferred over gaming.tools 20 |
| Basic fief ~5×5 usable | High |
| Assault/carrier hangar sizes | Medium |

If you change planner geometry from this file, update the tests and cite the new source.
