export const en = {
  // Header
  header: {
    title: 'SIMA',
    subtitle: 'Professional Code Generation Suite',
    activeMode: 'Active Mode',
    queue: 'Queue',
    labelsCount: '{count} codes',
    history: 'History',
    theme: 'Theme',
    language: 'Language',
  },

  // Hero
  hero: {
    badge: 'AI-powered code generation',
    title: 'Generate',
    titleHighlight: 'smart codes',
    titleEnd: 'at lightning speed with AI',
    subtitle: 'Create, customize, and export print-ready codes with AI assistance. Manual entry, AI prompts, or bulk upload.',
  },

  // Modes
  modes: {
    manual: 'Manual',
    ai: 'AI',
    import: 'Upload',
  },

  // Label Builder
  builder: {
    title: 'Label Builder',
    description: 'Select a mode below to begin.',
  },

  // Export Settings sidebar
  exportSettings: {
    title: 'Export Settings',
    badge: 'Real-time Preview',
    note: 'Configure export layout and label appearance.',
  },

  // Session Summary
  session: {
    title: 'Session Summary',
    mode: 'Mode',
    readyLabels: 'Ready Labels',
    export: 'Export',
    columns: 'Columns',
    perPage: 'Per Page',
  },

  // Manual Form
  manual: {
    codeType: 'Code Type',
    qrCode: 'QR Code',
    barcode: 'Barcode',
    dataMatrix: 'Data Matrix',
    contentData: 'Content / Data',
    contentPlaceholder: 'https://example.com, SKU-001, or any text',
    contentHint: 'This value will be encoded exactly as written.',
    quantity: 'Quantity',
    generate: 'Generate',
  },

  // AI Prompt Form
  ai: {
    provider: 'AI Provider',
    model: 'Model',
    loadingModels: 'Loading models...',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Paste API key',
    prompt: 'Prompt',
    promptPlaceholder: 'Example: "5 QR with ID-{n} and 3 barcodes with SKU-{n}, 4 columns, A4, 4x3 cm, brand Tech, export PDF."',
    useSample: 'Use Sample Prompt',
    analyzing: 'Analyzing...',
    analyzeWithAI: 'Analyze with AI',
    analysisFailed: 'AI analysis failed.',
    configPreview: 'AI Config Preview',
    codes: 'codes',
    paper: 'Paper',
    output: 'Output',
    size: 'Size',
    brand: 'Brand',
    providerLabel: 'Provider',
    none: 'None',
    confirmGenerate: 'Confirm and Generate',
  },

  // Upload Form
  import: {
    settingsNotice: 'Export Settings apply globally.',
    settingsNoticeDesc: 'Brand, border, data text, and label sizing from Export Settings are applied to all uploaded labels, same as Manual mode.',
    step1Title: 'Step 1: Download template',
    step1Desc: 'Columns:',
    csvTemplate: 'CSV template',
    excelTemplate: 'Excel template',
    jsonTemplate: 'JSON template',
    step2Title: 'Step 2: Upload filled file',
    step2Desc: 'Accepted formats: CSV, XLSX, XLS, JSON.',
    chooseFile: 'Choose file',
    importError: 'Upload error',
    parsedSuccess: 'Parsed successfully',
    rows: 'rows',
    hideData: 'Hide data',
    previewData: 'Preview data',
    total: 'Total',
    showingOf: 'Showing 12 of',
    generateCodes: 'Generate {count} Codes',
    type: 'Type',
    data: 'Data',
    count: 'Count',
  },

  // Settings Form
  settings: {
    templates: 'Templates',
    templatesHint: 'Load custom print layouts.',
    importBtn: 'Upload',
    settingsLocked: 'Settings are locked while template is active.',
    exportTemplate: 'Export Template',
    load: 'Load',
    noTemplates: 'No templates saved. Configure settings below and save using the buttons at the bottom.',
    labelSizing: 'Label sizing',
    labelSizingHint: 'Choose how labels are sized on the page.',
    default: 'Default',
    count: 'Count',
    custom: 'Custom',
    both: 'Both',
    columnsLabel: 'Columns',
    rowsLabel: 'Rows',
    widthCm: 'Width (cm)',
    heightCm: 'Height (cm)',
    showBrandTitle: 'Show brand title',
    showBrandTitleDesc: 'Display brand name above each code.',
    brandName: 'Brand Name',
    brandNamePlaceholder: 'e.g. My Company',
    fontSize: 'Font Size (px)',
    showBrandLogo: 'Show Brand Logo',
    showBrandLogoDesc: 'Overlay a center logo on QR codes.',
    uploadBrandLogo: 'Upload Brand Logo',
    uploadHint: 'PNG or JPG - Max 1MB - Square recommended',
    brandLogo: 'Brand Logo',
    readyForOverlay: 'Ready for overlay',
    position: 'Position',
    showContentData: 'Show content / data',
    showContentDataDesc: 'Display data text below each code.',
    dataFontSize: 'Data Font Size (px)',
    showBorder: 'Show border',
    showBorderDesc: 'Border around each label for cutting.',
    templateNamePlaceholder: 'Template name...',
    save: 'Save',
    cancel: 'Cancel',
    saveSettings: 'Save Settings',
    reset: 'Reset',
  },

  // Labels Display
  labels: {
    productionQueue: 'Generated Codes',
    labelsReady: '{count} code{s} ready',
    clear: 'Clear',
    export: 'Export',
    readyToCreate: 'Ready to create?',
    emptyHint: 'Select a mode above to start generating professional codes.',
    removeLabel: 'Remove code',
  },

  // History Section
  history: {
    title: 'Export History',
    subtitle: 'Restore previous batches',
    showHistory: 'Show History',
    hideHistory: 'Hide History',
    noHistory: 'No export history yet.',
    labelsText: 'codes',
    clearHistory: 'Clear History',
    clearConfirm: 'Clear all history?',
  },

  // Export
  exportFailed: 'Export failed. Please try again.',
}
