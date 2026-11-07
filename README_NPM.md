# Pepkio Bio-Safe Palette Tester

Node.js and TypeScript client library with CLI for testing scientific color palettes against colorblindness simulations, CIEDE2000 contrast thresholds, and grayscale print legibility via the Pepkio Tools API.

# What It Does

Scientific figures in life sciences and bioinformatics rely on color coding across single-cell embeddings, multi-panel heatmaps, flow cytometry gates, and microscopy. Over 8% of male and 0.5% of female readers experience Color Vision Deficiency (CVD). Problematic color choices can obscure critical biological findings and fail completely in grayscale print reproduction.

This package provides a typed Node.js client and command-line interface for the hosted Pepkio Bio-Safe Palette Tester REST API. It performs dichromatic CVD simulations (protanopia, deuteranopia, tritanopia) and monochrome luminance conversion, computes pairwise perceptual color differences using the CIEDE2000 ($\Delta E$) metric, suggests automated CIELAB lightness corrections to resolve contrast conflicts, and exports ready-to-use palette code for R, Python, and GraphPad Prism.

Programmatic runs require a network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools API.

# Features

- **Color Vision Deficiency (CVD) Simulation**: Real-time simulation of protanopia, deuteranopia, tritanopia, and grayscale/monochrome conversion.
- **Perceptual Contrast Validation**: Calculates pairwise CIEDE2000 $\Delta E$ distances and flags severe indistinguishability ($\Delta E < 5$) and low contrast ($\Delta E < 10$).
- **Automated Conflict Resolution**: Intelligently adjusts lightness and chroma in CIELAB space to resolve color clashes while preserving palette identity.
- **Scientific Presets**: Built-in access to curated accessible palettes including Okabe-Ito, Wong, Paul Tol, and Viridis.
- **Multi-Environment Code Export**: Generates copy-paste code snippets for R (`ggplot2`), Python (`matplotlib`/`seaborn`), GraphPad Prism, and raw HEX lists.
- **Typed ESM Client**: Full TypeScript definitions with Zod validation and promise-based client methods (`getManifest`, `listExamples`, `getExampleInput`, `run`, `analyzePalette`, `suggestFix`, `buildSnippet`, `getPreset`).
- **CLI Utilities**: Inspect manifests and execute palette evaluations directly from the command line.
- **Shareable Permalinks**: Generates permanent calculation URLs for reproducible documentation and electronic lab notebooks.

# Installation

```bash
npm install pepkio-bio-safe-palette-tester
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-bio-safe-palette-tester";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// 1. Evaluate an Okabe-Ito palette for accessibility conflicts
const analysisInput = await client.getExampleInput("analyze_okabe_ito");
const analysisResult = await client.run(analysisInput);
console.log("Status:", analysisResult.status);
console.log("Colors tested:", analysisResult.result?.colors);
console.log("Simulations generated:", analysisResult.result?.simulations?.length);
console.log("Permalink:", analysisResult.permalink);

// 2. Automatically resolve a low-contrast pair
const fixResult = await client.suggestFix("#E69F00", "#D55E00");
console.log("Suggested replacement:", fixResult.result?.hex);
console.log("Resolved:", fixResult.result?.resolved);
```

# CLI

```bash
# List available manifest examples
npx pepkio-bio-safe-palette-tester manifest --examples

# Run a palette analysis example
npx pepkio-bio-safe-palette-tester run --example analyze_okabe_ito
```

# Typical Use Cases

- **Scientific Manuscript Preparation**: Validate categorical palettes in UMAP single-cell embeddings, survival plots, and multi-channel microscopy to ensure compliance with Nature, Cell, and Science accessibility policies.
- **Grayscale Print Readiness**: Verify that figure panels and bar graphs maintain sufficient luminance contrast when printed on standard monochrome lab printers.
- **Automated Visualization Pipelines**: Integrate palette testing into Node.js CI/CD figure validation workflows before publishing.
- **Color Conflict Resolution**: Quickly fix indistinguishable color pairs by automatically tuning CIELAB lightness while preserving color hues.
- **Cross-Platform Visualization Themes**: Export validated palettes directly into R (`ggplot2`), Python (`matplotlib`/`seaborn`), and GraphPad Prism formats.

# Scientific Background

Standard computer graphics representations (sRGB) and Euclidean distance metrics do not account for non-linear human visual perception. The CIEDE2000 standard ($\Delta E_{00}$) provides a perceptually uniform color difference metric incorporating lightness, chroma, and hue weighting functions.

Color vision deficiency simulations model reduction of retinal cone pigments using validated projection transformations (Viénot 1999, Brettel 1997). Protanopia simulates absence of L-cones (long wavelength, red), deuteranopia models absence of M-cones (medium wavelength, green), and tritanopia simulates absence of S-cones (short wavelength, blue). Grayscale conversion calculates perceptual luminance ($L^*$) to ensure accessibility in black-and-white printing.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/bio-safe-palette-tester

The web interface features interactive color swatches, real-time CVD simulation cards, pairwise difference heatmaps, and instant code export.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-bio-safe-palette-tester-js

Web Application: https://www.pepkio.com/tools/bio-safe-palette-tester

Python client (PyPI): https://pypi.org/project/pepkio-bio-safe-palette-tester/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/e3350fee2d4a7e43c6a41473d1027a68a12c9348e4a62895c06c07f417152ea6)
