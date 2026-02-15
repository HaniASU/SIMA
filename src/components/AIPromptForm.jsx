import React, { useState, useEffect } from 'react'
import { Sparkles, Key, Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { AI_PROVIDERS, AI_DEFAULTS } from '../utils/constants'
import { analyzePrompt } from '../utils/aiService'
import { useLocale } from '../i18n/LocaleContext'

export const AIPromptForm = ({ onConfigReady }) => {
  const { t } = useLocale()
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState(AI_DEFAULTS.provider)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(AI_PROVIDERS[AI_DEFAULTS.provider].defaultModel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewConfig, setPreviewConfig] = useState(null)
  const [ollamaModels, setOllamaModels] = useState([])
  const [ollamaLoading, setOllamaLoading] = useState(false)

  const currentProvider = AI_PROVIDERS[provider]

  useEffect(() => {
    if (provider !== 'ollama') return
    setOllamaLoading(true)
    fetch('http://localhost:11434/api/tags')
      .then((res) => res.json())
      .then((data) => {
        const models = (data.models || []).map((m) => m.name)
        setOllamaModels(models)
        if (models.length > 0 && !models.includes(model)) {
          setModel(models[0])
        }
      })
      .catch(() => setOllamaModels([]))
      .finally(() => setOllamaLoading(false))
  }, [provider])

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider)
    setModel(AI_PROVIDERS[newProvider].defaultModel)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!prompt.trim()) return
    if (currentProvider.needsKey && !apiKey.trim()) {
      setError(`${currentProvider.label} API key is required`)
      return
    }
    setLoading(true)
    setError(null)
    setPreviewConfig(null)

    try {
      const config = await analyzePrompt(prompt, provider, {
        apiKey: currentProvider.needsKey ? apiKey : undefined,
        model,
      })
      setPreviewConfig(config)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!previewConfig) return
    onConfigReady(previewConfig)
    // previewConfig retained as per user request
  }

  const handleUseSample = () => {
    setPrompt(AI_DEFAULTS.samplePrompt)
    setPreviewConfig(null)
    setError(null)
  }

  return (
    <div className="sc-form">
      <div className="sc-form__grid sc-form__grid--2col">
        <div className="sc-field">
          <label>{t('ai.provider')}</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              style={{ paddingRight: 36 }}
            >
              {Object.entries(AI_PROVIDERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        <div className="sc-field">
          <label>{t('ai.model')}</label>
          {provider === 'ollama' && ollamaModels.length > 0 ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={model} onChange={(e) => setModel(e.target.value)} style={{ paddingRight: 36 }}>
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
            </div>
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                provider === 'ollama' && ollamaLoading
                  ? t('ai.loadingModels')
                  : currentProvider.defaultModel
              }
            />
          )}
        </div>
      </div>

      {currentProvider.needsKey ? (
        <div className="sc-field">
          <label>{currentProvider.label} {t('ai.apiKey')}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('ai.apiKeyPlaceholder')}
          />
        </div>
      ) : null}

      <div className="sc-field">
        <label>{t('ai.prompt')}</label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            setPreviewConfig(null)
            setError(null)
          }}
          placeholder={t('ai.promptPlaceholder')}
        />
      </div>

      <div className="sc-actions">
        <Button onClick={handleUseSample} variant="ghost" icon={Key}>
          {t('ai.useSample')}
        </Button>
        <Button
          onClick={handleAnalyze}
          icon={loading ? Loader2 : Sparkles}
          variant="primary"
          disabled={loading || !prompt.trim()}
        >
          {loading ? t('ai.analyzing') : t('ai.analyzeWithAI')}
        </Button>
      </div>

      {error ? (
        <div className="sc-alert sc-alert--error">
          <AlertCircle size={18} />
          <div>
            <strong>{t('ai.analysisFailed')}</strong>
            <div>{error}</div>
          </div>
        </div>
      ) : null}

      {previewConfig ? (
        <div className="sc-preview">
          <div className="sc-actions">
            <strong>{t('ai.configPreview')}</strong>
            <span className="sc-u-muted">{previewConfig.totalCount} {t('ai.codes')}</span>
          </div>

          <div className="sc-preview__list">
            {previewConfig.items.map((item, i) => (
              <div key={i} className="sc-preview__item">
                <span className={`sc-tag ${item.type === 'barcode' ? 'sc-tag--barcode' : 'sc-tag--qr'}`}>
                  {item.type.toUpperCase()}
                </span>
                <strong>{item.count}x</strong>
                <span className="sc-u-mono">{item.dataPattern}</span>
                <span className="sc-u-muted">#{item.startNumber}</span>
              </div>
            ))}
          </div>

          <div className="sc-meta-grid">
            <MetaItem label={t('ai.paper')} value={previewConfig.paperSize.toUpperCase()} />
            <MetaItem label={t('session.columns')} value={previewConfig.columnsPerRow} />
            <MetaItem label={t('ai.output')} value={previewConfig.outputFormat.toUpperCase()} />
            <MetaItem label={t('ai.size')} value={`${previewConfig.labelWidthCm} x ${previewConfig.labelHeightCm} cm`} />
            <MetaItem label={t('ai.brand')} value={previewConfig.brandName || t('ai.none')} />
            <MetaItem label={t('ai.providerLabel')} value={currentProvider.label} />
          </div>

          <Button onClick={handleConfirm} icon={Check} variant="success" fullWidth>
            {t('ai.confirmGenerate')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="sc-meta-item">
      <p className="sc-meta-item__label">{label}</p>
      <p className="sc-meta-item__value">{String(value)}</p>
    </div>
  )
}
