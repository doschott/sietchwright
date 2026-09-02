import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PREVIEW_CLIENT_SECRET } from "./preview.ts";

describe("public OSS does not ship preview OAuth credentials", () => {
  it("preview client secret is empty", () => {
    assert.equal(PREVIEW_CLIENT_SECRET, "");
  });
});
