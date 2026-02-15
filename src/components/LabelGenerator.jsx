import React, { useState, useRef } from 'react'
import { QrCode, Sparkles, PenLine, FileUp, SlidersHorizontal, LayoutTemplate } from 'lucide-react'
import { HistorySection } from './HistoryModal'
import { Header } from '../layout/Header'
import { AIPromptForm } from './AIPromptForm'
import { ManualForm } from './ManualForm'
import { ImportForm } from './ImportForm'
import { SettingsForm } from './SettingsForm'
import { LabelsDisplay } from './LabelsDisplay'
import { useLabels } from '../hooks/useLabels'
import { usePrintSettings } from '../hooks/usePrintSettings'
import { generateExportWithWorker } from '../utils/sheetExporter'
import { useLocale } from '../i18n/LocaleContext'

const MODE_ICONS = {
  manual: PenLine,
  ai: Sparkles,
  import: FileUp,
}



export const LabelGenerator = () => {
  const { t } = useLocale()

  const MODES = [
    { key: 'manual', label: t('modes.manual'), icon: MODE_ICONS.manual },
    { key: 'ai', label: t('modes.ai'), icon: MODE_ICONS.ai },
    { key: 'import', label: t('modes.import'), icon: MODE_ICONS.import },
  ]
  const [mode, setMode] = useState('manual')
  const [aiConfig, setAiConfig] = useState(null)
  const [exportFormat, setExportFormat] = useState('png')
  const [isExporting, setIsExporting] = useState(false)

  // ManualForm state lifted here so it persists across tab switches
  const [manualType, setManualType] = useState('qr')
  const [manualData, setManualData] = useState('')
  const [manualCount, setManualCount] = useState(1)

  const printSettings = usePrintSettings()
  const { labels, history, addLabelsFromConfig, removeLabel, clearAllLabels, clearHistory, addToHistory, setLabels } = useLabels({
    logoImage: printSettings.logoImage,
    showLogo: printSettings.showLogo,
    logoPosition: printSettings.logoPosition,
  })



  const labelsRef = useRef(null)
  
  const handleConfigReady = (config) => {
    setAiConfig(config)
    if (config.outputFormat) setExportFormat(config.outputFormat)
    // Use brand name from settings if not provided in config
    const finalConfig = {
      ...config,
      brandName: config.brandName || printSettings.brandName,
    }
    clearAllLabels()
    addLabelsFromConfig(finalConfig)
    
    // Scroll to labels after a short delay to allow render
    setTimeout(() => {
      labelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleRestore = (restoredLabels) => {
    setLabels(restoredLabels)
    // Scroll to labels after restore
    setTimeout(() => {
      labelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseSettings = printSettings.getSettings()
      const settings = {
        ...baseSettings,
        columnsPerRow: baseSettings.columnsPerRow || aiConfig?.columnsPerRow || null,
      }
      
      await generateExportWithWorker(labels, settings, exportFormat)
      addToHistory(exportFormat)
    } catch (error) {
      console.error('Export failed:', error)
      alert(t('exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  const activeMode = MODES.find((m) => m.key === mode)

  return (
    <div className="sc-app">
      <Header icon={QrCode} />

      <section className="sc-hero">
        <div className="sc-hero__glow" />
        <div className="sc-hero__inner">
          <div className="sc-hero__badge">{t('hero.badge')}</div>
          <h2 className="sc-hero__title">
            {t('hero.title')} <span className="sc-hero__gradient-text">{t('hero.titleHighlight')}</span> {t('hero.titleEnd')}
          </h2>
          <p className="sc-hero__subtitle">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      <main className="sc-main">
        <section className="sc-card sc-card--builder sc-anim-fade">
          {/* ... existing builder code ... */}
          <div className="sc-card__header">
            <div>
              <h2 className="sc-card__title">{t('builder.title')}</h2>
              <p className="sc-card__description">{t('builder.description')}</p>
            </div>
          </div>

          <div className="sc-tabs">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`sc-tabs__item ${mode === key ? 'is-active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="sc-form-slot">
            {mode === 'ai' && <AIPromptForm onConfigReady={handleConfigReady} />}
            {mode === 'manual' && (
              <ManualForm
                onConfigReady={handleConfigReady}
                type={manualType}
                onTypeChange={setManualType}
                data={manualData}
                onDataChange={setManualData}
                count={manualCount}
                onCountChange={setManualCount}
              />
            )}
            {mode === 'import' && <ImportForm onConfigReady={handleConfigReady} />}
          </div>
        </section>

        <aside className="sc-sidebar">
          <section className="sc-card sc-card--side sc-anim-fade sc-anim-delay-1">
            <div className="sc-card__title-row">
              <h3 className="sc-card__side-title">{t('exportSettings.title')}</h3>
              <span className="sc-badge">
                <SlidersHorizontal size={14} />
                {t('exportSettings.badge')}
              </span>
            </div>
            <p className="sc-card__note">{t('exportSettings.note')}</p>
            <SettingsForm
              sizingMode={printSettings.sizingMode}
              onSizingModeChange={printSettings.setSizingMode}
              columns={printSettings.columns}
              onColumnsChange={printSettings.setColumns}
              rows={printSettings.rows}
              onRowsChange={printSettings.setRows}
              labelWidthCm={printSettings.labelWidthCm}
              onLabelWidthChange={printSettings.setLabelWidthCm}
              labelHeightCm={printSettings.labelHeightCm}
              onLabelHeightChange={printSettings.setLabelHeightCm}
              brandName={printSettings.brandName}
              onBrandNameChange={printSettings.setBrandName}
              showBrandName={printSettings.showBrandName}
              onShowBrandNameChange={printSettings.setShowBrandName}
              brandFontSize={printSettings.brandFontSize}
              onBrandFontSizeChange={printSettings.setBrandFontSize}
              showDataText={printSettings.showDataText}
              onShowDataTextChange={printSettings.setShowDataText}
              dataFontSize={printSettings.dataFontSize}
              onDataFontSizeChange={printSettings.setDataFontSize}
              showBorder={printSettings.showBorder}
              onShowBorderChange={printSettings.setShowBorder}
              logoImage={printSettings.logoImage}
              onLogoImageChange={printSettings.setLogoImage}
              showLogo={printSettings.showLogo}
              onShowLogoChange={printSettings.setShowLogo}
              logoPosition={printSettings.logoPosition}
              onLogoPositionChange={printSettings.setLogoPosition}
              onResetDefaults={printSettings.resetToDefaults}
              savedTemplates={printSettings.savedTemplates}
              activeTemplateId={printSettings.activeTemplateId}
              onSaveTemplate={printSettings.saveTemplate}
              onDeleteTemplate={printSettings.deleteTemplate}
              onLoadTemplate={printSettings.loadTemplate}
              onUnloadTemplate={printSettings.unloadTemplate}
              onImportTemplate={printSettings.importTemplate}
              onExportTemplate={printSettings.exportTemplate}
            />
          </section>

          <section className="sc-card sc-card--side sc-anim-fade sc-anim-delay-2">
            <div className="sc-card__title-row">
              <h3 className="sc-card__side-title">{t('session.title')}</h3>
            </div>
            <div className="sc-status-grid">
              <StatusChip label={t('session.mode')} value={activeMode?.label || t('modes.manual')} />
              <StatusChip label={t('session.readyLabels')} value={String(labels.length)} />
              <StatusChip label={t('session.export')} value={exportFormat.toUpperCase()} />
              <StatusChip label={t('session.columns')} value={String(aiConfig?.columnsPerRow || 4)} />
              <StatusChip label={t('session.perPage')} value={String(printSettings.getPageCapacity())} />
            </div>
          </section>
        </aside>
      </main>

      <div ref={labelsRef} className="sc-labels sc-anim-fade sc-anim-delay-3">
        <LabelsDisplay
          labels={labels}
          onRemove={removeLabel}
          onClearAll={clearAllLabels}
          onExport={handleExport}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          isExporting={isExporting}
        />
      </div>
      
      <div className="sc-history-wrapper">
        <HistorySection
          history={history}
          onClearHistory={clearHistory}
          onRestore={handleRestore}
        />
      </div>
    </div>
  )
}

function StatusChip({ label, value }) {
  return (
    <div className="sc-status-chip">
      <p className="sc-status-chip__label">{label}</p>
      <p className="sc-status-chip__value">{value}</p>
    </div>
  )
}

export default LabelGenerator
