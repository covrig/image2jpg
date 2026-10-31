# IMAGE2JPG

A client-side, single-page web app that batch-converts images (HEIC, JPEG, PNG,
WebP, GIF, AVIF and more) to JPG with resizing and quality control — no uploads,
no server, no accounts.

Version 1.4.1 [1]

## Features

- **Batch conversion** — select or drag & drop multiple images [1]
- **HEIC / HEIF support** via lazy-loaded `libheif` WASM, only fetched when a HEIC file needs decoding [1]
- **True format detection** from file bytes, not the extension or MIME type, so a JPEG saved as `.heic` (or vice versa) is still handled correctly [1]
- **Scale presets** — 1080p / 720p box fit, or 25 / 50 / 75 / 100 % (percent mode default: 50 %) [1]
- **JPEG quality** — 60 / 70 / 80 / 85 / 90 / 100 % (default: 80 %) [1]
- **Built-in editor** — crop with draggable corners, straighten slider (−45° to +45°), perspective correction, plus annotations: arrow, circle, rectangle, loupe (1.5×–8×), move and text [1]
- **Full-screen viewer** — pinch/wheel zoom (up to 8×), pan, double-tap zoom, swipe/arrow-key navigation [1]
- **Custom file naming** — prefix, keep original name, date stamp, suffix, quality tag (`q80`), zero-padded index with custom start, digit count and separator [1]
- **Export** — ZIP download (`compression: STORE`, since JPEGs are already compressed) or native share sheet [1]
- **Works on phones and desktop** — responsive mobile layout plus a wide two-column desktop layout; PWA with install prompt and service worker for offline use [1]

## Usage

1. Open the page in a modern browser (Chrome, Edge, Safari, Firefox).
2. Tap **Select Images** or drag files anywhere on the page.
3. Pick a **Scale Size** and **Quality**.
4. Optionally tap a thumbnail to view, crop or annotate it (a pencil badge marks edited photos).
5. Press **Resize N images**.
6. Download the **ZIP** or press **Share**.
7. **RESET** clears the queue; size, quality and naming settings are kept.

## Output naming

Default pattern: `Image_01.jpg` — configurable via the ⚙ settings sheet.
Example with date + quality: `Image_2026_Oct_31_q80_01.jpg` [1]

Duplicate names are resolved automatically by appending `-2`, `-3`, … [1]

ZIP file name follows the batch: `Images_50pct_q80_12items_oct_26.zip` [1]

## How it works

- Conversion runs in a **Web Worker pool** with `OffscreenCanvas`, keeping the UI
  responsive; the pool size adapts to device cores and RAM (smaller on phones) [1]
- HEIC images are decoded with `libheif-js` 1.23.2; each decode has a 30 s timeout
  so a stuck WASM call cannot hang the progress overlay [1]
- Transparent pixels are flattened onto white, since JPEG has no alpha channel [1]
- Perspective crop uses a bilinear projective warp (Heckbert), capped at ~2× the
  output size to stay sharp and memory-friendly [1]
- If workers are unavailable, the app falls back to main-thread conversion [1]
- File bytes are copied into memory immediately on add, so cloud-synced or
  permission-revoked files cannot break the conversion later [1]
- Settings (theme, naming, share chunk size) persist in `localStorage` [1]

## Sharing notes

Android can reject large share payloads; the app automatically falls back to
sharing in slices and remembers the working slice size [1]
Batches over 100 MB are refused by the share sheet — download the ZIP instead [1]
On devices with no file-share support, the action bar shows the ZIP download only [1]

## Requirements & limits

- Internet access is needed on first use to fetch `jszip` and the HEIC decoder,
  after which they are cached for offline use [1]
- All processing happens locally in the browser — no image ever leaves the device
- Large batches may hit browser memory limits on low-RAM devices

## Dependencies

- [JSZip 3.10.1](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js) — ZIP archives [1]
- [libheif-js 1.23.2](https://cdn.jsdelivr.net/npm/libheif-js@1.23.2/libheif-wasm/libheif-bundle.js) — HEIC/HEIF decoding via WASM [1]

## Files

- `index.html` — the whole app (HTML, CSS, JS)
- `sw.js` — service worker for offline caching
- `manifest.webmanifest` — PWA manifest
- `favicon.png`, `apple-touch-icon.png`

## Run locally

Just open `index.html` in a browser, or serve it statically:

```bash
npx serve .
