import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_URL, shareIntentUrl, sharePageUrl } from "./site.ts";

describe("share URLs", () => {
  it("always shares the production domain", () => {
    assert.equal(sharePageUrl(), "https://sietchwright.com");
    assert.equal(SITE_URL, "https://sietchwright.com");
  });

  it("builds an X intent that includes the canonical domain", () => {
    const href = shareIntentUrl(`I raised a keep in Sietchwright.\n\n${sharePageUrl()}`);
    assert.match(href, /^https:\/\/x\.com\/intent\/tweet\?text=/);
    assert.ok(decodeURIComponent(href).includes("sietchwright.com"));
    assert.equal(decodeURIComponent(href).includes("localhost"), false);
  });
});
