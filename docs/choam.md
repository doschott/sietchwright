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
| compound | 9×6 | Hangars. |

Basic Sub-Fief usable pad is about **5×5** once walls eat a cell. Advanced Sub-Fief is on the order of **10×10** with staking. We do not simulate staking or worms.

## Vehicle bays (player-measured, not Funcom tables)

Door size is not parking size. Leave walk-around unless you want a coffin garage.

| Vehicle | Comfortable empty floor | Height |
|---------|-------------------------|--------|
| Sandbike | 1×2 | 1 wall |
| Buggy | 2×2 | 1.5–2 walls |
| Scout ornithopter | 2×3 to 3×3 | 2 walls |
| Assault / carrier | larger than our thopter bay | 2+ walls |

Sietchwright's thopter bay is sized for a **scout** plus walk-around, not a carrier.

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
