# IMAGE $\color{orangered}{\text{2}}$ JPG

A client-side, single-page web app that batch-converts images (HEIC, JPEG, PNG, WebP, GIF, AVIF and more) to JPG with resizing and quality control. All processing happens locally in the browser - no image ever leaves the device.

<img width="2133" height="1159" alt="image" src="https://github.com/user-attachments/assets/7f0f7d72-7853-43ec-a676-6d6c82c6f9aa" />

## Features

- **Batch conversion** — select or drag & drop multiple images
- **HEIC / HEIF support** 
- **True format detection** from file bytes, not the extension or MIME type, so a JPEG saved as `.heic` (or vice versa) is still handled correctly
- **Scale presets** — 1080p / 720p box fit, or 25 / 50 / 75 / 100 % 
- **JPEG quality**
- **Built-in editor** — crop with draggable corners, autocrop, straighten slider (−45° to +45°), perspective correction, plus annotations: arrow, circle, rectangle, loupe and text
- **Custom file naming** — prefix, keep original name, date stamp, suffix, quality tag
- **Export** — ZIP download or mobile share (email, IM)
- **Works on phones and desktop** —  PWA with install prompt and service worker for offline use

## Usage

1. Open the page in a modern browser (Chrome, Edge, Safari, Firefox).
2. Tap **Select Images** or drag files anywhere on the page.
3. Pick a **Scale Size** and **Quality**. Optional.
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
- HEIC images are decoded with `libheif-js`; 
- Transparent pixels are flattened onto white, since JPEG has no alpha channel
- Settings (theme, naming, share chunk size) persist in `localStorage`

## Sharing notes

Phones can reject large share payloads; the app automatically falls back to
sharing in slices and remembers the working slice size
Batches over 100 MB are refused by the share sheet — download the ZIP instead
On devices with no file-share support, the action bar shows the ZIP download only

## Requirements & limits

- Internet access is needed on first use to fetch js files after which they are cached for offline use
- Large batches may hit browser memory limits on low-RAM devices

## Dependencies

- jszip ZIP archives
- libheif-js HEIC/HEIF decoding
- jscanify and opencv for auto crop documents and signs

## Files

- `index.html` — the whole app (HTML, CSS, JS)
- `sw.js` — service worker for offline caching
- `manifest.webmanifest` — PWA manifest

## Run locally

Just open `index.html` in a browser
