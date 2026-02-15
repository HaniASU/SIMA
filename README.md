# SIMA - Smart Label Generator

SIMA is a web-based label generator that lets you create, customize, and export print-ready QR codes, barcodes, and Data Matrix labels in bulk. Whether you need 5 labels or 1000, you can generate them manually, through natural language AI prompts, or by importing a spreadsheet.

Built with React and Vite. Exports to PDF, PNG, and SVG at 300 DPI - ready for professional printing.

**Live demo:** [simacode.netlify.app](https://siima.netlify.app/)

## What It Does

You pick a code type (QR, barcode, or Data Matrix), choose how many you need, and SIMA generates unique labels laid out on an A4 sheet. Every code is globally unique and tracked across sessions so you never get duplicates, even after closing the browser.

There are three ways to create labels:

- **Manual** - Pick a type, enter your data, set a quantity (up to 1000), and generate.
- **AI Prompt** - Describe what you want in plain English. Something like *"Generate 5 QR codes with product IDs and 3 barcodes for shipping"* and SIMA figures out the rest. Works with Gemini, OpenAI, Claude, Groq, DeepSeek, Mistral, Cohere, OpenRouter, and local Ollama.
- **Bulk Import** - Upload a CSV, Excel, or JSON file with your data. Download a template to get the format right. The import runs through strict validation before anything is generated.

You can mix different code types in the same batch - say, 5 QR codes and 3 barcodes on one sheet.

## Features

- Generate QR codes, CODE128 barcodes, and Data Matrix codes
- Batch generation from 1 to 1000 labels
- Unique code registry that persists in localStorage (no duplicates ever)
- Handles localStorage overflow gracefully by trimming old entries
- AI-powered generation with 9 LLM providers
- Bulk import from CSV, Excel (.xlsx/.xls), and JSON files
- Strict import validation (file type, columns, row-by-row checks, 1000 row cap)
- Color-coded type breakdown after upload (QR, Barcode, Data Matrix)
- Data preview table with toggle before generating
- Export to PDF (multi-page), PNG, and SVG at 300 DPI
- Customizable label size, grid layout, spacing, and padding
- Optional brand name, data text overlay, and border
- Four sizing modes: default, count-based, custom dimensions, or both
- Live thumbnail preview before export
- Sliding theme toggle with sun/moon icons (dark and light mode)
- Fully client-side - nothing leaves your browser

## Getting Started

### Option 1: Run with Docker (recommended)

No need to install Node.js - just have [Docker](https://www.docker.com/) installed.

```bash
docker compose up --build
```

Open `http://localhost:3000` in your browser.

### Option 2: Run with Node.js

```bash
# install dependencies
npm install

# start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

```bash
# build for production
npm run build
```

## How It Works

1. Choose a mode (Manual, AI, or Import)
2. Configure your labels - type, quantity, data pattern
3. Preview them in the production queue with live thumbnails
4. Adjust print settings if needed (label size, columns, brand text, etc.)
5. Export as PDF, PNG, or SVG and print

## Import Validation

When you upload a file through the Import tab, it goes through several checks before any labels are generated:

1. **File type** - Only CSV, XLSX, XLS, and JSON are accepted. Other formats like PDF or TXT are rejected with a clear message.
2. **Required columns** - The file must have `type`, `data`, and `count` columns. Column names are matched case-insensitively (so "Type", "TYPE", and "type" all work).
3. **Empty file detection** - Files with headers but no data rows are caught.
4. **Row limit** - Maximum 1000 rows per import to keep the browser responsive.
5. **Row-by-row checks** - Each row is validated individually:
   - `type` must be qr, barcode, or datamatrix
   - `data` cannot be empty
   - `count` must be a positive number
   - All errors are grouped per row and shown at once
6. **Preview before generating** - After validation, you see a summary with counts per type and can preview the parsed data in a table. You can also remove the file and start over. Labels are only created when you click the confirm button.

## Project Structure

```
src/
  components/     UI components (forms, display, settings)
  hooks/          State management (labels, print settings)
  utils/          Code generation, export, AI service, code registry
  layout/         Header with stats and theme toggle
  i18n/           Internationalization (English + Arabic)
  styles/         CSS
  workers/        Background export processing
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed architecture and data flow.

## Tech Stack

- React 18
- Vite 5
- qrcode - QR code generation
- JsBarcode - CODE128 barcodes
- bwip-js - Data Matrix codes
- jsPDF - PDF creation
- JSZip - Zip packaging for exports
- xlsx - Excel/CSV parsing
- lucide-react - Icons

## License

MIT
