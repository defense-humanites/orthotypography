import assert from "node:assert/strict";
import {
  fetchNpmDistTags,
  fetchRegistryPresence,
} from "../scripts/release_registry.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.test("release registry state resolves each registry independently", async () => {
  const requested: string[] = [];
  const fetcher = (input: string | URL | Request): Promise<Response> => {
    const url = String(input);
    requested.push(url);
    return Promise.resolve(
      url.includes("jsr.io")
        ? response({ versions: { "0.1.0-alpha.0": {} } })
        : response({ error: "not found" }, 404),
    );
  };

  assert.deepEqual(
    await fetchRegistryPresence(
      "@orthotypography/core",
      "0.1.0-alpha.0",
      fetcher,
    ),
    { jsr: true, npm: false },
  );
  assert.deepEqual(requested, [
    "https://jsr.io/@orthotypography/core/meta.json",
    "https://registry.npmjs.org/%40orthotypography%2Fcore/0.1.0-alpha.0",
  ]);
});

Deno.test("missing packages are treated as unpublished", async () => {
  const fetcher = (): Promise<Response> =>
    Promise.resolve(response({ error: "not found" }, 404));

  assert.deepEqual(
    await fetchRegistryPresence("@orthotypography/core", "0.1.0", fetcher),
    { jsr: false, npm: false },
  );
});

Deno.test("all partial-release registry states remain distinguishable", async () => {
  for (
    const expected of [
      { jsr: false, npm: false },
      { jsr: true, npm: false },
      { jsr: false, npm: true },
      { jsr: true, npm: true },
    ]
  ) {
    const fetcher = (input: string | URL | Request): Promise<Response> => {
      const published = String(input).includes("jsr.io")
        ? expected.jsr
        : expected.npm;
      if (String(input).includes("jsr.io")) {
        return Promise.resolve(response({
          versions: published ? { "0.1.0-alpha.0": {} } : {},
        }));
      }
      return Promise.resolve(
        published
          ? response({ name: "@orthotypography/core" })
          : response({}, 404),
      );
    };
    assert.deepEqual(
      await fetchRegistryPresence(
        "@orthotypography/core",
        "0.1.0-alpha.0",
        fetcher,
      ),
      expected,
    );
  }
});

Deno.test("registry errors and malformed metadata fail closed", async () => {
  await assert.rejects(
    () =>
      fetchRegistryPresence(
        "@orthotypography/core",
        "0.1.0",
        () => Promise.resolve(response({}, 503)),
      ),
    Error,
    "registry returned 503",
  );
  await assert.rejects(
    () =>
      fetchRegistryPresence(
        "@orthotypography/core",
        "0.1.0",
        () => Promise.resolve(response({ unexpected: true })),
      ),
    Error,
    "versions metadata",
  );
});

Deno.test("npm dist-tags are read from the scoped package endpoint", async () => {
  const requested: string[] = [];
  const fetcher = (input: string | URL | Request): Promise<Response> => {
    requested.push(String(input));
    return Promise.resolve(
      response({ latest: "0.1.0-alpha.3", alpha: "0.1.0-alpha.2" }),
    );
  };

  assert.deepEqual(
    await fetchNpmDistTags("@orthotypography/core", fetcher),
    { latest: "0.1.0-alpha.3", alpha: "0.1.0-alpha.2" },
  );
  assert.deepEqual(requested, [
    "https://registry.npmjs.org/-/package/%40orthotypography%2Fcore/dist-tags",
  ]);
});

Deno.test("npm dist-tag errors and malformed metadata fail closed", async () => {
  await assert.rejects(
    fetchNpmDistTags(
      "@orthotypography/core",
      () => Promise.resolve(response({ error: "unavailable" }, 503)),
    ),
    /npm registry returned 503/,
  );
  for (const body of [null, ["0.1.0"], { latest: 1 }]) {
    await assert.rejects(
      fetchNpmDistTags(
        "@orthotypography/core",
        () => Promise.resolve(response(body)),
      ),
      /Invalid npm dist-tags metadata/,
    );
  }
});
