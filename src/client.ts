// SPDX-License-Identifier: MIT
import {
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";
import {
  parseRunInput,
  type BioSafePaletteTesterFormat,
  type BioSafePaletteTesterInput,
  type BioSafePaletteTesterPreset,
} from "./schemas.js";
import {
  PepkioAPIError,
  type BioSafePaletteTesterResult,
  type ExampleMeta,
  type RunOptions,
  type RunResult,
  type ToolManifest,
} from "./types.js";

export interface PepkioClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export class PepkioClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private manifestCache: ToolManifest | undefined;

  constructor(opts: PepkioClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(opts.baseUrl);
    this.apiKey = resolveApiKey(this.baseUrl, opts.apiKey);
  }

  async getManifest(): Promise<ToolManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    const manifest = await this.request<ToolManifest>(
      "GET",
      `/tools/${TOOL_ID}/manifest`,
      undefined,
      { requireAuth: false },
    );
    this.manifestCache = manifest;
    return manifest;
  }

  listExamples(manifest?: ToolManifest): ExampleMeta[] {
    const m = manifest ?? this.manifestCache;
    if (!m?.examples) {
      return [];
    }
    return m.examples.map((e) => ({
      name: e.name,
      description: e.description,
    }));
  }

  async getExamples(manifest?: ToolManifest): Promise<ExampleMeta[]> {
    const m = manifest ?? (await this.getManifest());
    return this.listExamples(m);
  }

  async getExampleInput(
    name: string,
    manifest?: ToolManifest,
  ): Promise<BioSafePaletteTesterInput> {
    const m = manifest ?? (await this.getManifest());
    const example = m.examples?.find((e) => e.name === name);
    if (!example) {
      const available = m.examples?.map((e) => e.name).join(", ") ?? "(none)";
      throw new Error(`Example "${name}" not found. Available: ${available}`);
    }
    return parseRunInput(example.input);
  }

  async run(
    input: BioSafePaletteTesterInput,
    options?: RunOptions,
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    const validated = parseRunInput(input);
    return this.request<RunResult<BioSafePaletteTesterResult>>(
      "POST",
      `/tools/${TOOL_ID}/run`,
      { input: validated, options: options ?? {} },
      { requireAuth: true },
    );
  }

  async analyzePalette(
    colors: string[],
    options?: RunOptions,
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    return this.run({ action: "analyze_palette", colors }, options);
  }

  async suggestFix(
    colorA: string,
    colorB: string,
    options?: RunOptions,
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    return this.run({ action: "suggest_fix", color_a: colorA, color_b: colorB }, options);
  }

  async buildSnippet(
    colors: string[],
    format: BioSafePaletteTesterFormat = "hex",
    options?: RunOptions,
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    return this.run({ action: "build_snippet", colors, format }, options);
  }

  async getPreset(
    presetId: BioSafePaletteTesterPreset = "okabe-ito",
    options?: RunOptions,
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    return this.run({ action: "get_preset", preset_id: presetId }, options);
  }

  async getRun(runId: string): Promise<RunResult<BioSafePaletteTesterResult>> {
    return this.request<RunResult<BioSafePaletteTesterResult>>(
      "GET",
      `/runs/${runId}`,
      undefined,
      { requireAuth: true },
    );
  }

  async waitForRun(
    runId: string,
    opts: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<RunResult<BioSafePaletteTesterResult>> {
    const intervalMs = opts.intervalMs ?? 1000;
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.getRun(runId);
      if (result.status === "completed" || result.status === "failed") {
        if (result.error) {
          throw new PepkioAPIError(result.error, {
            status: 200,
            body: result,
            runId,
          });
        }
        return result;
      }
      await sleep(intervalMs);
    }

    throw new PepkioAPIError(`Timed out waiting for run ${runId}`, {
      status: 408,
      runId,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts: { requireAuth?: boolean } = {},
  ): Promise<T> {
    const requireAuth = opts.requireAuth ?? false;
    if (requireAuth && !this.apiKey) {
      throw new PepkioAPIError(
        "API key required. Set PEPKIO_API_KEY (or LOCAL_PEPKIO_API_KEY for local dev).",
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const url = apiPath(this.baseUrl, path);
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown;
    const text = await response.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const message =
        typeof parsed === "object" &&
        parsed !== null &&
        "error" in parsed &&
        typeof (parsed as { error: unknown }).error === "string"
          ? (parsed as { error: string }).error
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new PepkioAPIError(message, {
        status: response.status,
        body: parsed,
      });
    }

    const runResult = parsed as RunResult<BioSafePaletteTesterResult>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      runResult.error
    ) {
      throw new PepkioAPIError(runResult.error, {
        status: response.status,
        body: parsed,
        runId: runResult.run_id,
      });
    }

    return parsed as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
