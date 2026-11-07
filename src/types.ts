// SPDX-License-Identifier: MIT
export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
}

export interface RunResult<T = BioSafePaletteTesterResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type CvdType = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "grayscale";

export type ConflictStatus = "ok" | "warning" | "error";

export interface ConflictPair {
  indexA: number;
  indexB: number;
  deltaE: number;
  status: ConflictStatus;
  worstVision: CvdType;
}

export interface SimulatedPalette {
  cvd: CvdType;
  label: string;
  colors: string[];
}

export interface PaletteSlot {
  id: string;
  hex: string;
  valid: boolean;
  name: string;
}

/** Output shape returned by bio-safe-palette-tester */
export interface BioSafePaletteTesterResult {
  slots?: PaletteSlot[];
  colors?: string[];
  simulations?: SimulatedPalette[];
  conflicts?: ConflictPair[];
  conflict_labels?: string[];
  banner?: string | null;
  identical?: boolean;
  invalid_hexes?: string[];
  hex?: string;
  resolved?: boolean;
  warning?: string;
  content?: string;
  format?: string;
  snippets?: Record<string, string>;
  url?: string;
  used_default?: boolean;
  message?: string;
  valid?: boolean;
  normalized?: string | null;
  preset_id?: string;
  label?: string;
  error?: string;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;

  constructor(message: string, opts: { status: number; body?: unknown; runId?: string }) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
  }
}
