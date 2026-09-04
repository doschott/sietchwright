import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { outerCornerRot, supportPosts } from "./support.ts";

describe("structural support posts", () => {
  it("puts a Corner Column on each outer vertex of a 4×4", () => {
    const posts = supportPosts(4, 4);
    const corners = posts.filter((p) => p.kind === "corner");
    assert.equal(corners.length, 4);
    assert.equal(posts.filter((p) => p.kind === "center").length, 0);
    assert.equal(outerCornerRot(0, 0, 4, 4), 0);
    assert.equal(outerCornerRot(3, 0, 4, 4), 90);
    assert.equal(outerCornerRot(3, 3, 4, 4), 180);
    assert.equal(outerCornerRot(0, 3, 4, 4), 270);
  });

  it("adds interior Center Columns on an 10×10 keep", () => {
    const posts = supportPosts(10, 10);
    const corners = posts.filter((p) => p.kind === "corner");
    const centers = posts.filter((p) => p.kind === "center");
    assert.equal(corners.length, 4);
    assert.ok(centers.length >= 1);
    assert.equal(
      corners.some((p) => p.x === 0 && p.z === 0 && p.rot === 0),
      true,
    );
    assert.equal(
      centers.some((p) => p.x === 0 && p.z === 0),
      false,
    );
  });

  it("does not add Center Columns on Compact 6×5 or Compound 9×6", () => {
    assert.equal(supportPosts(6, 5).filter((p) => p.kind === "center").length, 0);
    assert.equal(supportPosts(9, 6).filter((p) => p.kind === "center").length, 0);
  });
});
