import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError } from "../src/types.js";

const MOCK_MANIFEST = {
  schema_version: "1.0",
  tool_id: "bio-safe-palette-tester",
  title: "Bio-Safe Palette Tester",
  execution_mode: "sync",
  examples: [
    {
      name: "analyze_okabe_ito",
      description: "Analyze Okabe-Ito palette",
      input: {
        action: "analyze_palette",
        colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00"],
      },
    },
    {
      name: "suggest_fix",
      description: "Suggest fix between colors",
      input: {
        action: "suggest_fix",
        color_a: "#E69F00",
        color_b: "#D55E00",
      },
    },
  ],
};

const MOCK_RUN_RESULT = {
  run_id: "run-palette-123",
  status: "completed",
  result: {
    slots: [
      { id: "color-0", hex: "#E69F00", valid: true, name: "Orange" },
      { id: "color-1", hex: "#56B4E9", valid: true, name: "Sky Blue" },
    ],
    colors: ["#E69F00", "#56B4E9"],
    simulations: [
      { cvd: "normal", label: "Normal Vision", colors: ["#E69F00", "#56B4E9"] },
    ],
    conflicts: [],
    conflict_labels: [],
    identical: false,
    banner: null,
  },
  error: null,
  result_url: "https://tools.pepkio.com/api/tools/v1/runs/run-palette-123",
  permalink: "https://tools.pepkio.com/r/run-palette-123",
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("Bio-Safe Palette Tester");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/bio-safe-palette-tester/manifest",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", async () => {
    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = client.listExamples(MOCK_MANIFEST as any);

    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("analyze_okabe_ito");
    expect(examples[1].name).toBe("suggest_fix");
  });

  it("getExampleInput() returns parsed input from manifest example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = await client.getExampleInput("analyze_okabe_ito");

    expect(input.action).toBe("analyze_palette");
    expect(input.colors).toHaveLength(6);
  });

  it("getExampleInput() throws for unknown example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_MANIFEST),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("run() sends input and returns completed run result", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.run(
      { action: "analyze_palette", colors: ["#E69F00", "#56B4E9"] },
      { label: "test-label" },
    );

    expect(result.status).toBe("completed");
    expect(result.run_id).toBe("run-palette-123");
    expect(result.result?.colors).toEqual(["#E69F00", "#56B4E9"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/bio-safe-palette-tester/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          input: { action: "analyze_palette", colors: ["#E69F00", "#56B4E9"] },
          options: { label: "test-label" },
        }),
      }),
    );
  });

  it("helper methods work properly (analyzePalette, suggestFix, buildSnippet, getPreset)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });

    await client.analyzePalette(["#E69F00", "#56B4E9"]);
    await client.suggestFix("#E69F00", "#D55E00");
    await client.buildSnippet(["#E69F00", "#56B4E9"], "python");
    await client.getPreset("okabe-ito");

    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });

  it("getRun() fetches run by id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(MOCK_RUN_RESULT),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.getRun("run-palette-123");

    expect(res.run_id).toBe("run-palette-123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/runs/run-palette-123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    const queued = { run_id: "run-async", status: "queued" };
    const completed = { run_id: "run-async", status: "completed", result: { ready: true } };

    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      calls++;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify(calls > 1 ? completed : queued),
      };
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.waitForRun("run-async", { intervalMs: 10, timeoutMs: 500 });

    expect(res.status).toBe("completed");
    expect(calls).toBe(2);
  });

  it("waitForRun() throws PepkioAPIError if run fails with error", async () => {
    const failed = { run_id: "run-err", status: "failed", error: "Simulation failed" };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(failed),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("run-err", { intervalMs: 10, timeoutMs: 500 }),
    ).rejects.toThrow(PepkioAPIError);
  });

  it("waitForRun() throws PepkioAPIError on timeout", async () => {
    const queued = { run_id: "run-slow", status: "queued" };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify(queued),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("run-slow", { intervalMs: 5, timeoutMs: 20 }),
    ).rejects.toThrow(/Timed out waiting for run/);
  });

  it("throws PepkioAPIError if apiKey is missing for authenticated calls", async () => {
    const client = new PepkioClient({ apiKey: "" });
    await expect(
      client.run({ action: "analyze_palette", colors: ["#000000"] }),
    ).rejects.toThrow(PepkioAPIError);
  });

  it("throws PepkioAPIError on HTTP 400 error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: "Invalid palette hex code" }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({ action: "analyze_palette", colors: ["invalid"] }),
    ).rejects.toThrow("Invalid palette hex code");
  });

  it("throws PepkioAPIError when run result has error set", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({
        run_id: "run-err",
        status: "failed",
        error: "Color conversion error",
      }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({ action: "analyze_palette", colors: ["#123456"] }),
    ).rejects.toThrow("Color conversion error");
  });

  it("validates input schema with parseRunInput", () => {
    expect(() =>
      parseRunInput({
        action: "invalid_action",
      }),
    ).toThrow();

    const valid = parseRunInput({
      action: "analyze_palette",
      colors: ["#ffffff", "#000000"],
    });
    expect(valid.action).toBe("analyze_palette");
  });

  it("resolves base URL and api key properly", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");

    expect(apiPath("https://tools.pepkio.com", "/test")).toBe(
      "https://tools.pepkio.com/api/tools/v1/test",
    );
    expect(apiPath("https://tools.pepkio.com", "test")).toBe(
      "https://tools.pepkio.com/api/tools/v1/test",
    );

    const key = resolveApiKey("https://tools.pepkio.com", "explicit-key");
    expect(key).toBe("explicit-key");
  });
});
