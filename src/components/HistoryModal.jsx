import React, { useState } from 'react'
import { RotateCcw, Calendar, FileText, Package, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { useLocale } from '../i18n/LocaleContext'

export const HistorySection = ({ history, onClearHistory, onRestore }) => {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const formatDate = (ts) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <section className="sc-card sc-history-section sc-anim-fade">
      <div
        className="sc-card__header sc-history-toggle"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
            display: 'grid', placeItems: 'center'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <h3 className="sc-card__title">{t('history.title')}</h3>
            <p className="sc-card__description">
              {expanded ? t('history.hideHistory') : t('history.showHistory')}
              {history.length > 0 && ` (${history.length})`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {expanded && history.length > 0 && (
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(t('history.clearConfirm'))) onClearHistory()
              }}
            >
              {t('history.clearHistory')}
            </Button>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <>
          {history.length === 0 ? (
            <div className="sc-empty-state" style={{ padding: '32px 20px' }}>
              <Package size={28} className="sc-u-muted" />
              <p>{t('history.noHistory')}</p>
            </div>
          ) : (
            <div className="sc-history-grid">
              {history.map((entry) => (
                <div key={entry.id} className="sc-history-item">
                  <div className="sc-history-item__preview">
                    {entry.preview ? (
                      <img src={entry.preview} alt="Preview" />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>

                  <div className="sc-history-item__info">
                    <div className="sc-history-item__top">
                      <strong>{entry.count} {t('history.labelsText')}</strong>
                      <span className="sc-badge" style={{ fontSize: 10, padding: '2px 6px', height: 'auto' }}>
                        {entry.format}
                      </span>
                    </div>
                    <div className="sc-history-item__date">
                      <Calendar size={10} />
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => onRestore(entry.labels)}
                    title={t('history.subtitle')}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Keep backward-compatible named export
export const HistoryModal = HistorySection
