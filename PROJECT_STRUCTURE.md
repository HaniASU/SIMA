# Project Architecture & Structure

## Directory Layout

```
sima/
├── public/
│   ├── icon.svg                     (App icon - SVG QR-style mark)
│   └── manifest.json                (PWA web app manifest)
├── src/
│   ├── components/
│   │   ├── LabelGenerator.jsx       (Main orchestrator: state, UI, export logic)
│   │   ├── ManualForm.jsx           (Single-batch label creation)
│   │   ├── AIPromptForm.jsx         (LLM-driven configuration parser)
│   │   ├── ImportForm.jsx           (Bulk data import with schema validation)
│   │   ├── SettingsForm.jsx         (Print layout, styling, and template controls)
│   │   ├── LabelsDisplay.jsx        (Grid visualization and export triggers)
│   │   ├── HistoryModal.jsx         (Collapsible export history section)
│   │   └── Button.jsx               (Reusable button component)
│   ├── hooks/
│   │   ├── useLabels.js             (State management for label entities)
│   │   └── usePrintSettings.js      (Configuration state, templates, page capacity)
│   ├── layout/
│   │   └── Header.jsx               (Brand, language toggle, theme toggle)
│   ├── i18n/
│   │   ├── LocaleContext.jsx        (React context provider for locale/direction)
│   │   ├── en.js                    (English translations)
│   │   └── ar.js                    (Arabic translations - Egyptian dialect)
│   ├── styles/
│   │   └── app.css                  (Global design system)
│   ├── utils/
│   │   ├── constants.js             (System configuration and immutable data)
│   │   ├── codeRegistry.js          (Duplicate prevention registry)
│   │   ├── codeRegistry.test.js     (Unit tests for code registry)
│   │   ├── codeGenerator.js         (Code rendering engine: QR, Barcode, DataMatrix)
│   │   ├── sheetExporter.js         (Worker bridge for export operations)
│   │   ├── aiService.js             (Unified LLM API integration layer)
│   │   └── aiService.test.js        (Unit tests for AI service)
│   ├── workers/
│   │   └── exportWorker.js          (Off-thread rendering and file generation)
│   ├── App.jsx                      (Application root)
│   └── main.jsx                     (Entry point)
├── index.html                       (Document entry with shimmer skeleton loader)
├── package.json                     (Dependency manifest)
├── vite.config.js                   (Bundler configuration)
├── vitest.config.js                 (Test runner configuration)
├── Dockerfile                       (Container definition)
├── docker-compose.yml               (Orchestration config)
├── nginx.conf                       (Production Nginx SPA config)
├── .dockerignore                    (Docker build exclusions)
├── .gitignore                       (Git tracking exclusions)
└── README.md                        (User-facing documentation)
```

## System Architecture

The application follows a modular, component-driven architecture with clear separation of concerns. Compute-intensive tasks are offloaded to Web Workers to ensure main-thread responsiveness. All state lives client-side with localStorage persistence for templates, history, theme, locale, and the code registry.

```mermaid
graph TD
    Client[Client Browser] --> UI[UI Components]
    UI --> Hooks[Custom Hooks (State)]
    Hooks --> Utils[Utility Layer]
    Utils --> AI[AI Service (External APIs)]
    Utils --> Registry[Code Registry (LocalStorage)]

    subgraph "Main Thread"
        UI
        Hooks
        Utils
    end

    subgraph "Worker Thread"
        Worker[Export Worker]
    end

    UI -- Async Message --> Worker
    Worker -- Blob/File --> UI
```

## Loading Experience (`index.html`)

The `index.html` is more than a document entry point — it contains an inline shimmer skeleton loader that displays instantly while JavaScript bundles are loading. This eliminates Flash of Unstyled Content (FOUC).

- **Theme-Aware**: Reads the saved theme from `localStorage` (`sima-theme`) before React mounts and applies the correct shimmer colors (light or dark).
- **FOUC Prevention**: The `#root` element is hidden via CSS until React adds a `.ready` class after hydration.
- **Skeleton Layout**: Mirrors the actual app layout (header with brand area and stats, hero section, form card with tabs and inputs, sidebar cards) using shimmer-animated placeholder blocks.
- **Responsive**: The skeleton adapts to viewport size with media queries at 1024px and 680px breakpoints.
- **Fade-Out Transition**: When the app is ready, the skeleton fades out with a 400ms opacity transition before being removed.

## Core Components

### LabelGenerator (Orchestrator)
Central hub managing application state and workflow. Coordinates interactions between input forms (Manual, AI, Import), the settings sidebar, session summary, labels display, and the export history section. Handles asynchronous export requests via the worker bridge.

### AIPromptForm
Natural language processing interface. Integrates with `aiService` to transform unstructured user prompts into structured label configurations (JSON). Supports multiple providers (OpenAI, Anthropic, Gemini, Ollama, etc.) with runtime API key handling.

