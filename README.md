# IMAGE $\color{orangered}{\text{2}}$ JPG

A client-side, single-page web app that batch-converts images (HEIC, JPEG, PNG,
WebP, GIF, AVIF and more) to JPG with resizing and quality control — no uploads,
no server, no accounts.

## Features

- **Batch conversion** — select or drag & drop multiple images
- **HEIC / HEIF support** 
- **True format detection** from file bytes, not the extension or MIME type, so a JPEG saved as `.heic` (or vice versa) is still handled correctly
- **Scale presets** — 1080p / 720p box fit, or 25 / 50 / 75 / 100 % 
- **JPEG quality**
- **Built-in editor** — crop with draggable corners, autocrop, straighten slider (−45° to +45°), perspective correction, plus annotations: arrow, circle, rectangle, loupe and text
- **Full-screen viewer**
- **Custom file naming** — prefix, keep original name, date stamp, suffix, quality tag
- **Export** — ZIP download (`compression: STORE`, since JPEGs are already compressed) or native share sheet
- **Works on phones and desktop** —  PWA with install prompt and service worker for offline use

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
ZIP file name follows the batch: `Images_50pct_q80_12items_oct_26.zip`

## How it works

- Conversion runs in a **Web Worker pool** with `OffscreenCanvas`, keeping the UI
  responsive; the pool size adapts to device cores and RAM (smaller on phones)
- HEIC images are decoded with `libheif-js` 1.23.2; each decode has a 30 s timeout
  so a stuck WASM call cannot hang the progress overlay
- Transparent pixels are flattened onto white, since JPEG has no alpha channel
- If workers are unavailable, the app falls back to main-thread conversion
- File bytes are copied into memory immediately on add, so cloud-synced or
  permission-revoked files cannot break the conversion later
- Settings (theme, naming, share chunk size) persist in `localStorage`

## Sharing notes

Android can reject large share payloads; the app automatically falls back to
sharing in slices and remembers the working slice size
Batches over 100 MB are refused by the share sheet — download the ZIP instead
On devices with no file-share support, the action bar shows the ZIP download only

## Requirements & limits

- Internet access is needed on first use to fetch js files after which they are cached for offline use
- All processing happens locally in the browser — no image ever leaves the device
- Large batches may hit browser memory limits on low-RAM devices

## Dependencies

- JSZip ZIP archives
- libheif-js HEIC/HEIF decoding
- jscanify  auto crop
- opencv auto crop

## Files

- `index.html` — the whole app (HTML, CSS, JS)
- `sw.js` — service worker for offline caching
- `manifest.webmanifest` — PWA manifest

## Run locally

Just open `index.html` in a browser
