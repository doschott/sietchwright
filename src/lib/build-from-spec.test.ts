import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFromSpec, specChecks } from "./build-from-spec.ts";
import { FACE_ROT, DEFAULT_SPEC, PRESETS, parseSpec, type BriefSpec } from "./spec.ts";
import { boundsOf } from "./plan.ts";

function assertChecks(spec: BriefSpec, label: string) {
  const plan = buildFromSpec(spec);
  const checks = specChecks(plan, spec);
  const failed = checks.filter((c) => !c.ok);
  assert.equal(
    failed.length,
    0,
    `${label} failed: ${failed.map((c) => c.label).join(", ")} (${plan.pieces.length} pcs, ${plan.name})`,
  );
  assert.ok(plan.pieces.length >= 12, `${label} too few pieces: ${plan.pieces.length}`);
}

describe("buildFromSpec", () => {
  for (const p of PRESETS) {
    it(`preset ${p.id} matches its answers`, () => {
      assertChecks(p.spec, p.id);
    });
  }

  it("default compact box matches", () => {
    assertChecks(DEFAULT_SPEC, "default");
  });

  it("custom: 3-story keep, east door, north buggy garage, all extras", () => {
    const spec: BriefSpec = {
      size: "keep",
      stories: 3,
      layout: "box",
      entrance: "east",
      vehicle: "buggy",
      bay: "north",
      airlock: true,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: true,
    };
    assertChecks(spec, "custom-keep-buggy");
    const plan = buildFromSpec(spec);
    const door = plan.pieces.find((p) => p.type === "door");
    const garage = plan.pieces.find((p) => p.type === "garage_door");
    const b = boundsOf(plan);
    assert.ok(door);
    assert.equal(door!.rot, FACE_ROT.east);
    assert.equal(door!.x, b.maxX);
    assert.ok(garage);
    assert.equal(garage!.rot, FACE_ROT.north);
    assert.equal(garage!.z, b.minZ);
  });

  it("custom: 1-story starter, west door, no extras except cistern", () => {
    const spec: BriefSpec = {
      size: "starter",
      stories: 1,
      layout: "box",
      entrance: "west",
      vehicle: "none",
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: false,
      loft: false,
      lookout: false,
    };
    assertChecks(spec, "custom-starter-west");
    const plan = buildFromSpec(spec);
    const door = plan.pieces.find((p) => p.type === "door");
    const b = boundsOf(plan);
    assert.ok(door);
    assert.equal(door!.rot, FACE_ROT.west);
    assert.equal(door!.x, b.minX);
    assert.equal(b.maxY, 0);
    assert.equal(plan.pieces.some((p) => p.type === "garage_door"), false);
  });

  it("custom: hangar west bay, south people door", () => {
    const spec: BriefSpec = {
      size: "compound",
      stories: 2,
      layout: "hangar",
      entrance: "south",
      vehicle: "bike",
      bay: "west",
      airlock: true,
      cistern: false,
      workshop: true,
      loft: true,
      lookout: false,
    };
    assertChecks(spec, "custom-hangar-west");
    const plan = buildFromSpec(spec);
    const door = plan.pieces.find((p) => p.type === "door");
    const garage = plan.pieces.find((p) => p.type === "garage_door");
    const b = boundsOf(plan);
    assert.equal(door!.rot, FACE_ROT.south);
    assert.equal(door!.z, b.maxZ);
    assert.equal(garage!.rot, FACE_ROT.west);
    assert.equal(garage!.x, b.minX);
  });

  it("east door and west door are actually different", () => {
    const base: BriefSpec = {
      size: "compact",
      stories: 2,
      layout: "box",
      entrance: "east",
      vehicle: "none",
      bay: "south",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    const east = buildFromSpec(base);
    const west = buildFromSpec({ ...base, entrance: "west" });
    const ed = east.pieces.find((p) => p.type === "door")!;
    const wd = west.pieces.find((p) => p.type === "door")!;
    assert.equal(ed.rot, 90);
    assert.equal(wd.rot, 270);
    assert.ok(ed.x !== wd.x);
  });

  it("north garage and south garage face opposite walls", () => {
    const base: BriefSpec = {
      size: "keep",
      stories: 2,
      layout: "box",
      entrance: "east",
      vehicle: "buggy",
      bay: "north",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    const north = buildFromSpec(base);
    const south = buildFromSpec({ ...base, bay: "south" });
    const ng = north.pieces.find((p) => p.type === "garage_door")!;
    const sg = south.pieces.find((p) => p.type === "garage_door")!;
    assert.equal(ng.rot, 180);
    assert.equal(sg.rot, 0);
    const nb = boundsOf(north);
    const sb = boundsOf(south);
    assert.equal(ng.z, nb.minZ);
    assert.equal(sg.z, sb.maxZ);
  });

  it("courtyard is hollow, box is not", () => {
    const base: BriefSpec = {
      size: "keep",
      stories: 2,
      layout: "courtyard",
      entrance: "south",
      vehicle: "none",
      bay: "south",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    const court = buildFromSpec(base);
    const box = buildFromSpec({ ...base, layout: "box" });
    const courtChecks = specChecks(court, base);
    assert.equal(courtChecks.find((c) => c.label === "Open courtyard")?.ok, true);
    const b = boundsOf(court);
    const roofs = new Set(
      court.pieces
        .filter((p) => p.type === "rooftop" || p.type === "floor")
        .map((p) => `${p.x},${p.z}`),
    );
    const voidCell = court.pieces.find(
      (p) =>
        p.type === "foundation" &&
        p.x > b.minX &&
        p.x < b.maxX &&
        p.z > b.minZ &&
        p.z < b.maxZ &&
        !roofs.has(`${p.x},${p.z}`),
    );
    assert.ok(voidCell, "courtyard should have an inner cell with no floor/roof");
    const boxRoofs = new Set(
      box.pieces
        .filter((p) => p.type === "rooftop" || p.type === "floor")
        .map((p) => `${p.x},${p.z}`),
    );
    const boxVoid = box.pieces.find(
      (p) =>
        p.type === "foundation" &&
        p.x > 0 &&
        p.x < 6 &&
        p.z > 0 &&
        p.z < 6 &&
        !boxRoofs.has(`${p.x},${p.z}`),
    );
    assert.equal(boxVoid, undefined);
  });

  it("vehicle on 1-story request is bumped to 2 and still gets a garage", () => {
    const spec: BriefSpec = {
      size: "compact",
      stories: 1,
      layout: "box",
      entrance: "south",
      vehicle: "scout",
      bay: "east",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    const plan = buildFromSpec(spec);
    const checks = specChecks(plan, spec);
    assert.equal(
      checks.filter((c) => !c.ok).length,
      0,
      checks
        .filter((c) => !c.ok)
        .map((c) => c.label)
        .join(", "),
    );
    const garage = plan.pieces.find((p) => p.type === "garage_door");
    assert.ok(garage);
    assert.equal(garage!.rot, FACE_ROT.east);
    assert.ok(plan.pieces.some((p) => p.y >= 1));
  });

  it("same-face door and garage do not occupy the same cells", () => {
    const spec: BriefSpec = {
      size: "keep",
      stories: 2,
      layout: "box",
      entrance: "south",
      vehicle: "buggy",
      bay: "south",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    assertChecks(spec, "same-face");
    const plan = buildFromSpec(spec);
    const door = plan.pieces.find((p) => p.type === "door")!;
    const garage = plan.pieces.find((p) => p.type === "garage_door")!;
    assert.equal(door.rot, 0);
    assert.equal(garage.rot, 0);
    assert.ok(door.x !== garage.x && door.x !== garage.x + 1);
  });

  it("parseSpec fills defaults", () => {
    const s = parseSpec({ size: "keep", vehicle: "buggy", bay: "west" });
    assert.equal(s.size, "keep");
    assert.equal(s.vehicle, "buggy");
    assert.equal(s.bay, "west");
    assert.equal(s.stories, 2);
    assert.deepEqual(s.vehicles, ["buggy"]);
  });

  it("parseSpec reads a vehicles array and picks the largest as primary", () => {
    const s = parseSpec({
      layout: "hangar",
      vehicles: ["bike", "thopter", "buggy"],
      entrance: "east",
      bay: "south",
    });
    assert.deepEqual(s.vehicles, ["scout", "buggy", "bike"]);
    assert.equal(s.vehicle, "scout");
  });

  it("same-face people door plus a shared fleet still fits a hangar pad", () => {
    const s = parseSpec({
      layout: "hangar",
      vehicles: ["thopter", "buggy", "bike"],
      entrance: "south",
      bay: "south",
    });
    assert.ok(["starter", "compact", "keep", "compound", "advanced"].includes(s.size));
  });

  it("scout + buggy + bike hangar shares the ground bay", () => {
    const spec: BriefSpec = {
      size: "compound",
      stories: 2,
      layout: "hangar",
      entrance: "east",
      vehicle: "scout",
      vehicles: ["scout", "buggy", "bike"],
      bay: "south",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    assertChecks(spec, "fleet-three");
    const plan = buildFromSpec(spec);
    const b = boundsOf(plan);
    assert.equal(b.maxX - b.minX + 1, 9);
    assert.equal(b.maxZ - b.minZ + 1, 6);
    const garages = plan.pieces.filter((p) => p.type === "garage_door");
    assert.ok(garages.length >= 1 && garages.length <= 2);
    assert.ok(garages.every((g) => g.rot === FACE_ROT.south && g.z === b.maxZ));
    const door = plan.pieces.find((p) => p.type === "door")!;
    assert.equal(door.rot, FACE_ROT.east);
  });

  it("carrier + crawler + small craft stack pentashield over a 2×2 garage on 10×10", () => {
    const spec: BriefSpec = {
      size: "advanced",
      stories: 2,
      layout: "hangar",
      entrance: "east",
      vehicle: "carrier",
      vehicles: ["scout", "buggy", "bike", "carrier", "crawler"],
      bay: "south",
      airlock: true,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: false,
    };
    assertChecks(spec, "fleet-all");
    const plan = buildFromSpec(spec);
    const b = boundsOf(plan);
    assert.equal(b.maxX - b.minX + 1, 10);
    assert.equal(b.maxZ - b.minZ + 1, 10);
    const garages = plan.pieces.filter((p) => p.type === "garage_door");
    const pentas = plan.pieces.filter((p) => p.type === "pentashield");
    assert.equal(garages.length, 1);
    assert.equal(pentas.length, 1);
    assert.ok(garages[0]!.z === b.maxZ);
    assert.ok(pentas[0]!.z === b.maxZ);
    assert.ok(pentas[0]!.y > garages[0]!.y);
    assert.ok(plan.rooms.some((r) => /carrier/i.test(r.name)));
    assert.ok(plan.rooms.some((r) => /crawler/i.test(r.name)));
  });

  it("crawler-only is a 2×2 ground garage door, not a pentashield", () => {
    const spec = parseSpec({
      size: "keep",
      layout: "box",
      entrance: "east",
      bay: "south",
      vehicles: ["crawler"],
    });
    assertChecks(spec, "crawler-only");
    const plan = buildFromSpec(spec);
    const garages = plan.pieces.filter((p) => p.type === "garage_door");
    const pentas = plan.pieces.filter((p) => p.type === "pentashield");
    assert.equal(garages.length, 1);
    assert.equal(pentas.length, 0);
    const g = garages[0]!;
    const along = g.rot === 0 || g.rot === 180;
    const span = along
      ? plan.pieces.filter((p) => p.type === "foundation" && p.z === g.z).length
      : 0;
    void span;
    const b = boundsOf(plan);
    assert.equal(g.z, b.maxZ);
    const floor1 = new Set(
      plan.pieces.filter((p) => p.type === "floor" && p.y === 1).map((p) => `${p.x},${p.z}`),
    );
    assert.equal(floor1.has(`${g.x},${g.z}`), false);
    assert.equal(floor1.has(`${g.x + 1},${g.z}`), false);
  });

  it("carrier-only uses a pentashield and no garage door", () => {
    const spec = parseSpec({
      size: "advanced",
      layout: "hangar",
      entrance: "east",
      bay: "south",
      vehicles: ["carrier"],
    });
    assertChecks(spec, "carrier-only");
    const plan = buildFromSpec(spec);
    const garages = plan.pieces.filter((p) => p.type === "garage_door");
    const pentas = plan.pieces.filter((p) => p.type === "pentashield");
    assert.equal(garages.length, 0);
    assert.equal(pentas.length, 1);
    assert.ok((pentas[0]!.along ?? 0) >= 4);
    assert.ok((pentas[0]!.rise ?? 0) >= 2);
    const b = boundsOf(plan);
    assert.equal(pentas[0]!.z, b.maxZ);
  });

  it("crawler + carrier stacks the pentashield above the garage", () => {
    const spec = parseSpec({
      size: "advanced",
      layout: "hangar",
      entrance: "east",
      bay: "south",
      vehicles: ["crawler", "carrier"],
    });
    assertChecks(spec, "stack");
    const plan = buildFromSpec(spec);
    const garage = plan.pieces.find((p) => p.type === "garage_door")!;
    const penta = plan.pieces.find((p) => p.type === "pentashield")!;
    assert.ok(garage);
    assert.ok(penta);
    assert.ok(penta.y > garage.y);
    assert.equal(penta.y, 2);
    assert.equal(garage.y, 0);
    const wallOnPenta = plan.pieces.some(
      (p) =>
        p.type === "wall" &&
        p.x === penta.x &&
        p.z === penta.z &&
        p.rot === penta.rot &&
        p.y >= penta.y &&
        p.y < penta.y + (penta.rise ?? 3),
    );
    assert.equal(wallOnPenta, false);
  });

  it("one wide staking unit on an advanced south bay is a 20×10 pad", () => {
    const spec = parseSpec({
      size: "advanced",
      layout: "hangar",
      extendWide: 1,
      extendHigh: 0,
      entrance: "east",
      bay: "south",
      vehicles: ["scout"],
    });
    assert.equal(spec.size, "advanced");
    assert.equal(spec.extendWide, 1);
    const plan = buildFromSpec(spec);
    const b = boundsOf(plan);
    assert.equal(b.maxX - b.minX + 1, 20);
    assert.equal(b.maxZ - b.minZ + 1, 10);
    assertChecks(spec, "one-wide-stake");
  });

  it("staking units bump a compact pad to advanced", () => {
    const s = parseSpec({ size: "compact", extendWide: 2, extendHigh: 1 });
    assert.equal(s.size, "advanced");
    assert.equal(s.extendWide, 2);
    assert.equal(s.extendHigh, 1);
  });

  it("high staking raises the story cap and two ornithopters get two garages", () => {
    const spec = parseSpec({
      size: "advanced",
      layout: "hangar",
      stories: 2,
      extendHigh: 2,
      entrance: "east",
      bay: "south",
      vehicles: ["thopter"],
      vehicleCounts: { thopter: 2 },
    });
    assert.equal(spec.vehicleCounts?.scout, 2);
    assertChecks(spec, "two-thopters");
    const plan = buildFromSpec(spec);
    const garages = plan.pieces.filter((p) => p.type === "garage_door");
    assert.equal(garages.length, 2);
  });

  it("old saves without staking or counts still parse", () => {
    const s = parseSpec({ size: "keep", vehicle: "buggy", bay: "west" });
    assert.equal(s.extendWide, 0);
    assert.equal(s.extendHigh, 0);
    assert.equal(s.vehicleCounts?.buggy, 1);
  });

  it("legacy single buggy still raises one garage", () => {
    const spec: BriefSpec = {
      size: "keep",
      stories: 2,
      layout: "box",
      entrance: "north",
      vehicle: "buggy",
      bay: "west",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: false,
      lookout: false,
    };
    assertChecks(spec, "legacy-buggy");
    const plan = buildFromSpec(spec);
    assert.equal(plan.pieces.filter((p) => p.type === "garage_door").length, 1);
  });

  it("starter 4×4 hangar is legal and stacks a garage under the scout", () => {
    const spec = parseSpec({
      size: "starter",
      layout: "hangar",
      stories: 5,
      entrance: "east",
      bay: "south",
      vehicles: ["buggy", "scout"],
      workshop: true,
      storage: "chest",
    });
    assert.equal(spec.size, "starter");
    assert.ok(spec.stories >= 4);
    assertChecks(spec, "starter-hangar");
    const plan = buildFromSpec(spec);
    const b = boundsOf(plan);
    assert.equal(b.maxX - b.minX + 1, 4);
    assert.equal(b.maxZ - b.minZ + 1, 4);
    assert.ok(plan.pieces.some((p) => p.type === "garage_door"));
    assert.ok(plan.pieces.some((p) => p.type === "fabricator"));
    assert.ok(plan.pieces.some((p) => p.type === "chest"));
    const shopY = plan.pieces.find((p) => p.type === "fabricator")!.y;
    const garage = plan.pieces.find((p) => p.type === "garage_door")!;
    assert.ok(shopY > garage.y);
  });

  it("assault hangar uses a 3-high pentashield", () => {
    const spec = parseSpec({
      size: "compact",
      layout: "hangar",
      stories: 5,
      entrance: "east",
      bay: "south",
      vehicles: ["assault"],
    });
    assertChecks(spec, "assault");
    const plan = buildFromSpec(spec);
    const penta = plan.pieces.find((p) => p.type === "pentashield");
    assert.ok(penta);
    assert.ok((penta!.rise ?? 0) >= 3);
    assert.equal(plan.pieces.some((p) => p.type === "garage_door"), false);
  });

  it("legacy vehicle thopter alone parses as scout", () => {
    const spec = parseSpec({ vehicle: "thopter", layout: "hangar", bay: "south" });
    assert.deepEqual(spec.vehicles, ["scout"]);
    assert.equal(spec.vehicle, "scout");
  });

  it("assault plus buggy plus shops keeps markers out of the fly-in volume", () => {
    const spec = parseSpec({
      size: "compact",
      layout: "hangar",
      stories: 5,
      entrance: "east",
      bay: "south",
      vehicles: ["assault", "buggy"],
      workshop: true,
      storage: "chest",
    });
    assertChecks(spec, "assault-shops");
    const plan = buildFromSpec(spec);
    const penta = plan.pieces.find((p) => p.type === "pentashield")!;
    assert.ok(penta);
    const fabs = plan.pieces.filter((p) => p.type === "fabricator" || p.type === "chest");
    assert.ok(fabs.length >= 1);
    const rise = penta.rise ?? 3;
    const overlap = fabs.some(
      (p) => p.y >= penta.y && p.y < penta.y + rise && p.z === penta.z && p.x === penta.x,
    );
    assert.equal(overlap, false);
  });

  it("keeps starter 4×4 when hangar parks a buggy and scout", () => {
    const s = parseSpec({
      size: "starter",
      layout: "hangar",
      vehicles: ["buggy", "scout"],
    });
    assert.equal(s.size, "starter");
  });

  it("keeps keep 7×7 with a hangar fleet", () => {
    const s = parseSpec({
      size: "keep",
      layout: "hangar",
      vehicles: ["scout", "buggy", "bike"],
    });
    assert.equal(s.size, "keep");
  });

  it("raises Corner Columns on the four outer vertices, not Center Columns in the room", () => {
    const plan = buildFromSpec(
      parseSpec({ size: "starter", stories: 2, layout: "box", vehicle: "none" }),
    );
    const corners = plan.pieces.filter((p) => p.type === "corner_column");
    const centers = plan.pieces.filter((p) => p.type === "center_column");
    assert.equal(corners.length, 8);
    assert.equal(centers.length, 0);
    assert.equal(new Set(corners.map((c) => c.rot)).size, 4);
  });

  it("puts Corner Columns on every story of a five-story keep", () => {
    const spec = parseSpec({ size: "keep", stories: 5, layout: "box" });
    const plan = buildFromSpec(spec);
    const corners = plan.pieces.filter((p) => p.type === "corner_column");
    assert.equal(corners.length, 20);
  });

  it("does not plant Center Columns in a hangar hall or courtyard", () => {
    const hangar = buildFromSpec(
      parseSpec({
        size: "advanced",
        layout: "hangar",
        stories: 5,
        vehicles: ["carrier"],
        bay: "south",
      }),
    );
    const floors = new Set(
      hangar.pieces
        .filter((p) => p.type === "floor")
        .map((p) => `${p.y}:${p.x},${p.z}`),
    );
    for (const c of hangar.pieces.filter((p) => p.type === "center_column")) {
      if (c.y === 0) {
        assert.equal(
          hangar.pieces.some(
            (p) => p.type === "floor" && p.y === 1 && p.x === c.x && p.z === c.z,
          ),
          true,
          `ground Center Column at ${c.x},${c.z} sits under a hangar void`,
        );
      } else {
        assert.equal(
          floors.has(`${c.y}:${c.x},${c.z}`),
          true,
          `Center Column at ${c.x},${c.z} story ${c.y} has no floor`,
        );
      }
    }

    const court = buildFromSpec(
      parseSpec({ size: "advanced", layout: "courtyard", stories: 2, vehicle: "none" }),
    );
    const roofKeys = new Set(
      court.pieces.filter((p) => p.type === "rooftop").map((p) => `${p.x},${p.z}`),
    );
    for (const c of court.pieces.filter((p) => p.type === "center_column")) {
      assert.equal(
        roofKeys.has(`${c.x},${c.z}`),
        true,
        `Center Column at ${c.x},${c.z} sits in courtyard open sky`,
      );
    }
  });

  it("stories 5 are allowed with no staking", () => {
    const spec = parseSpec({ size: "keep", stories: 5, layout: "box" });
    assert.equal(spec.stories, 5);
    assert.equal(spec.extendHigh, 0);
    assertChecks(spec, "five-story");
  });
});
