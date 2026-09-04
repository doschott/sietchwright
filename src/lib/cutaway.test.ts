import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cutawayGhostStyle,
  pieceGhostInCutaway,
  pieceHiddenInCutaway,
} from "./cutaway.ts";

const bounds = { minX: 0, maxX: 5, minZ: 0, maxZ: 4, maxY: 1, cx: 3, cz: 2 };

describe("inside / cutaway", () => {
  it("hides rooftops, rails, and roof hatches", () => {
    assert.equal(pieceHiddenInCutaway("rooftop", false), true);
    assert.equal(pieceHiddenInCutaway("railing", false), true);
    assert.equal(pieceHiddenInCutaway("hatch", true), true);
    assert.equal(pieceHiddenInCutaway("hatch", false), false);
    assert.equal(pieceHiddenInCutaway("wall", false), false);
    assert.equal(pieceHiddenInCutaway("stairs", false), false);
    assert.equal(pieceHiddenInCutaway("chest", false), false);
    assert.equal(pieceHiddenInCutaway("fabricator", false), false);
  });

  it("ghosts only the outer envelope, not interior partitions", () => {
    assert.equal(
      pieceGhostInCutaway({ type: "wall", x: 2, z: 4, rot: 0 }, bounds),
      true,
    );
    assert.equal(
      pieceGhostInCutaway({ type: "garage_door", x: 1, z: 4, rot: 0 }, bounds),
      true,
    );
    assert.equal(
      pieceGhostInCutaway({ type: "wall", x: 2, z: 2, rot: 0 }, bounds),
      false,
    );
    assert.equal(
      pieceGhostInCutaway({ type: "stairs", x: 0, z: 0, rot: 0 }, bounds),
      false,
    );
  });

  it("ghosts floor slabs so lower stories show in Inside view", () => {
    assert.equal(pieceGhostInCutaway({ type: "floor", x: 1, z: 1, rot: 0 }, bounds), true);
    assert.equal(pieceHiddenInCutaway("floor", false), false);
    assert.equal(pieceGhostInCutaway({ type: "corner_column", x: 0, z: 0, rot: 0 }, bounds), false);
  });

  it("cutawayGhostStyle is see-through on floors and envelope, opaque off", () => {
    assert.deepEqual(cutawayGhostStyle(false, "wall"), {
      transparent: false,
      opacity: 1,
      depthWrite: true,
    });
    const wall = cutawayGhostStyle(true, "wall");
    assert.equal(wall.transparent, true);
    assert.equal(wall.depthWrite, false);
    assert.equal(wall.opacity, 0.18);
    const floor = cutawayGhostStyle(true, "floor");
    assert.equal(floor.opacity, 0.07);
    assert.equal(floor.transparent, true);
    const garage = cutawayGhostStyle(true, "garage_door");
    assert.equal(garage.transparent, true);
    assert.equal(garage.depthWrite, false);
  });
});

