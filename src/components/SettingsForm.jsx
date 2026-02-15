import { RotateCcw, Save, Trash2, FileText, Download, Upload, X, Lock, ImagePlus, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { useState, useRef, useEffect } from 'react'
import { useLocale } from '../i18n/LocaleContext'

export const SettingsForm = ({
  brandName,
  onBrandNameChange,
  showBrandName,
  onShowBrandNameChange,
  brandFontSize,
  onBrandFontSizeChange,
  logoImage,
  onLogoImageChange,
  showLogo,
  onShowLogoChange,
  logoPosition,
  onLogoPositionChange,
  showDataText,
  onShowDataTextChange,
  dataFontSize,
  onDataFontSizeChange,
  codeColor,
  onCodeColorChange,
  qrFillMode,
  onQrFillModeChange,
  qrPatternImage,
  onQrPatternImageChange,
  showBorder,
  onShowBorderChange,
  sizingMode,
  onSizingModeChange,
  columns,
  onColumnsChange,
  rows,
  onRowsChange,
  labelWidthCm,
  onLabelWidthChange,
  labelHeightCm,
  onLabelHeightChange,
  onResetDefaults,
  // Template props
  savedTemplates = [],
  activeTemplateId = null,
  onSaveTemplate,
  onDeleteTemplate,
  onLoadTemplate,
  onUnloadTemplate,
  onImportTemplate,
  onExportTemplate,
}) => {
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const patternInputRef = useRef(null)
  const templatePatternInputRef = useRef(null)
  const [colorHexInput, setColorHexInput] = useState(codeColor || '#000000')
  const [isLabelSizingExpanded, setIsLabelSizingExpanded] = useState(true)
  const [isCodeColorExpanded, setIsCodeColorExpanded] = useState(true)
  const { t } = useLocale()

  useEffect(() => {
    setColorHexInput(codeColor || '#000000')
  }, [codeColor])

  const normalizeHexColor = (value, fallback = '#000000') => {
    const raw = String(value || '').trim()
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase()
    if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`.toUpperCase()
    return fallback
  }

  const handleSave = () => {
    if (!newTemplateName.trim()) return
    onSaveTemplate(newTemplateName)
    setNewTemplateName('')
    setIsSaving(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      onImportTemplate(e.target.result)
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate size (max 1MB approx)
    if (file.size > 1024 * 1024) {
      alert(t('settings.logoTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      onLogoImageChange(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handlePatternUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert(t('settings.fillTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      onQrPatternImageChange(evt.target.result)
      onQrFillModeChange('image')
    }
    reader.readAsDataURL(file)
  }

  const commitHexColor = () => {
    const normalized = normalizeHexColor(colorHexInput, codeColor || '#000000')
    setColorHexInput(normalized)
    onCodeColorChange(normalized)
  }

  const activeTemplate = savedTemplates.find(t => t.id === activeTemplateId)
  const isLocked = !!activeTemplateId

  return (
    <div className="sc-form">
      {/* Templates Section - Top */}
      <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <strong>{t('settings.templates')}</strong>
            <div className="sc-u-muted">{t('settings.templatesHint')}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current.click()}
              title="Import Template"
              size="sm"
              variant="secondary"
              icon={Upload}
              style={{ padding: '0 8px' }}
            >
              {t('settings.importBtn')}
            </Button>
          </div>
        </div>

        {activeTemplate ? (
          <div style={{ padding: 12, background: 'var(--surface-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--brand)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} className="sc-u-brand" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeTemplate.name}</span>
              </div>
              <button 
                onClick={onUnloadTemplate}
                title="Stop using template"
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {t('settings.settingsLocked')}
            </div>

            {showLogo && !logoImage && (
              <div style={{ padding: 10, background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{t('settings.logoRequired')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('settings.logoRequiredDesc')}</div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <Button size="sm" variant="primary" icon={ImagePlus} onClick={() => logoInputRef.current?.click()}>
                  {t('settings.uploadLogoBtn')}
                </Button>
              </div>
            )}

            {qrFillMode === 'image' && !qrPatternImage && (
              <div style={{ padding: 10, background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{t('settings.fillRequired')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('settings.fillRequiredDesc')}</div>
                <input
                  type="file"
                  ref={templatePatternInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePatternUpload}
                  style={{ display: 'none' }}
                />
                <Button size="sm" variant="primary" icon={ImagePlus} onClick={() => templatePatternInputRef.current?.click()}>
                  {t('settings.uploadFillBtn')}
                </Button>
              </div>
            )}

            {qrFillMode === 'image' && qrPatternImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 12 }}>
                <img src={qrPatternImage} alt="Fill" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{t('settings.fillLoaded')}</span>
                <button
                  onClick={() => onQrPatternImageChange(null)}
                  title={t('settings.removeFillImage')}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {showLogo && logoImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 12 }}>
                <img src={logoImage} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>Logo loaded - {logoPosition.replace(/-/g, ' ')}</span>
                <button
                  onClick={() => onLogoImageChange(null)}
                  title="Remove logo"
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary" icon={Download} fullWidth onClick={() => onExportTemplate(activeTemplate)}>
                {t('settings.exportTemplate')}
              </Button>
            </div>
          </div>
        ) : (
          savedTemplates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {savedTemplates.map((template) => (
                <div key={template.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--surface-raised)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                  <FileText size={16} className="sc-u-muted" />
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{template.name}</span>
                  <Button
                    onClick={() => onLoadTemplate(template)}
                    title="Load template"
                    size="sm"
                    variant="primary"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                  >
                    {t('settings.load')}
                  </Button>
                  <Button
                    onClick={() => onDeleteTemplate(template.id)}
                    title="Delete template"
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    style={{ padding: '4px 6px' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="sc-empty-state" style={{ padding: '12px 0', fontSize: 13 }}>
              {t('settings.noTemplates')}
            </div>
          )
        )}
      </div>

      <div style={{ opacity: isLocked ? 0.6 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
        {/* Label sizing section */}
        <div className="sc-setting-section">
          <button
            type="button"
            className="sc-setting-section__head sc-collapse-head"
            onClick={() => setIsLabelSizingExpanded((prev) => !prev)}
            aria-expanded={isLabelSizingExpanded}
          >
            <div>
              <strong>{t('settings.labelSizing')}</strong>
              <div className="sc-u-muted">{t('settings.labelSizingHint')}</div>
            </div>
            <ChevronDown className={`sc-collapse-head__icon ${isLabelSizingExpanded ? 'is-open' : ''}`} size={16} />
          </button>

          {isLabelSizingExpanded && (
            <div className="sc-setting-section__body">
              <div className="sc-choice sc-choice--4col">
                <label className={`sc-choice__item ${sizingMode === 'default' ? 'is-active' : ''}`}>
                  <input type="radio" name="sizingMode" value="default" checked={sizingMode === 'default'} onChange={() => onSizingModeChange('default')} disabled={isLocked} />
                  <div className="sc-choice__content">{t('settings.default')}</div>
                </label>
                <label className={`sc-choice__item ${sizingMode === 'count' ? 'is-active' : ''}`}>
                  <input type="radio" name="sizingMode" value="count" checked={sizingMode === 'count'} onChange={() => onSizingModeChange('count')} disabled={isLocked} />
                  <div className="sc-choice__content">{t('settings.count')}</div>
                </label>
                <label className={`sc-choice__item ${sizingMode === 'custom' ? 'is-active' : ''}`}>
                  <input type="radio" name="sizingMode" value="custom" checked={sizingMode === 'custom'} onChange={() => onSizingModeChange('custom')} disabled={isLocked} />
                  <div className="sc-choice__content">{t('settings.custom')}</div>
                </label>
                <label className={`sc-choice__item ${sizingMode === 'both' ? 'is-active' : ''}`}>
                  <input type="radio" name="sizingMode" value="both" checked={sizingMode === 'both'} onChange={() => onSizingModeChange('both')} disabled={isLocked} />
                  <div className="sc-choice__content">{t('settings.both')}</div>
                </label>
              </div>

              {(sizingMode === 'count' || sizingMode === 'both') && (
                <div className="sc-form__grid sc-form__grid--2col">
                  <div className="sc-field">
                    <label>{t('settings.columnsLabel')}</label>
                    <input
                      type="number"
                      value={columns}
                      onChange={(e) => onColumnsChange(Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 4)))}
                      min="1"
                      max="12"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="sc-field">
                    <label>{t('settings.rowsLabel')}</label>
                    <input
                      type="number"
                      value={rows}
                      onChange={(e) => onRowsChange(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 6)))}
                      min="1"
                      max="20"
                      disabled={isLocked}
                    />
                  </div>
                </div>
              )}

              {(sizingMode === 'custom' || sizingMode === 'both') && (
                <div className="sc-form__grid sc-form__grid--2col">
                  <div className="sc-field">
                    <label>{t('settings.widthCm')}</label>
                    <input
                      type="number"
                      value={labelWidthCm}
                      onChange={(e) => onLabelWidthChange(Math.max(1, Math.min(20, parseFloat(e.target.value) || 4)))}
                      min="1"
                      max="20"
                      step="0.5"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="sc-field">
                    <label>{t('settings.heightCm')}</label>
                    <input
                      type="number"
                      value={labelHeightCm}
                      onChange={(e) => onLabelHeightChange(Math.max(1, Math.min(28, parseFloat(e.target.value) || 3)))}
                      min="1"
                      max="28"
                      step="0.5"
                      disabled={isLocked}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code color/style section */}
        <div className="sc-setting-section sc-setting-section--compact">
          <button
            type="button"
            className="sc-setting-section__head sc-collapse-head"
            onClick={() => setIsCodeColorExpanded((prev) => !prev)}
            aria-expanded={isCodeColorExpanded}
          >
            <div>
              <strong>{t('settings.codeColorTitle')}</strong>
              <div className="sc-u-muted">{t('settings.codeColorDesc')}</div>
            </div>
            <ChevronDown className={`sc-collapse-head__icon ${isCodeColorExpanded ? 'is-open' : ''}`} size={16} />
          </button>

          {isCodeColorExpanded && (
            <div className="sc-setting-section__body">
              <div className="sc-choice sc-form__grid--2col">
                <label className={`sc-choice__item ${qrFillMode === 'color' ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="qrFillMode"
                    value="color"
                    checked={qrFillMode === 'color'}
                    onChange={() => onQrFillModeChange('color')}
                    disabled={isLocked}
                  />
                  <div className="sc-choice__content">{t('settings.solidColor')}</div>
                </label>
                <label className={`sc-choice__item ${qrFillMode === 'image' ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="qrFillMode"
                    value="image"
                    checked={qrFillMode === 'image'}
                    onChange={() => onQrFillModeChange('image')}
                    disabled={isLocked}
                  />
                  <div className="sc-choice__content">{t('settings.imageFill')}</div>
                </label>
              </div>

              {qrFillMode === 'color' && (
                <div className="sc-form__grid sc-form__grid--2col">
                  <div className="sc-field">
                    <label>{t('settings.colorPicker')}</label>
                    <input
                      type="color"
                      value={normalizeHexColor(codeColor || '#000000')}
                      onChange={(e) => {
                        onCodeColorChange(e.target.value)
                        setColorHexInput(e.target.value.toUpperCase())
                      }}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="sc-field">
                    <label>{t('settings.hex')}</label>
                    <input
                      type="text"
                      value={colorHexInput}
                      onChange={(e) => setColorHexInput(e.target.value)}
                      onBlur={commitHexColor}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitHexColor()
                      }}
                      placeholder="#000000"
                      disabled={isLocked}
                    />
                  </div>
                </div>
              )}

              {qrFillMode === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="file"
                    ref={patternInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePatternUpload}
                    style={{ display: 'none' }}
                    disabled={isLocked}
                  />

                  {!qrPatternImage ? (
                    <Button
                      onClick={() => patternInputRef.current?.click()}
                      icon={ImagePlus}
                      variant="secondary"
                      size="sm"
                      disabled={isLocked}
                    >
                      {t('settings.uploadFillBtn')}
                    </Button>
                  ) : (
                    <div className="sc-logo-preview">
                      <div className="sc-logo-preview__img">
                        <img src={qrPatternImage} alt="QR Fill" />
                      </div>
                      <div className="sc-logo-preview__info">
                        <div className="sc-logo-preview__title">{t('settings.fillImageTitle')}</div>
                        <div className="sc-logo-preview__sub">{t('settings.fillImageSub')}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => onQrPatternImageChange(null)}
                        title={t('settings.removeFillImage')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Brand title section */}
        <div className="sc-toggle-section">
          <div className="sc-toggle-row">
            <div>
              <strong>{t('settings.showBrandTitle')}</strong>
              <div className="sc-u-muted">{t('settings.showBrandTitleDesc')}</div>
            </div>
            <button
              type="button"
              className={`sc-toggle ${showBrandName ? 'is-on' : ''}`}
              onClick={() => onShowBrandNameChange(!showBrandName)}
              disabled={isLocked}
              aria-label="Toggle brand title"
              aria-pressed={showBrandName}
            >
              <span />
            </button>
          </div>

          {showBrandName && (
            <div className="sc-toggle-section__body">
              <div className="sc-form__grid sc-form__grid--2col">
                <div className="sc-field">
                  <label>{t('settings.brandName')}</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => onBrandNameChange(e.target.value)}
                    placeholder={t('settings.brandNamePlaceholder')}
                    disabled={isLocked}
                  />
                </div>
                <div className="sc-field">
                  <label>{t('settings.fontSize')}</label>
                  <input
                    type="number"
                    value={brandFontSize}
                    onChange={(e) => onBrandFontSizeChange(Math.max(6, Math.min(32, parseInt(e.target.value, 10) || 12)))}
                    min="6"
                    max="32"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Brand Logo section */}
        <div className="sc-toggle-section">
          <div className="sc-toggle-row">
          <div>
            <strong>{t('settings.showBrandLogo')}</strong>
            <div className="sc-u-muted">{t('settings.showBrandLogoDesc')}</div>
          </div>
          <button
            type="button"
            className={`sc-toggle ${showLogo ? 'is-on' : ''}`}
            onClick={() => onShowLogoChange(!showLogo)}
            disabled={isLocked}
            aria-label="Toggle brand logo"
            aria-pressed={showLogo}
          >
            <span />
          </button>
          </div>

          {showLogo && (
            <div className="sc-toggle-section__body">
            {/* Upload / Preview Area — full width */}
            {!logoImage ? (
              <label className="sc-logo-upload sc-logo-upload--compact">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoUpload}
                  disabled={isLocked}
                  style={{ display: 'none' }}
                />
                <div className="sc-logo-upload__icon">
                  <ImagePlus size={22} />
                </div>
                <div className="sc-logo-upload__text">{t('settings.uploadBrandLogo')}</div>
                <div className="sc-logo-upload__hint">{t('settings.uploadHint')}</div>
              </label>
            ) : (
              <div className="sc-logo-preview sc-logo-preview--compact">
                <div className="sc-logo-preview__img">
                  <img src={logoImage} alt="Logo" />
                </div>
                <div className="sc-logo-preview__info">
                  <div className="sc-logo-preview__title">{t('settings.brandLogo')}</div>
                  <div className="sc-logo-preview__sub">{t('settings.readyForOverlay')}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  icon={Trash2} 
                  onClick={() => onLogoImageChange(null)}
                  title="Remove Logo"
                />
              </div>
            )}

            {/* Position Picker — full width row */}
            <div className="sc-toggle-section__inline">
              <div className="sc-toggle-section__inline-label">{t('settings.position')}</div>
              <div className="sc-pos-grid sc-pos-grid--compact">
                {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                  <div
                    key={pos}
                    className={`sc-pos-grid__cell ${logoPosition === pos ? 'is-active' : ''}`}
                    onClick={() => onLogoPositionChange(pos)}
                    title={pos.replace(/-/g, ' ')}
                  >
                    <span className="sc-pos-grid__dot" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Content / Data section */}
        <div className="sc-toggle-section">
          <div className="sc-toggle-row">
          <div>
            <strong>{t('settings.showContentData')}</strong>
            <div className="sc-u-muted">{t('settings.showContentDataDesc')}</div>
          </div>
          <button
            type="button"
            className={`sc-toggle ${showDataText ? 'is-on' : ''}`}
            onClick={() => onShowDataTextChange(!showDataText)}
            disabled={isLocked}
            aria-label="Toggle content data"
            aria-pressed={showDataText}
          >
            <span />
          </button>
          </div>

          {showDataText && (
            <div className="sc-toggle-section__body">
              <div className="sc-form__grid sc-form__grid--2col">
            <div className="sc-field">
              <label>{t('settings.dataFontSize')}</label>
              <input
                type="number"
                value={dataFontSize}
                onChange={(e) => onDataFontSizeChange(Math.max(6, Math.min(32, parseInt(e.target.value, 10) || 10)))}
                min="6"
                max="32"
                disabled={isLocked}
              />
            </div>
              </div>
            </div>
          )}
        </div>

        {/* Border section */}
        <div className="sc-toggle-section">
          <div className="sc-toggle-row">
          <div>
            <strong>{t('settings.showBorder')}</strong>
            <div className="sc-u-muted">{t('settings.showBorderDesc')}</div>
          </div>
          <button
            type="button"
            className={`sc-toggle ${showBorder ? 'is-on' : ''}`}
            onClick={() => onShowBorderChange(!showBorder)}
            disabled={isLocked}
            aria-label="Toggle border visibility"
            aria-pressed={showBorder}
          >
            <span />
          </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isSaving ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder={t('settings.templateNamePlaceholder')}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button size="sm" onClick={handleSave} disabled={!newTemplateName.trim()}>{t('settings.save')}</Button>
              <Button size="sm" variant="secondary" onClick={() => setIsSaving(false)}>{t('settings.cancel')}</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button 
                size="sm" 
                variant="secondary" 
                icon={Save} 
                onClick={() => setIsSaving(true)} 
                fullWidth
                disabled={isLocked}
                title={isLocked ? "Unlock to save new template" : "Save current settings"}
              >
                {t('settings.saveSettings')}
              </Button>
              <Button 
                onClick={onResetDefaults} 
                variant="secondary" 
                size="sm" 
                icon={RotateCcw} 
                fullWidth
                disabled={isLocked}
                title={isLocked ? "Unlock to reset" : "Reset all settings"}
              >
                {t('settings.reset')}
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}
