import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey)("fetches manifest", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    const names = manifest.examples?.map((e) => e.name) ?? [];
    expect(names).toContain("analyze_okabe_ito");
    expect(names).toContain("suggest_fix");
    expect(names).toContain("build_python_snippet");
    expect(names).toContain("parse_palette_url");
    expect(names).toContain("get_preset");
  });

  it.skipIf(!apiKey)("runs analyze_okabe_ito example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("analyze_okabe_ito");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.colors).toHaveLength(6);
    expect(result.result?.simulations).toBeDefined();
    expect(result.result?.slots).toHaveLength(6);
  }, 60_000);

  it.skipIf(!apiKey)("runs suggest_fix example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("suggest_fix");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.resolved).toBe(true);
    expect(result.result?.hex).toBeDefined();
  }, 60_000);

  it.skipIf(!apiKey)("runs build_python_snippet example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("build_python_snippet");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.format).toBe("python");
    expect(result.result?.content).toContain("#E69F00");
  }, 60_000);

  it.skipIf(!apiKey)("runs parse_palette_url example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("parse_palette_url");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.used_default).toBe(false);
    expect(result.result?.colors).toEqual(["#E69F00", "#56B4E9", "#009E73"]);
  }, 60_000);

  it.skipIf(!apiKey)("runs get_preset example", async () => {
    const client = new PepkioClient({ baseUrl, apiKey });
    const input = await client.getExampleInput("get_preset");
    const result = await client.run(input);

    expect(result.status).toBe("completed");
    expect(result.error).toBeFalsy();
    expect(result.result?.preset_id).toBe("okabe-ito");
    expect(result.result?.label).toBe("Okabe-Ito");
    expect(result.result?.colors?.length).toBeGreaterThan(0);
  }, 60_000);
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("analyze_okabe_ito");
      expect(names).toContain("suggest_fix");
      expect(names).toContain("build_python_snippet");
      expect(names).toContain("parse_palette_url");
      expect(names).toContain("get_preset");
    },
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs analyze_okabe_ito example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("analyze_okabe_ito");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.colors).toHaveLength(6);
      expect(result.result?.simulations).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs suggest_fix example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("suggest_fix");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.resolved).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs build_python_snippet example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("build_python_snippet");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.format).toBe("python");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs parse_palette_url example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("parse_palette_url");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.used_default).toBe(false);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs get_preset example",
    async () => {
      const client = new PepkioClient({
        baseUrl: PRODUCTION_BASE_URL,
        apiKey,
      });
      const input = await client.getExampleInput("get_preset");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.preset_id).toBe("okabe-ito");
    },
    60_000,
  );
});
