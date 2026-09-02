import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeFleet,
  fleetNeed,
  fleetStalls,
  groupStalls,
  packExtent,
  primaryVehicle,
  stallSize,
  uniqueVehicles,
} from "./vehicles.ts";

describe("vehicle fleet packing", () => {
  it("uniqueVehicles sorts largest first and drops junk", () => {
    assert.deepEqual(uniqueVehicles(["bike", "carrier", "bike", "nope"]), ["carrier", "bike"]);
    assert.deepEqual(uniqueVehicles(undefined), []);
  });

  it("primaryVehicle is the largest parked craft", () => {
    assert.equal(primaryVehicle(["bike", "thopter"]), "thopter");
    assert.equal(primaryVehicle([]), "none");
  });

  it("single scout hangar keeps the historical 5×4 bay", () => {
    assert.deepEqual(stallSize("thopter", true, false), { along: 5, depth: 4 });
    const stalls = fleetStalls(["thopter"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.along, 5);
    assert.equal(stalls[0]!.depth, 4);
  });

  it("thopter + buggy + bike get three stalls totalling 9×4", () => {
    const stalls = fleetStalls(["thopter", "buggy", "bike"], true);
    assert.equal(stalls.length, 3);
    const ext = packExtent(stalls);
    assert.equal(ext.along, 9);
    assert.equal(ext.depth, 4);
  });

  it("carrier hall also parks scout, buggy, and bike; crawler is a separate well", () => {
    const groups = groupStalls(["carrier", "crawler", "thopter", "buggy", "bike"]);
    assert.deepEqual(groups[0], ["carrier", "thopter", "buggy", "bike"]);
    assert.deepEqual(groups[1], ["crawler"]);
    const stalls = fleetStalls(["carrier", "crawler", "thopter", "buggy", "bike"], true);
    assert.equal(stalls.length, 2);
    const ext = packExtent(stalls);
    assert.equal(ext.along, 10);
    assert.equal(ext.depth, 6);
  });

  it("fleetNeed for the full set is 10 along and 8 deep (6 hall + 2 living)", () => {
    const need = fleetNeed(["carrier", "crawler", "thopter", "buggy", "bike"], true, false);
    assert.equal(need.along, 10);
    assert.equal(need.depth, 8);
    assert.equal(need.rigid, true);
  });

  it("describeFleet lists every parked craft", () => {
    assert.equal(describeFleet(["thopter"]), "ornithopter");
    assert.equal(describeFleet(["bike", "buggy"]), "buggy and sandbike");
    assert.match(describeFleet(["thopter", "buggy", "bike"]), /ornithopter, buggy, and sandbike/);
  });
});
