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

  it("crawler stall is a 2×2 drive-in", () => {
    assert.deepEqual(stallSize("crawler", true, false), { along: 2, depth: 2 });
    const stalls = fleetStalls(["crawler"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.along, 2);
    assert.equal(stalls[0]!.depth, 2);
    assert.equal(stalls[0]!.opening, "garage");
    assert.equal(stalls[0]!.story, 0);
  });

  it("carrier stall is a 5×6 pentashield hall", () => {
    const stalls = fleetStalls(["carrier"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.along, 5);
    assert.equal(stalls[0]!.depth, 6);
    assert.equal(stalls[0]!.opening, "pentashield");
  });

  it("carrier hall also parks scout, buggy, and bike; crawler stacks under the carrier", () => {
    const groups = groupStalls(["carrier", "crawler", "thopter", "buggy", "bike"]);
    assert.deepEqual(groups[0], ["carrier", "thopter", "buggy", "bike"]);
    assert.deepEqual(groups[1], ["crawler"]);
    const stalls = fleetStalls(["carrier", "crawler", "thopter", "buggy", "bike"], true);
    assert.equal(stalls.length, 2);
    const car = stalls.find((s) => s.vehicle === "carrier")!;
    const cr = stalls.find((s) => s.vehicle === "crawler")!;
    assert.equal(car.opening, "pentashield");
    assert.equal(car.story, 2);
    assert.equal(cr.opening, "garage");
    assert.equal(cr.story, 0);
    assert.equal(cr.along, 2);
    assert.equal(cr.depth, 2);
    assert.ok(cr.u0 >= car.u0);
    assert.ok(cr.u0 + cr.along <= car.u0 + car.along);
    const ext = packExtent(stalls);
    assert.equal(ext.along, 5);
    assert.equal(ext.depth, 6);
  });

  it("fleetNeed for the stacked set is 5 along and 8 deep (6 hall + 2 living)", () => {
    const need = fleetNeed(["carrier", "crawler", "thopter", "buggy", "bike"], true, false);
    assert.equal(need.along, 5);
    assert.equal(need.depth, 8);
    assert.equal(need.rigid, true);
  });

  it("describeFleet lists every parked craft", () => {
    assert.equal(describeFleet(["thopter"]), "ornithopter");
    assert.equal(describeFleet(["bike", "buggy"]), "buggy and sandbike");
    assert.match(describeFleet(["thopter", "buggy", "bike"]), /ornithopter, buggy, and sandbike/);
  });

  it("two ornithopters add a second stall even next to a carrier", () => {
    const stalls = fleetStalls(["carrier", "thopter"], true, { counts: { thopter: 2, carrier: 1 } });
    const thopters = stalls.filter((s) => s.vehicle === "thopter");
    const carriers = stalls.filter((s) => s.vehicle === "carrier");
    assert.equal(carriers.length, 1);
    assert.equal(thopters.length, 1);
    assert.equal(stalls.length, 2);
  });

  it("three ornithopters wrap on a 10-wide face", () => {
    const stalls = fleetStalls(["thopter"], true, { counts: { thopter: 3 }, wrapAlong: 10 });
    assert.equal(stalls.length, 3);
    const ext = packExtent(stalls);
    assert.ok(ext.along <= 10);
    assert.ok(ext.depth >= 4);
  });
});
