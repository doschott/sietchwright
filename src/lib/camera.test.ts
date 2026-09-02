import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_DISTANCE,
  MIN_DISTANCE,
  clampDistance,
  framedPosition,
  zoomOffset,
} from "./camera.ts";

const bounds = { minX: 0, maxX: 6, minZ: 0, maxZ: 5, maxY: 1, cx: 3, cz: 2.5 };

describe("camera framing", () => {
  it("iso looks from south-east of center", () => {
    const [x, y, z] = framedPosition("iso", bounds);
    assert.ok(x > bounds.cx);
    assert.ok(y > 2);
    assert.ok(z > bounds.cz);
  });

  it("top is high and almost over center", () => {
    const [x, y, z] = framedPosition("top", bounds);
    assert.equal(x, bounds.cx);
    assert.ok(y > 8);
    assert.ok(Math.abs(z - bounds.cz) < 1);
  });

  it("south stands off the south wall", () => {
    const [, , z] = framedPosition("south", bounds);
    assert.ok(z > bounds.maxZ);
  });

  it("zoom in shortens the offset, zoom out lengthens it, both stay in range", () => {
    const inn = zoomOffset(9, 7.6, 12, "in");
    const out = zoomOffset(9, 7.6, 12, "out");
    const base = Math.hypot(9, 7.6, 12);
    assert.ok(Math.hypot(inn.x, inn.y, inn.z) < base);
    assert.ok(Math.hypot(out.x, out.y, out.z) > base);
    assert.equal(clampDistance(1), MIN_DISTANCE);
    assert.equal(clampDistance(99), MAX_DISTANCE);
  });
});
