// SPDX-License-Identifier: MIT
import { z } from "zod";

export const bioSafePaletteTesterActionSchema = z.enum([
  "analyze_palette",
  "suggest_fix",
  "build_snippet",
  "build_all_snippets",
  "parse_palette_url",
  "encode_palette_url",
  "validate_hex",
  "get_preset",
]);

export const bioSafePaletteTesterFormatSchema = z.enum([
  "r",
  "python",
  "prism",
  "hex",
  "url",
]);

export const bioSafePaletteTesterPresetSchema = z.enum([
  "okabe-ito",
  "wong",
  "tol",
  "viridis",
]);

export const bioSafePaletteTesterSimulationModeSchema = z.enum([
  "swatches",
  "mini-plots",
]);

export const bioSafePaletteTesterBackgroundSchema = z.enum([
  "light",
  "dark",
]);

export const bioSafePaletteTesterInputSchema = z.object({
  action: bioSafePaletteTesterActionSchema,
  colors: z.array(z.string()).optional(),
  color_a: z.string().optional(),
  color_b: z.string().optional(),
  format: bioSafePaletteTesterFormatSchema.optional(),
  colors_param: z.string().optional(),
  preset_id: bioSafePaletteTesterPresetSchema.optional(),
  origin: z.string().optional(),
  pathname: z.string().optional(),
  simulation_mode: bioSafePaletteTesterSimulationModeSchema.optional(),
  background: bioSafePaletteTesterBackgroundSchema.optional(),
});

export type BioSafePaletteTesterAction = z.infer<typeof bioSafePaletteTesterActionSchema>;
export type BioSafePaletteTesterFormat = z.infer<typeof bioSafePaletteTesterFormatSchema>;
export type BioSafePaletteTesterPreset = z.infer<typeof bioSafePaletteTesterPresetSchema>;
export type BioSafePaletteTesterSimulationMode = z.infer<typeof bioSafePaletteTesterSimulationModeSchema>;
export type BioSafePaletteTesterBackground = z.infer<typeof bioSafePaletteTesterBackgroundSchema>;
export type BioSafePaletteTesterInput = z.infer<typeof bioSafePaletteTesterInputSchema>;

export function parseRunInput(input: unknown): BioSafePaletteTesterInput {
  return bioSafePaletteTesterInputSchema.parse(input);
}
