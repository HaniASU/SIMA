import React from 'react'
import { Download, Trash2, Plus, CheckCircle, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { useLocale } from '../i18n/LocaleContext'

export const LabelsDisplay = ({
  labels,
  onRemove,
  onClearAll,
  onExport,
  exportFormat = 'pdf',
  onExportFormatChange,
}) => {
  const { t } = useLocale()

  return (
    <div className="sc-card sc-labels__card">
      <div className="sc-labels__head">
        <div>
          <h3 className="sc-labels__title">{t('labels.productionQueue')}</h3>
          <p className="sc-labels__subtitle">
            {labels.length} {labels.length !== 1 ? (t('labels.labelsReady').replace('{count}', labels.length).replace('{s}', 's')) : (t('labels.labelsReady').replace('{count}', labels.length).replace('{s}', ''))}
          </p>
        </div>

        <div className="sc-labels__actions">
          <Button onClick={onClearAll} variant="danger" size="sm" icon={Trash2} disabled={labels.length === 0}>
            {t('labels.clear')}
          </Button>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={exportFormat}
              onChange={(e) => onExportFormatChange?.(e.target.value)}
              disabled={labels.length === 0}
              style={{ 
                width: 'auto', 
                paddingRight: 40,
                cursor: 'pointer',
              }}
            >
              <option value="png">PNG</option>
              <option value="pdf">PDF</option>
              <option value="svg">SVG</option>
            </select>
            <ChevronDown 
              size={16} 
              style={{ 
                position: 'absolute', 
                right: 12, 
                pointerEvents: 'none', 
                color: 'var(--text-tertiary)' 
              }} 
            />
          </div>
          <Button onClick={onExport} variant="primary" size="sm" icon={Download} disabled={labels.length === 0}>
            {t('labels.export')} {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      <div className="sc-labels__body">
        {labels.length === 0 ? (
          <div className="sc-labels__empty">
            <Plus size={26} />
            <h4>{t('labels.readyToCreate')}</h4>
            <p>{t('labels.emptyHint')}</p>
          </div>
        ) : (
          <div className="sc-label-grid">
            {labels.map((label, index) => (
              <LabelCard key={index} label={label} index={index} onRemove={() => onRemove(index)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LabelCard({ label, index, onRemove }) {
  const { t } = useLocale()

  return (
    <article className="sc-label-card">
      <div className="sc-label-card__thumb">
        <button onClick={onRemove} className="sc-label-card__remove" title={t('labels.removeLabel')} type="button">
          <Trash2 size={14} />
        </button>

        {label.thumb ? (
          <img src={label.thumb} alt={`Label ${index + 1}`} />
        ) : (
          <CheckCircle size={28} className="sc-u-muted" />
        )}
      </div>

      <div className="sc-label-card__meta">
        <p className="sc-label-card__data sc-u-mono">{label.qrData}</p>
        <div className="sc-label-card__tags">
          <span className={`sc-tag sc-tag--${label.type || 'qr'}`}>
            {label.type === 'barcode' ? 'BARCODE' : label.type === 'datamatrix' ? 'DATA MATRIX' : 'QR'}
          </span>
          {label.brandName ? <span className="sc-tag sc-tag--qr">{label.brandName}</span> : null}
        </div>
        <p className="sc-label-card__index">#{index + 1}</p>
      </div>
    </article>
  )
}