### ImportForm
Robust data ingestion module.
- **Parsing**: Supports CSV, Excel (XLSX/XLS), and JSON.
- **Validation**: Enforces strict schema (type, data, count) with row-level error reporting.
- **Sanitization**: Filters invalid types and normalizes input data before processing.

### SettingsForm
Print layout and appearance controls with a full template system.
- **Label Sizing**: Four modes (default, count-based, custom dimensions, or both).
- **Brand**: Optional brand name with font size control above each code.
- **Logo**: Upload a brand logo (PNG/JPG, max 1MB) with position options (center, top-left, bottom-right). Overlaid on QR codes.
- **Data Text**: Toggle data text display below each code with configurable font size.
- **Border**: Optional cutting border around each label.
- **Templates**: Save, load, delete, import, and export print setting templates. Templates persist in localStorage and include all settings (sizing, brand, logo, border).

### HistoryModal (Export History)
Collapsible section at the bottom of the page. Collapsed by default, expands on click to show previous export batches with format badge, timestamp, and a restore button. Each entry stores the full label set so you can reload a previous batch without regenerating.

### Button
Shared button component used across the app. Supports variants (primary, secondary, success, danger, ghost), sizes (sm, md, lg), full-width mode, and optional icon prop.

## Hooks

### useLabels
Manages the label array and export history. Handles adding labels from config objects, removing individual labels, clearing all, and maintaining a history log with timestamps and format metadata.

### usePrintSettings
Manages all print/export configuration state. Key features:
- **State**: Label dimensions, columns, rows, brand name, font sizes, logo image (base64), border toggle, sizing mode.
- **Templates**: Save current settings as a named template, load/delete/import/export templates. Stored in localStorage under `sima-print-templates`.
- **Page Capacity**: `getPageCapacity()` calculates how many codes fit on one A4 page based on the current settings (dimensions, spacing, columns).
- **Settings Resolver**: `getSettings()` computes final label dimensions based on the active sizing mode.

## Internationalization (i18n)

Built with a lightweight custom system (no external library). Uses React context for locale state and a dot-notation key resolver.

- **Languages**: English (`en.js`) and Arabic (`ar.js`, Egyptian dialect).
- **RTL Support**: Automatically sets `dir` and `lang` on the `<html>` element when switching to Arabic.
- **Persistence**: Selected locale is stored in localStorage under `sima-locale`.
- **Coverage**: All user-facing strings are translated. Tech terms like AI, API Key, QR Code, Barcode stay in English in both languages.

## Import/Export Worker (`exportWorker.js`)
Dedicated background thread for CPU-intensive rendering operations.
- **OffscreenCanvas**: Utilizes the OffscreenCanvas API to render graphics without DOM blocking.
- **Batch Processing**: Generates high-resolution (300 DPI) assets for large datasets.
- **Format Support**: Produces PDF (jsPDF), ZIP (JSZip for PNGs), and SVG outputs.

## Utility Layer

### aiService.js
Unified interface for Large Language Model interactions.
- **Abstraction**: Generic `makeAIRequest` handler standardizes error handling and response parsing across 9+ providers.
- **Prompt Engineering**: Injects system prompts to enforce strict JSON output formats.

### sheetExporter.js
Bridge module abstracting Web Worker communication.
- **Promise Wrapper**: Converts worker `postMessage` events into standard Promises for cleaner async/await usage in components.
- **Lifecycle Management**: Handles worker instantiation and termination.

### codeRegistry.js
Idempotency mechanism.
- **Persistence**: Uses `localStorage` to track generated code IDs.
- **Duplicate Detection**: Prevents re-generation of existing codes within a configurable history limit.

## PWA Support

The app includes a basic Progressive Web App setup via `public/manifest.json`.
- **Standalone Display**: Configured for standalone mode with portrait orientation.
- **Icon**: SVG app icon (`public/icon.svg`) — a QR-code-style mark on an indigo rounded-square.
- **Theme**: Dark theme color (`#09090b`) matching the app's dark mode.

## Deployment

### Docker + Nginx
The production setup uses a multi-concern Docker configuration:
- **`Dockerfile`**: Builds the Vite production bundle and serves it via Nginx.
- **`docker-compose.yml`**: Orchestrates the container (port 3000 → 80).
- **`nginx.conf`**: SPA-friendly Nginx config with `try_files` fallback to `index.html` for client-side routing.
- **`.dockerignore`**: Excludes `node_modules`, `dist`, `.git`, logs, env files, and markdown from the Docker build context.

## Testing Strategy

- **Unit Tests**: Powered by Vitest and React Testing Library.
- **Coverage**: Focuses on utility logic (`aiService`, `codeRegistry`) and critical unique-code enforcement.
- **Environment**: JSDOM for component testing, Node for pure logic.

### Test Files
- **`aiService.test.js`**: Tests AI prompt parsing — validates Ollama JSON responses, OpenAI markdown code-block extraction, and default-field injection for incomplete responses. Uses mocked global `fetch`.
- **`codeRegistry.test.js`**: Tests code registration and lookup — validates non-existence checks, registration + existence, multi-code handling, and localStorage persistence. Uses a mocked `localStorage`.
