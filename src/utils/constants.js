/**
 * Configuration constants and defaults for the QR label generator
 */

export const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'];

export const MONTH_NAMES = {
  '1': 'January',
  '2': 'February',
  '3': 'March',
  '4': 'April',
  '5': 'May',
  '6': 'June',
  '7': 'July',
  '8': 'August',
  '9': 'September',
  'A': 'October',
  'B': 'November',
  'C': 'December',
};

export const LABEL_DEFAULTS = {
  labelWidthCm: 4,
  labelHeightCm: 3,
  spacingXCm: 0.5,
  spacingYCm: 0.5,
  showBorder: true,
};

export const QR_CODE_CONFIG = {
  randomCodeLength: 3,
  randomCodeCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  codeFormat: (month, part1, part2) => `X${month}-${part1}-${part2}`,
};

export const PRINT_CONFIG = {
  dpi: 300,
  a4Width: 8.27, // inches
  a4Height: 11.69, // inches
  cmToInch: 2.54,
  qrSizeCm: 1,
};


export const AI_PROVIDERS = {
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-2.0-flash', needsKey: true },
  openai: { label: 'OpenAI (GPT)', defaultModel: 'gpt-4o-mini', needsKey: true },
  anthropic: { label: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-4-5-20250929', needsKey: true },
  groq: { label: 'Groq', defaultModel: 'llama-3.1-8b-instant', needsKey: true },
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-chat', needsKey: true },
  mistral: { label: 'Mistral AI', defaultModel: 'mistral-small-latest', needsKey: true },
  cohere: { label: 'Cohere', defaultModel: 'command-r-plus', needsKey: true },
  openrouter: { label: 'OpenRouter', defaultModel: 'meta-llama/llama-3-8b-instruct', needsKey: true },
  ollama: { label: 'Ollama (Local)', defaultModel: 'llama3', needsKey: false },
};

export const AI_DEFAULTS = {
  provider: 'gemini',
  samplePrompt: 'I want 5 QR codes with "ID: {n}" starting from 1, 3 barcodes with "SKU-{n}" starting from 100, and 2 data matrix codes with "DM-{n}". Paper size A4, 4 per row, label size 4cm x 3cm, brand name "Tech", output as PDF.',
};
