import React, { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, Check, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from './Button'
import * as XLSX from 'xlsx'
import { useLocale } from '../i18n/LocaleContext'

const TEMPLATE_DATA = [
  ['type', 'data', 'count'],
  ['qr', 'ID: 1', 1],
  ['qr', 'ID: 2', 1],
  ['barcode', 'SKU-001', 3],
  ['barcode', 'SKU-002', 1],
  ['datamatrix', 'DM-SAMPLE', 2],
]

const TEMPLATE_JSON = [
  { type: 'qr', data: 'ID: 1', count: 1 },
  { type: 'qr', data: 'ID: 2', count: 1 },
  { type: 'barcode', data: 'SKU-001', count: 3 },
  { type: 'barcode', data: 'SKU-002', count: 1 },
  { type: 'datamatrix', data: 'DM-SAMPLE', count: 2 },
]

export const ImportForm = ({ onConfigReady }) => {
  const { t } = useLocale()
  const fileInputRef = useRef(null)
  const [parsedRows, setParsedRows] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json']

  const handleDownloadTemplate = (format) => {
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_DATA)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')

    if (format === 'json') {
      const json = JSON.stringify(TEMPLATE_JSON, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-barcode-template.json'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-barcode-template.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    XLSX.writeFile(wb, 'qr-barcode-template.xlsx')
  }

  const VALID_TYPES = ['qr', 'barcode', 'datamatrix']
  const REQUIRED_COLUMNS = ['type', 'data', 'count']

  const validateRows = (rows) => {
    const errors = []
    const parsed = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1
      const rowErrors = []

      const type = String(row.type ?? '').toLowerCase().trim()
      const data = String(row.data ?? '').trim()
      const countRaw = row.count

      if (!type) {
        rowErrors.push('"type" is missing')
      } else if (!VALID_TYPES.includes(type)) {
        rowErrors.push(`"${row.type}" is not a valid type -expected qr, barcode, or datamatrix`)
      }

      if (!data || data === 'undefined') {
        rowErrors.push('"data" is missing')
      }

      if (countRaw === undefined || countRaw === null || String(countRaw).trim() === '') {
        rowErrors.push('"count" is missing')
      } else {
        const countNum = parseInt(countRaw, 10)
        if (isNaN(countNum) || countNum < 1) {
          rowErrors.push(`"${countRaw}" is not a valid count -must be a number greater than 0`)
        }
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNum} -${rowErrors.join(' | ')}`)
      } else {
        parsed.push({ type, data, count: Math.max(1, parseInt(countRaw, 10)) })
      }
    }

    return { parsed, errors }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError(`"${ext}" files are not supported. Please upload a CSV, Excel (.xlsx/.xls), or JSON file.`)
      setParsedRows(null)
      setFileName(file.name)
      e.target.value = ''
      return
    }

    setError(null)
    setParsedRows(null)
    setShowPreview(false)
    setFileName(file.name)

    const isJson = file.name.toLowerCase().endsWith('.json')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        let rawRows

        if (isJson) {
          const jsonData = JSON.parse(evt.target.result)
          const arr = Array.isArray(jsonData) ? jsonData : [jsonData]

          // Normalize keys to lowercase
          const missingCols = REQUIRED_COLUMNS.filter(
            (col) => !arr[0] || !Object.keys(arr[0]).some((k) => k.toLowerCase().trim() === col)
          )
          if (missingCols.length > 0) {
            setError(`Your file is missing ${missingCols.length > 1 ? 'these columns' : 'the column'}: ${missingCols.map((c) => `"${c}"`).join(', ')}. All three columns (type, data, count) are required.`)
            return
          }

          rawRows = arr.map((item) => {
            const normalized = {}
            for (const key of Object.keys(item)) {
              normalized[key.toLowerCase().trim()] = item[key]
            }
            return normalized
          })
        } else {
          const data = new Uint8Array(evt.target.result)
          const wb = XLSX.read(data, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

          const header = rows[0]?.map((h) => String(h).toLowerCase().trim()) || []

          const missingCols = REQUIRED_COLUMNS.filter((col) => !header.includes(col))
          if (missingCols.length > 0) {
            setError(`Your file is missing ${missingCols.length > 1 ? 'these columns' : 'the column'}: ${missingCols.map((c) => `"${c}"`).join(', ')}. All three columns (type, data, count) are required.`)
            return
          }

          const typeIdx = header.indexOf('type')
          const dataIdx = header.indexOf('data')
          const countIdx = header.indexOf('count')

          rawRows = []
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue
            rawRows.push({
              type: row[typeIdx],
              data: row[dataIdx],
              count: row[countIdx],
            })
          }
        }

        if (rawRows.length === 0) {
          setError('Your file has no data rows. Make sure you have at least one row below the header.')
          return
        }

        if (rawRows.length > 1000) {
          setError(`Your file has ${rawRows.length} rows. The maximum allowed is 1000 rows per import.`)
          return
        }

        const { parsed, errors } = validateRows(rawRows)

        if (errors.length > 0) {
          setError(errors.join('\n'))
          return
        }

        setParsedRows(parsed)
      } catch (err) {
        setError(`Could not read the file. Make sure it's a valid CSV, Excel, or JSON file.`)
      }
    }

    if (isJson) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
    e.target.value = ''
  }

  const handleClearFile = () => {
    setParsedRows(null)
    setError(null)
    setFileName('')
    setShowPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConfirm = () => {
    if (!parsedRows) return

    const items = parsedRows.map((row) => ({
      type: row.type,
      count: row.count,
      dataPattern: row.data,
      startNumber: 1,
      isExact: true,
    }))

    const totalCount = items.reduce((sum, item) => sum + item.count, 0)

    onConfigReady({
      items,
      totalCount,
      brandName: '',
      paperSize: 'a4',
      columnsPerRow: 4,
      labelWidthCm: 4,
      labelHeightCm: 3,
      outputFormat: 'pdf',
    })

    // State retained as per user request
  }

  const totalParsed = parsedRows?.reduce((sum, r) => sum + r.count, 0) || 0
  const qrCount = parsedRows?.filter((r) => r.type === 'qr').reduce((s, r) => s + r.count, 0) || 0
  const barCount = parsedRows?.filter((r) => r.type === 'barcode').reduce((s, r) => s + r.count, 0) || 0
  const dmCount = parsedRows?.filter((r) => r.type === 'datamatrix').reduce((s, r) => s + r.count, 0) || 0

  return (
    <div className="sc-form">
      <div className="sc-alert sc-alert--info" style={{ marginBottom: 12 }}>
        <div>
          <strong>{t('import.settingsNotice')}</strong>
          <div>{t('import.settingsNoticeDesc')}</div>
        </div>
      </div>

      <section className="sc-import-step">
        <h4 className="sc-import-step__title">{t('import.step1Title')}</h4>
        <p className="sc-import-step__desc">
          {t('import.step1Desc')} <strong>type</strong> (qr | barcode | datamatrix), <strong>data</strong>, <strong>count</strong>.
        </p>
        <div className="sc-import-step__actions">
          <Button onClick={() => handleDownloadTemplate('csv')} icon={Download} variant="secondary" size="sm">
            {t('import.csvTemplate')}
          </Button>
          <Button onClick={() => handleDownloadTemplate('xlsx')} icon={Download} variant="secondary" size="sm">
            {t('import.excelTemplate')}
          </Button>
          <Button onClick={() => handleDownloadTemplate('json')} icon={Download} variant="secondary" size="sm">
            {t('import.jsonTemplate')}
          </Button>
        </div>
      </section>

      <section className="sc-import-step">
        <h4 className="sc-import-step__title">{t('import.step2Title')}</h4>
        <p className="sc-import-step__desc">{t('import.step2Desc')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <Button onClick={() => fileInputRef.current?.click()} icon={Upload} variant="primary" fullWidth>
          {fileName && !error ? fileName : t('import.chooseFile')}
        </Button>
      </section>

      {error ? (
        <div className="sc-alert sc-alert--error">
          <AlertCircle size={18} />
          <div>
            <strong>{t('import.importError')}</strong>
            {error.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}

      {parsedRows ? (
        <section className="sc-preview">
          <div className="sc-actions">
            <strong>{t('import.parsedSuccess')} ({parsedRows.length} {t('import.rows')})</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                onClick={() => setShowPreview((v) => !v)}
                icon={showPreview ? EyeOff : Eye}
                variant="secondary"
                size="sm"
              >
                {showPreview ? t('import.hideData') : t('import.previewData')}
              </Button>
              <Button
                onClick={handleClearFile}
                icon={Trash2}
                variant="danger"
                size="sm"
                title="Remove uploaded file"
              />
            </div>
          </div>

          <div className="sc-meta-grid">
            <MetaItem label={t('import.total')} value={totalParsed} />
            {qrCount > 0 && <MetaItem label="QR" value={qrCount} color="var(--meta-qr, #60a5fa)" />}
            {barCount > 0 && <MetaItem label={t('manual.barcode')} value={barCount} color="var(--meta-barcode, #fbbf24)" />}
            {dmCount > 0 && <MetaItem label={t('manual.dataMatrix')} value={dmCount} color="var(--meta-datamatrix, #c084fc)" />}
          </div>

          {showPreview && (
            <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>{t('import.type')}</th>
                    <th>{t('import.data')}</th>
                    <th>{t('import.count')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 12).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`sc-tag sc-tag--${row.type}`}>{row.type === 'datamatrix' ? 'data matrix' : row.type}</span>
                      </td>
                      <td className="sc-u-mono">{row.data}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 12 && (
                <p className="sc-u-muted" style={{ textAlign: 'center', marginTop: 8 }}>
                  {t('import.showingOf')} {parsedRows.length} {t('import.rows')}
                </p>
              )}
            </div>
          )}

          <Button onClick={handleConfirm} icon={Check} variant="success" fullWidth>
            {t('import.generateCodes').replace('{count}', totalParsed)}
          </Button>
        </section>
      ) : null}
    </div>
  )
}

function MetaItem({ label, value, color }) {
  return (
    <div className="sc-meta-item">
      <p className="sc-meta-item__label" style={color ? { color } : undefined}>{label}</p>
      <p className="sc-meta-item__value" style={color ? { color } : undefined}>{String(value)}</p>
    </div>
  )
}
