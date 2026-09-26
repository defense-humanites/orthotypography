import assert from "node:assert/strict";
import { npmDistTag } from "../scripts/release_metadata.ts";

Deno.test("every 0.x version is published as latest on npm", () => {
  assert.equal(npmDistTag("0.1.0-alpha.3"), "latest");
  assert.equal(npmDistTag("0.2.0-beta.1"), "latest");
  assert.equal(npmDistTag("0.9.0-rc.1"), "latest");
  assert.equal(npmDistTag("0.9.0"), "latest");
});

Deno.test("prereleases from 1.0.0 never displace the stable latest tag", () => {
  assert.equal(npmDistTag("1.0.0"), "latest");
  assert.equal(npmDistTag("1.0.0-alpha.0"), "alpha");
  assert.equal(npmDistTag("1.0.0-beta.2"), "beta");
  assert.equal(npmDistTag("1.1.0-rc.1"), "next");
  assert.equal(npmDistTag("10.0.0-alpha.1"), "alpha");
});

Deno.test("npm tag selection rejects malformed versions", () => {
  assert.throws(() => npmDistTag("v0.1.0"), /Unsupported version/);
  assert.throws(() => npmDistTag("0.1"), /Unsupported version/);
});
