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
  it("uniqueVehicles sorts largest first, maps thopter to scout, and drops junk", () => {
    assert.deepEqual(uniqueVehicles(["bike", "carrier", "bike", "nope"]), ["carrier", "bike"]);
    assert.deepEqual(uniqueVehicles(["thopter", "bike"]), ["scout", "bike"]);
    assert.deepEqual(uniqueVehicles(undefined), []);
  });

  it("primaryVehicle is the largest parked craft", () => {
    assert.equal(primaryVehicle(["bike", "scout"]), "scout");
    assert.equal(primaryVehicle(["scout", "assault"]), "assault");
    assert.equal(primaryVehicle([]), "none");
  });

  it("single scout hangar keeps the historical 5×4 bay", () => {
    assert.deepEqual(stallSize("scout", true, false), { along: 5, depth: 4 });
    const stalls = fleetStalls(["scout"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.along, 5);
    assert.equal(stalls[0]!.depth, 4);
    assert.equal(stalls[0]!.rise, 2);
    assert.equal(stalls[0]!.opening, "garage");
  });

  it("assault hangar is three high and a pentashield", () => {
    const stalls = fleetStalls(["assault"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.rise, 3);
    assert.equal(stalls[0]!.opening, "pentashield");
  });

  it("bike and buggy share one stall", () => {
    const groups = groupStalls(["buggy", "bike"]);
    assert.deepEqual(groups, [["buggy", "bike"]]);
    const stalls = fleetStalls(["buggy", "bike"], true);
    assert.equal(stalls.length, 1);
    assert.deepEqual(stalls[0]!.shared, ["buggy", "bike"]);
  });

  it("scout parks in an assault hall", () => {
    const groups = groupStalls(["assault", "scout"]);
    assert.deepEqual(groups, [["assault", "scout"]]);
    const stalls = fleetStalls(["assault", "scout"], true);
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0]!.opening, "pentashield");
    assert.equal(stalls[0]!.rise, 3);
  });

  it("scout + buggy + bike share the ground bay so two stalls, not three", () => {
    const stalls = fleetStalls(["scout", "buggy", "bike"], true);
    assert.equal(stalls.length, 2);
    const ext = packExtent(stalls);
    assert.ok(ext.along <= 8);
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
    const groups = groupStalls(["carrier", "crawler", "scout", "buggy", "bike"]);
    assert.deepEqual(groups[0], ["carrier", "scout", "buggy", "bike"]);
    assert.deepEqual(groups[1], ["crawler"]);
    const stalls = fleetStalls(["carrier", "crawler", "scout", "buggy", "bike"], true);
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

  it("fleetNeed for the stacked carrier set is 5 along and 6 deep on a hangar", () => {
    const need = fleetNeed(["carrier", "crawler", "scout", "buggy", "bike"], true, false);
    assert.equal(need.along, 5);
    assert.equal(need.depth, 6);
    assert.equal(need.rigid, true);
  });

  it("compact 4×4 hangar stacks buggy under scout", () => {
    const stalls = fleetStalls(["buggy", "scout"], true, { wrapAlong: 4, wrapDepth: 4 });
    const g = stalls.find((s) => s.vehicle === "buggy")!;
    const f = stalls.find((s) => s.vehicle === "scout")!;
    assert.ok(g);
    assert.ok(f);
    assert.equal(g.story, 0);
    assert.equal(f.story, 2);
    assert.equal(g.u0, f.u0);
    const need = fleetNeed(["buggy", "scout"], true, false, { wrapAlong: 4, wrapDepth: 4 });
    assert.ok(need.along <= 4);
    assert.ok(need.depth <= 4);
  });

  it("shops insert raises the scout fly-in to story 3", () => {
    const stalls = fleetStalls(["buggy", "scout"], true, {
      wrapAlong: 4,
      wrapDepth: 4,
      insertShops: true,
    });
    const f = stalls.find((s) => s.vehicle === "scout")!;
    assert.equal(f.story, 3);
  });

  it("describeFleet lists every parked craft", () => {
    assert.equal(describeFleet(["scout"]), "scout ornithopter");
    assert.equal(describeFleet(uniqueVehicles(["thopter"])), "scout ornithopter");
    assert.equal(describeFleet(["bike", "buggy"]), "buggy and sandbike");
    assert.match(describeFleet(["scout", "buggy", "bike"]), /scout ornithopter, buggy, and sandbike/);
  });

  it("two scouts add a second stall even next to a carrier", () => {
    const stalls = fleetStalls(["carrier", "scout"], true, { counts: { scout: 2, carrier: 1 } });
    const scouts = stalls.filter((s) => s.vehicle === "scout");
    const carriers = stalls.filter((s) => s.vehicle === "carrier");
    assert.equal(carriers.length, 1);
    assert.equal(scouts.length, 1);
    assert.equal(stalls.length, 2);
  });

  it("three scouts wrap on a 10-wide face", () => {
    const stalls = fleetStalls(["scout"], true, { counts: { scout: 3 }, wrapAlong: 10 });
    assert.equal(stalls.length, 3);
    const ext = packExtent(stalls);
    assert.ok(ext.along <= 10);
    assert.ok(ext.depth >= 4);
  });
});
