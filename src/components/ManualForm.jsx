import { QrCode, BarChart3, Grid3X3 } from 'lucide-react'
import { Button } from './Button'
import { useLocale } from '../i18n/LocaleContext'

export const ManualForm = ({ onConfigReady, type, onTypeChange, data, onDataChange, count, onCountChange }) => {
  const { t } = useLocale()

  const handleGenerate = () => {
    if (count === 0 || !data.trim()) return

    onConfigReady({
      items: [
        {
          type,
          count,
          dataPattern: data.trim(),
          startNumber: 1,
          isExact: true,
        },
      ],
      totalCount: count,
      brandName: '',
      paperSize: 'a4',
      columnsPerRow: 4,
      outputFormat: 'png',
    })
  }

  const typeLabel = type === 'barcode' ? t('manual.barcode') : type === 'datamatrix' ? t('manual.dataMatrix') : t('manual.qrCode')

  return (
    <div className="sc-form">
      <div className="sc-field">
        <label>{t('manual.codeType')}</label>
        <div className="sc-choice sc-form__grid--3col">
          <label className={`sc-choice__item ${type === 'qr' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="codeType"
              value="qr"
              checked={type === 'qr'}
              onChange={() => onTypeChange('qr')}
            />
            <span className="sc-choice__content">
              <QrCode size={16} />
              {t('manual.qrCode')}
            </span>
          </label>
          <label className={`sc-choice__item ${type === 'barcode' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="codeType"
              value="barcode"
              checked={type === 'barcode'}
              onChange={() => onTypeChange('barcode')}
            />
            <span className="sc-choice__content">
              <BarChart3 size={16} />
              {t('manual.barcode')}
            </span>
          </label>
          <label className={`sc-choice__item ${type === 'datamatrix' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="codeType"
              value="datamatrix"
              checked={type === 'datamatrix'}
              onChange={() => onTypeChange('datamatrix')}
            />
            <span className="sc-choice__content">
              <Grid3X3 size={16} />
              {t('manual.dataMatrix')}
            </span>
          </label>
        </div>
      </div>

      <div className="sc-field">
        <label>{t('manual.contentData')}</label>
        <input
          type="text"
          value={data}
          onChange={(e) => onDataChange(e.target.value)}
          placeholder={t('manual.contentPlaceholder')}
        />
        <p className="sc-field__hint">{t('manual.contentHint')}</p>
      </div>

      <div className="sc-field">
        <label>{t('manual.quantity')}</label>
        <input
          type="number"
          value={count}
          onChange={(e) => onCountChange(Math.min(1000, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          min="1"
          max="1000"
        />
      </div>

      <Button
        onClick={handleGenerate}
        fullWidth
        variant="primary"
        disabled={count === 0 || !data.trim()}
      >
        {t('manual.generate')} {count > 0 ? `${count}` : ''} {typeLabel}
        {count > 1 ? 's' : ''}
      </Button>
    </div>
  )
}
