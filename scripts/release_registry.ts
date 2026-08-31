import denoConfig from "../deno.json" with { type: "json" };

export interface RegistryPresence {
  readonly jsr: boolean;
  readonly npm: boolean;
}

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function hasVersion(
  metadata: unknown,
  version: string,
  label: string,
): boolean {
  if (typeof metadata !== "object" || metadata === null) {
    throw new Error(`Invalid ${label} registry metadata`);
  }
  const versions = (metadata as { versions?: unknown }).versions;
  if (typeof versions !== "object" || versions === null) {
    throw new Error(`Invalid ${label} versions metadata`);
  }
  return Object.hasOwn(versions, version);
}

async function fetchMetadata(
  url: string,
  label: string,
  fetcher: Fetcher,
): Promise<unknown> {
  const response = await fetcher(url, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404) return { versions: {} };
  if (!response.ok) {
    throw new Error(
      `${label} registry returned ${response.status} ${response.statusText}`,
    );
  }
  return await response.json();
}

/** Resolves whether an exact immutable version exists on both registries. */
export async function fetchRegistryPresence(
  packageName: string,
  version: string,
  fetcher: Fetcher = fetch,
): Promise<RegistryPresence> {
  const jsrUrl = `https://jsr.io/${packageName}/meta.json`;
  const npmUrl = `https://registry.npmjs.org/${
    encodeURIComponent(packageName)
  }`;
  const [jsrMetadata, npmMetadata] = await Promise.all([
    fetchMetadata(jsrUrl, "JSR", fetcher),
    fetchMetadata(npmUrl, "npm", fetcher),
  ]);
  return {
    jsr: hasVersion(jsrMetadata, version, "JSR"),
    npm: hasVersion(npmMetadata, version, "npm"),
  };
}

async function writeOutputs(presence: RegistryPresence): Promise<void> {
  const outputPath = Deno.env.get("GITHUB_OUTPUT");
  if (outputPath === undefined) {
    throw new Error("GITHUB_OUTPUT is not available.");
  }
  await Deno.writeTextFile(
    outputPath,
    `jsr_exists=${presence.jsr}\nnpm_exists=${presence.npm}\n`,
    { append: true },
  );
}

async function requireBothRegistries(): Promise<void> {
  const attempts = 12;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const presence = await fetchRegistryPresence(
      denoConfig.name,
      denoConfig.version,
    );
    if (presence.jsr && presence.npm) return;
    if (attempt === attempts) {
      throw new Error(
        `Incomplete release ${denoConfig.version}: ` +
          `JSR=${presence.jsr}, npm=${presence.npm}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

if (import.meta.main) {
  if (Deno.args.includes("--require-all")) {
    await requireBothRegistries();
  } else {
    const presence = await fetchRegistryPresence(
      denoConfig.name,
      denoConfig.version,
    );
    await writeOutputs(presence);
    console.log(
      `Release ${denoConfig.version}: JSR=${presence.jsr}, npm=${presence.npm}`,
    );
  }
}
