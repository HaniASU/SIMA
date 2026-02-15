import { useState } from 'react';
import { LABEL_DEFAULTS } from '../utils/constants';

// A4 dimensions in cm
const A4_WIDTH_CM = 21;
const A4_HEIGHT_CM = 29.7;

export const usePrintSettings = () => {
  const [showBorder, setShowBorder] = useState(LABEL_DEFAULTS.showBorder);
  const [brandName, setBrandName] = useState('');
  const [showBrandName, setShowBrandName] = useState(true);
  const [brandFontSize, setBrandFontSize] = useState(12);
  const [showDataText, setShowDataText] = useState(false);
  const [dataFontSize, setDataFontSize] = useState(10);

  // 'default' | 'count' | 'custom' | 'both'
  const [sizingMode, setSizingMode] = useState('default');
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(6);
  const [labelWidthCm, setLabelWidthCm] = useState(LABEL_DEFAULTS.labelWidthCm);

  const [labelHeightCm, setLabelHeightCm] = useState(LABEL_DEFAULTS.labelHeightCm);

  // Logo Settings
  const [logoImage, setLogoImage] = useState(null); // Base64 string
  const [showLogo, setShowLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState('center'); // 'center', 'top-left', 'bottom-right'

  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('sima-print-templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const saveTemplate = (name) => {
    const newTemplate = {
      id: Date.now().toString(),
      name,
      settings: {
        showBorder,
        brandName,
        showBrandName,
        brandFontSize,
        showDataText,
        dataFontSize,
        sizingMode,
        columns,
        rows,
        labelWidthCm,
        labelHeightCm,
        showLogo,
        logoPosition,
        logoImage
      }
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('sima-print-templates', JSON.stringify(updated));
    setActiveTemplateId(newTemplate.id); // Auto-activate saved template
  };

  const deleteTemplate = (id) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('sima-print-templates', JSON.stringify(updated));
    if (activeTemplateId === id) setActiveTemplateId(null);
  };

  const loadTemplate = (template) => {
    const s = template.settings;
    if (s.showBorder !== undefined) setShowBorder(s.showBorder);
    if (s.brandName !== undefined) setBrandName(s.brandName);
    if (s.showBrandName !== undefined) setShowBrandName(s.showBrandName);
    if (s.brandFontSize !== undefined) setBrandFontSize(s.brandFontSize);
    if (s.showDataText !== undefined) setShowDataText(s.showDataText);
    if (s.dataFontSize !== undefined) setDataFontSize(s.dataFontSize);
    if (s.sizingMode !== undefined) setSizingMode(s.sizingMode);
    if (s.columns !== undefined) setColumns(s.columns);
    if (s.rows !== undefined) setRows(s.rows);
    if (s.labelWidthCm !== undefined) setLabelWidthCm(s.labelWidthCm);
    if (s.labelHeightCm !== undefined) setLabelHeightCm(s.labelHeightCm);
    if (s.showLogo !== undefined) setShowLogo(s.showLogo);
    if (s.logoPosition !== undefined) setLogoPosition(s.logoPosition);
    if (s.logoImage !== undefined) setLogoImage(s.logoImage);
    setActiveTemplateId(template.id);
  };

  const unloadTemplate = () => {
    setActiveTemplateId(null);
  };

  const importTemplate = (fileContent) => {
    try {
      const template = JSON.parse(fileContent);
      if (!template.name || !template.settings) throw new Error('Invalid template');
      // Ensure unique ID
      const newTemplate = { ...template, id: Date.now().toString() };
      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem('sima-print-templates', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const exportTemplate = (template) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${template.name.replace(/\s+/g, '_')}_template.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const resetToDefaults = () => {
    setShowBorder(LABEL_DEFAULTS.showBorder);
    setBrandName('');
    setShowBrandName(true);
    setBrandFontSize(12);
    setShowDataText(false);
    setDataFontSize(10);
    setSizingMode('default');
    setColumns(4);
    setRows(6);
    setLabelWidthCm(LABEL_DEFAULTS.labelWidthCm);
    setLabelHeightCm(LABEL_DEFAULTS.labelHeightCm);
    setLogoImage(null);
    setShowLogo(false);
    setLogoPosition('center');
  };

  const getSettings = () => {
    const spacingCm = 0.3;
    let finalWidth, finalHeight, forcedCols;

    if (sizingMode === 'count') {
      // Auto-calculate label size from columns & rows
      finalWidth = (A4_WIDTH_CM - spacingCm * (columns + 1)) / columns;
      finalHeight = (A4_HEIGHT_CM - spacingCm * (rows + 1)) / rows;
      forcedCols = columns;
    } else if (sizingMode === 'custom') {
      // User-specified dimensions, auto-fit as many as possible
      finalWidth = labelWidthCm;
      finalHeight = labelHeightCm;
      forcedCols = null;
    } else if (sizingMode === 'both') {
      // User-specified dimensions + forced column count
      finalWidth = labelWidthCm;
      finalHeight = labelHeightCm;
      forcedCols = columns;
    } else {
      // default -fixed constants
      finalWidth = LABEL_DEFAULTS.labelWidthCm;
      finalHeight = LABEL_DEFAULTS.labelHeightCm;
      forcedCols = null;
    }

    return {
      labelWidthCm: finalWidth,
      labelHeightCm: finalHeight,
      spacingXCm: spacingCm,
      spacingYCm: spacingCm,
      columnsPerRow: forcedCols,
      showBorder,
      brandName,
      showBrandName,
      brandFontSize,
      showDataText,
      dataFontSize,
      logoImage,
      showLogo,
      logoPosition,
      savedTemplates // Expose templates if needed downstream, but mostly just used in UI
    };
  };

  const getPageCapacity = () => {
    const spacingCm = 0.3;
    const settings = getSettings();
    const w = settings.labelWidthCm;
    const h = settings.labelHeightCm;
    const cols = settings.columnsPerRow || Math.floor((A4_WIDTH_CM + spacingCm) / (w + spacingCm));
    const rowsFit = Math.floor((A4_HEIGHT_CM + spacingCm) / (h + spacingCm));
    return cols * rowsFit;
  };

  return {
    showBorder,
    setShowBorder,
    brandName,
    setBrandName,
    showBrandName,
    setShowBrandName,
    brandFontSize,
    setBrandFontSize,
    showDataText,
    setShowDataText,
    dataFontSize,
    setDataFontSize,
    sizingMode,
    setSizingMode,
    columns,
    setColumns,
    rows,
    setRows,
    labelWidthCm,
    setLabelWidthCm,
    labelHeightCm,
    setLabelHeightCm,
    logoImage,
    setLogoImage,
    showLogo,
    setShowLogo,
    logoPosition,
    setLogoPosition,
    resetToDefaults,
    getSettings,
    getPageCapacity,
    // Template props
    savedTemplates,
    activeTemplateId,
    saveTemplate,
    deleteTemplate,
    loadTemplate,
    unloadTemplate,
    importTemplate,
    exportTemplate
  };
};
