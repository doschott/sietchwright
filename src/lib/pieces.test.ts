import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PIECES } from "./pieces.ts";

describe("CHOAM Facility granite (awakening.wiki)", () => {
  it("matches Facility kit costs used in the bill", () => {
    assert.equal(PIECES.foundation.granite, 15);
    assert.equal(PIECES.wall.granite, 10);
    assert.equal(PIECES.half_wall.granite, 10);
    assert.equal(PIECES.door.granite, 17);
    assert.equal(PIECES.garage_door.granite, 30);
    assert.equal(PIECES.hatch.granite, 17);
    assert.equal(PIECES.stairs.granite, 10);
    assert.equal(PIECES.center_column.granite, 10);
    assert.equal(PIECES.railing.granite, 10);
  });
});
