import { RotateCcw, Save, Trash2, FileText, Download, Upload, X, Lock, ImagePlus } from 'lucide-react'
import { Button } from './Button'
import { useState, useRef } from 'react'
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
  const { t } = useLocale()

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
      alert('File too large. Please use a logo under 1MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      onLogoImageChange(e.target.result)
    }
    reader.readAsDataURL(file)
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
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Logo required</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>This template was saved with a brand logo. Upload one to match the original layout.</div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <Button size="sm" variant="primary" icon={ImagePlus} onClick={() => logoInputRef.current?.click()}>
                  Upload Logo
                </Button>
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
        <div>
          <strong>{t('settings.labelSizing')}</strong>
          <div className="sc-u-muted" style={{ marginBottom: 8 }}>{t('settings.labelSizingHint')}</div>
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

        {/* Brand title section */}
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
        )}

        {/* Brand Logo section */}
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
          <div style={{ marginTop: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Upload / Preview Area — full width */}
            {!logoImage ? (
              <label className="sc-logo-upload">
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
              <div className="sc-logo-preview">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{t('settings.position')}</div>
              <div className="sc-pos-grid">
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

        {/* Content / Data section */}
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
        )}

        {/* Border section */}
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
