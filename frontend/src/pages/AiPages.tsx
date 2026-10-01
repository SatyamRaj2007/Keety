import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight, BarChart3, BookOpenCheck, Check,
  Clock, FileText, History, Layers,
  Lightbulb, Loader, Package, Plus, RefreshCw,
  Send, Sparkles, Target, Trash2, TrendingUp, Upload, XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { aiApi, type AIPeriod } from '../api/ai.api'
import { ragApi } from '../api/rag.api'
import { ApiError } from '../api/client'
import { productsApi } from '../api/products.api'
import {
  Button, Currency, EmptyState, LoadingBlock, Notice,
  PageHeader, Panel, SelectField, SectionHeading,
  StatusBadge, TextareaField,
} from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { AIInsight, AILogEntry, AIRecommendation, AIResponse, BusinessDocument, Product } from '../types'

// ─── Shared period selector ───────────────────────────────────────────────────

const PERIOD_LABELS: Record<AIPeriod, string> = {
  daily:   'Today',
  weekly:  'This week',
  monthly: 'This month',
}

function PeriodSelector({
  value,
  onChange,
  label = 'Data period',
}: {
  value: AIPeriod
  onChange: (p: AIPeriod) => void
  label?: string
}) {
  return (
    <div className="ai-period-selector" role="group" aria-label={label}>
      {(Object.keys(PERIOD_LABELS) as AIPeriod[]).map((p) => (
        <button
          key={p}
          type="button"
          className={`ai-period-btn ${value === p ? 'active' : ''}`}
          onClick={() => onChange(p)}
          aria-pressed={value === p}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  )
}

// ─── Shared answer panel components ──────────────────────────────────────────

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: 'High priority', MEDIUM: 'Medium priority', LOW: 'Lower priority',
}

function PriorityBadge({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  return (
    <span className={`ai-priority ai-priority-${priority.toLowerCase()}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

function InsightCard({ insight }: { insight: AIInsight }) {
  return (
    <div className="ai-insight-card">
      <span className="ai-card-icon"><Lightbulb size={15} /></span>
      <div className="ai-card-body">
        <strong>{insight.title}</strong>
        <p>{insight.description}</p>
        {insight.metric && insight.value !== undefined && (
          <span className="ai-card-metric">{insight.metric}: {insight.value.toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}

function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  return (
    <div className="ai-rec-card">
      <div className="ai-rec-header">
        <span className="ai-card-icon ai-card-icon-rec"><Check size={14} /></span>
        <div className="ai-rec-title-row">
          <strong>{rec.title}</strong>
          <PriorityBadge priority={rec.priority} />
        </div>
      </div>
      <p className="ai-rec-desc">{rec.description}</p>
      {rec.evidence && (
        <div className="ai-rec-evidence">
          <BarChart3 size={12} />
          <span>{rec.evidence}</span>
        </div>
      )}
    </div>
  )
}

function LimitationsNotice({ limitations }: { limitations: string[] }) {
  if (!limitations.length) return null
  return (
    <Notice tone="info">
      <strong>What KEETY couldn't determine</strong>
      <ul className="ai-limitations-list">
        {limitations.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </Notice>
  )
}

function DataSourceLine({ source }: { source?: string }) {
  if (!source) return null
  return (
    <div className="ai-data-source">
      <BookOpenCheck size={13} />
      <span>Source: {source}</span>
    </div>
  )
}

/** Shared structured answer panel used by all AI pages */
function AnswerPanel({
  answer, loading, error, onRetry,
  label = 'Based on current business analytics',
  period,
}: {
  answer: AIResponse | null
  loading: boolean
  error: string
  onRetry?: () => void
  label?: string
  period?: AIPeriod
}) {
  if (loading) {
    return (
      <Panel className="ai-thinking" aria-live="polite">
        <span className="thinking-mark"><Loader size={19} className="ai-spin" /></span>
        <div>
          <strong>KEETY is reviewing your business data.</strong>
          <p>
            Building context from your {period ? PERIOD_LABELS[period].toLowerCase() : 'monthly'}{' '}
            analytics and preparing a grounded answer.
          </p>
        </div>
      </Panel>
    )
  }

  if (error) {
    return (
      <Notice tone="error">
        <strong>KEETY couldn't generate an answer.</strong>
        <p>{error}</p>
        {onRetry && (
          <button className="text-button" onClick={onRetry}>
            <RefreshCw size={14} /> Try again
          </button>
        )}
      </Notice>
    )
  }

  if (!answer) return null

  const hasInsights     = answer.insights.length > 0
  const hasRecs         = answer.recommendations.length > 0
  const hasLimitations  = (answer.limitations ?? []).length > 0

  return (
    <Panel className="answer-panel" aria-live="polite">
      <div className="answer-heading">
        <span className="answer-avatar"><Sparkles size={17} /></span>
        <div>
          <strong>KEETY</strong>
          <small>{label}{period ? ` · ${PERIOD_LABELS[period].toLowerCase()} data` : ''}</small>
        </div>
      </div>

      <div className="answer-body">{answer.answer}</div>

      {hasInsights && (
        <div className="answer-subsection">
          <h3><Lightbulb size={15} /> What stands out</h3>
          <div className="ai-cards-grid">
            {answer.insights.map((insight) => <InsightCard key={insight.title} insight={insight} />)}
          </div>
        </div>
      )}

      {hasRecs && (
        <div className="answer-subsection">
          <h3><TrendingUp size={15} /> Recommended actions</h3>
          <div className="ai-recs-list">
            {answer.recommendations.map((rec) => <RecommendationCard key={rec.title} rec={rec} />)}
          </div>
        </div>
      )}

      {hasLimitations && <LimitationsNotice limitations={answer.limitations!} />}
      <DataSourceLine source={answer.dataSource} />
    </Panel>
  )
}

// ─── Ask KEETY ────────────────────────────────────────────────────────────────

const suggestedQuestions = [
  'Which products should I focus on this month?',
  'How is my business performing compared to last month?',
  'What inventory should I reorder?',
  'Where is the biggest growth opportunity?',
]

export function AskPage() {
  const { activeBusiness } = useAuth()
  const [question, setQuestion]         = useState('')
  const [period, setPeriod]             = useState<AIPeriod>('monthly')
  const [answer, setAnswer]             = useState<AIResponse | null>(null)
  const [askedQuestion, setAskedQuestion] = useState('')
  const [askedPeriod, setAskedPeriod]   = useState<AIPeriod>('monthly')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const ask = async (value = question, askPeriod = period) => {
    const trimmed = value.trim()
    if (trimmed.length < 3 || loading) return
    setQuestion(trimmed)
    setAskedQuestion(trimmed)
    setAskedPeriod(askPeriod)
    setError('')
    setAnswer(null)
    setLoading(true)
    try {
      setAnswer(await aiApi.ask(trimmed, askPeriod))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'KEETY could not answer right now. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); void ask() }

  return (
    <div className="page-content ai-page">
      <PageHeader
        eyebrow="BUSINESS ASSISTANT"
        title="Ask KEETY"
        description={`A practical perspective on ${activeBusiness?.name || 'your business'}, grounded in current data.`}
        action={
          <Link to="/app/ai-history" className="button button-secondary">
            <History size={15} /> View history
          </Link>
        }
      />

      {/* Intro with period selector + suggested questions */}
      {!answer && !loading && !error && (
        <section className="ask-intro">
          <div className="ask-intro-mark"><Sparkles size={21} /></div>
          <h2>What would you like to understand?</h2>
          <p>KEETY uses your business profile, product data, and analytics to shape each answer.</p>

          {/* Period selector — AI.md §11: resolve "last month" deterministically */}
          <div className="ask-period-row">
            <span className="ask-period-label">Data period:</span>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          <div className="suggested-questions">
            {suggestedQuestions.map((s) => (
              <button key={s} onClick={() => { setQuestion(s); void ask(s, period) }}>
                {s}<ArrowRight size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Conversation thread */}
      {(answer || loading || error) && (
        <section className="conversation" aria-live="polite">
          <div className="conversation-question">
            <span className="question-avatar">
              {activeBusiness?.name.slice(0, 1).toUpperCase() || 'Y'}
            </span>
            <p>{askedQuestion}</p>
          </div>
          <AnswerPanel
            answer={answer} loading={loading} error={error}
            period={askedPeriod}
            onRetry={() => void ask(askedQuestion, askedPeriod)}
          />
        </section>
      )}

      {/* Composer with period selector */}
      <form className="ask-composer" onSubmit={submit}>
        <TextareaField
          label="Your question"
          name="question"
          rows={3}
          maxLength={1000}
          placeholder="Ask about your products, sales, inventory, or next move…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="composer-footer">
          <div className="composer-period-row">
            <PeriodSelector value={period} onChange={setPeriod} label="Context period" />
          </div>
          <Button
            type="submit"
            disabled={loading || question.trim().length < 3}
            icon={<Send size={16} />}
          >
            {loading ? 'Thinking…' : 'Ask KEETY'}
          </Button>
        </div>
        <div className="composer-hint">
          {question.length}/1000 · KEETY only receives your question and {PERIOD_LABELS[period].toLowerCase()} analytics
        </div>
      </form>

      <div className="ai-page-links">
        <Link to="/app/growth"   className="subtle-link"><Target size={14} /> Build a growth plan <ArrowRight size={13} /></Link>
        <Link to="/app/summary"  className="subtle-link"><BarChart3 size={14} /> Business summary <ArrowRight size={13} /></Link>
        <Link to="/app/ai-history" className="subtle-link"><History size={14} /> View history <ArrowRight size={13} /></Link>
      </div>
    </div>
  )
}

// ─── Growth plan ──────────────────────────────────────────────────────────────

const growthGoals = [
  'Increase monthly revenue', 'Improve repeat customer activity',
  'Improve product sales', 'Reduce inventory risk', 'Improve profitability',
]

export function GrowthPage() {
  const { activeBusiness } = useAuth()
  const [goal, setGoal]           = useState(growthGoals[0])
  const [customGoal, setCustomGoal] = useState('')
  const [period, setPeriod]       = useState<AIPeriod>('monthly')
  const [result, setResult]       = useState<AIResponse | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const effectiveGoal = goal === 'Something else' ? customGoal : goal

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (effectiveGoal.trim().length < 3) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await aiApi.growthStrategy(effectiveGoal.trim(), period)) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'KEETY could not prepare a strategy right now.') }
    finally { setLoading(false) }
  }

  return (
    <div className="page-content growth-page">
      <PageHeader
        eyebrow="PLAN YOUR NEXT MOVE"
        title="Growth plan"
        description={`Start with a goal. KEETY will use ${activeBusiness?.name || 'your business'} data to shape an evidence-based response.`}
      />

      <div className="growth-layout">
        <Panel className="growth-form-panel">
          <div className="growth-form-heading">
            <span className="growth-icon"><Target size={19} /></span>
            <div><h2>What would you like to change?</h2><p>Choose one area to focus your strategy.</p></div>
          </div>
          <form className="stack-form" onSubmit={submit}>
            <div className="goal-options" role="radiogroup" aria-label="Growth goal">
              {growthGoals.map((item) => (
                <label key={item} className={`goal-option ${goal === item ? 'goal-selected' : ''}`}>
                  <input type="radio" name="goal" value={item} checked={goal === item} onChange={() => setGoal(item)} />
                  <span className="goal-check" />{item}
                </label>
              ))}
              <label className={`goal-option ${goal === 'Something else' ? 'goal-selected' : ''}`}>
                <input type="radio" name="goal" value="Something else" checked={goal === 'Something else'} onChange={() => setGoal('Something else')} />
                <span className="goal-check" />Something else
              </label>
            </div>

            {goal === 'Something else' && (
              <TextareaField label="Describe your goal" name="customGoal" rows={3} maxLength={500}
                required value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="What would you like to improve?" />
            )}

            {/* Period selector — anchor the strategy to the right analytics window */}
            <div className="growth-period-row">
              <span className="growth-period-label">Base data on:</span>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" disabled={loading || effectiveGoal.trim().length < 3} icon={<ArrowRight size={16} />}>
              {loading ? 'Preparing your strategy…' : 'Generate strategy'}
            </Button>
          </form>
        </Panel>

        <aside className="growth-context">
          <p className="eyebrow">A GROUNDED APPROACH</p>
          <h2>Useful starts with what's true.</h2>
          <p>KEETY combines your business profile and measured analytics. Recommendations are evidence-based possibilities — not guaranteed outcomes.</p>
          <div className="growth-context-line">
            <BookOpenCheck size={16} />
            <span>Based on available sales, product, inventory, and expense metrics</span>
          </div>
          <div className="growth-context-links">
            <Link to="/app/ask-keety" className="subtle-link"><Sparkles size={13} /> Ask a specific question <ArrowRight size={13} /></Link>
            <Link to="/app/summary"   className="subtle-link"><BarChart3 size={13} /> View business summary <ArrowRight size={13} /></Link>
          </div>
        </aside>
      </div>

      {result && (
        <div className="growth-result-section">
          <AnswerPanel answer={result} loading={false} error="" period={period}
            label={`Strategy based on ${activeBusiness?.name || 'your business'} data`} />
        </div>
      )}
    </div>
  )
}

// ─── Product Analysis ─────────────────────────────────────────────────────────

export function ProductAnalysisPage() {
  const { activeBusiness } = useAuth()
  const [products, setProducts]         = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedId, setSelectedId]     = useState('')
  const [question, setQuestion]         = useState('')
  const [period, setPeriod]             = useState<AIPeriod>('monthly')
  const [answer, setAnswer]             = useState<AIResponse | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const prevBizId = useRef<string | undefined>(undefined)

  useEffect(() => {
    const bizId = activeBusiness?._id
    if (!bizId || bizId === prevBizId.current) return
    prevBizId.current = bizId
    setLoadingProducts(true); setSelectedId(''); setAnswer(null)
    productsApi.list({ status: 'ACTIVE', limit: 100 })
      .then((res) => setProducts(res.products))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [activeBusiness?._id])

  const analyse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedId || loading) return
    setLoading(true); setError(''); setAnswer(null)
    try { setAnswer(await aiApi.productAnalysis(selectedId, question.trim() || undefined, period)) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'KEETY could not analyse this product right now.') }
    finally { setLoading(false) }
  }

  const selectedProduct = products.find((p) => p._id === selectedId)

  return (
    <div className="page-content ai-page">
      <PageHeader eyebrow="PRODUCT INTELLIGENCE" title="Product analysis"
        description="Understand a product's performance, inventory risk, and what your data suggests."
        action={<Link to="/app/products" className="button button-secondary"><Package size={15} /> Manage products</Link>}
      />

      <div className="product-analysis-layout">
        <Panel className="product-analysis-form">
          <form className="stack-form" onSubmit={analyse}>
            {loadingProducts ? <LoadingBlock rows={3} /> : products.length === 0 ? (
              <EmptyState icon={<Package size={20} />} title="No active products"
                detail="Add products to your catalog before using product analysis."
                action={<Link to="/app/products" className="button button-primary">Add a product</Link>} />
            ) : (
              <>
                <SelectField label="Select a product" name="product" value={selectedId}
                  onChange={(e) => { setSelectedId(e.target.value); setAnswer(null) }} required>
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}{p.sku ? ` · ${p.sku}` : ''}</option>
                  ))}
                </SelectField>

                {selectedProduct && (
                  <div className="product-quick-stats">
                    <span><strong>Price:</strong> <Currency amount={selectedProduct.price} code={activeBusiness?.currency} /></span>
                    {selectedProduct.category && <span><strong>Category:</strong> {selectedProduct.category}</span>}
                    <span className={`product-status-inline ${selectedProduct.status.toLowerCase()}`}>{selectedProduct.status}</span>
                  </div>
                )}

                <div className="growth-period-row">
                  <span className="growth-period-label">Period:</span>
                  <PeriodSelector value={period} onChange={setPeriod} />
                </div>

                <TextareaField label="Specific question (optional)" name="question" rows={2} maxLength={500}
                  placeholder="e.g. Should I run a promotion? Why is this product slow?"
                  value={question} onChange={(e) => setQuestion(e.target.value)} />

                <Button type="submit" disabled={!selectedId || loading} icon={<Sparkles size={15} />}>
                  {loading ? 'Analysing…' : 'Analyse product'}
                </Button>
              </>
            )}
          </form>
        </Panel>

        <aside className="ai-sidebar">
          <p className="eyebrow">WHAT THIS COVERS</p>
          <ul className="ai-sidebar-list">
            <li><Layers size={14} /> Sales performance this period</li>
            <li><Package size={14} /> Inventory and reorder status</li>
            <li><TrendingUp size={14} /> Comparison with top &amp; slow products</li>
            <li><BarChart3 size={14} /> Pricing and category context</li>
          </ul>
          <p className="ai-sidebar-note">Numbers come from your business database. KEETY explains what the data says — it doesn't invent metrics.</p>
        </aside>
      </div>

      {(answer || loading || error) && (
        <AnswerPanel answer={answer} loading={loading} error={error} period={period}
          label={selectedProduct ? `Analysis of ${selectedProduct.name}` : 'Product analysis'}
          onRetry={() => { if (selectedId) { const fe = { preventDefault: () => {} } as FormEvent<HTMLFormElement>; void analyse(fe) } }}
        />
      )}
    </div>
  )
}

// ─── Business Summary ─────────────────────────────────────────────────────────

const SUMMARY_PERIOD_LABELS: Record<AIPeriod, string> = { daily: 'Today', weekly: 'This week', monthly: 'This month' }

export function BusinessSummaryPage() {
  const { activeBusiness }          = useAuth()
  const [period, setPeriod]         = useState<AIPeriod>('monthly')
  const [answer, setAnswer]         = useState<AIResponse | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [generated, setGenerated]   = useState(false)

  const generate = async (p = period) => {
    setLoading(true); setError(''); setAnswer(null); setGenerated(false)
    try { setAnswer(await aiApi.summary(p)); setGenerated(true) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'KEETY could not generate a summary right now.') }
    finally { setLoading(false) }
  }

  const handlePeriodChange = (p: AIPeriod) => { setPeriod(p); setAnswer(null); setGenerated(false); setError('') }

  return (
    <div className="page-content ai-page">
      <PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Business summary"
        description={`An AI-generated summary of ${activeBusiness?.name || 'your business'} performance, grounded in current data.`}
      />

      <Panel className="summary-controls">
        <div className="summary-controls-row">
          <div className="summary-period-buttons" role="group" aria-label="Summary period">
            {(Object.keys(SUMMARY_PERIOD_LABELS) as AIPeriod[]).map((p) => (
              <button key={p} className={`summary-period-btn ${period === p ? 'active' : ''}`}
                onClick={() => handlePeriodChange(p)} type="button">
                {SUMMARY_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button onClick={() => void generate(period)} disabled={loading}
            icon={loading ? <Loader size={15} className="ai-spin" /> : <Sparkles size={15} />}>
            {loading ? 'Generating…' : generated ? 'Regenerate' : 'Generate summary'}
          </Button>
        </div>
        <p className="summary-controls-note">
          <BarChart3 size={13} />
          Summary uses your {SUMMARY_PERIOD_LABELS[period].toLowerCase()} sales, product performance, inventory, expense, and customer data.
        </p>
      </Panel>

      {(answer || loading || error) && (
        <AnswerPanel answer={answer} loading={loading} error={error} period={period}
          label={`${SUMMARY_PERIOD_LABELS[period]} summary · ${activeBusiness?.name || 'your business'}`}
          onRetry={() => void generate(period)} />
      )}

      {!loading && !answer && !error && (
        <div className="ai-empty-prompt">
          <Sparkles size={24} className="ai-empty-icon" />
          <h2>Choose a period and generate your summary.</h2>
          <p>KEETY will analyse your business data and return a grounded briefing with insights and recommendations.</p>
          <div className="ai-page-links">
            <Link to="/app/analytics"  className="subtle-link"><BarChart3 size={14} /> View full analytics <ArrowRight size={13} /></Link>
            <Link to="/app/ask-keety"  className="subtle-link"><Sparkles size={14} /> Ask a specific question <ArrowRight size={13} /></Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI History ───────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<AILogEntry['requestType'], string> = {
  ASK: 'Question', GROWTH_STRATEGY: 'Growth plan',
  PRODUCT_ANALYSIS: 'Product analysis', SUMMARY: 'Business summary',
}

function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

export function AIHistoryPage() {
  const { activeBusiness } = useAuth()
  const [logs, setLogs]         = useState<AILogEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const prevBizId = useRef<string | undefined>(undefined)

  const loadHistory = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const res = await aiApi.history({ page: p, limit: 20 })
      setLogs(res.logs)
      setTotalPages(res.pagination.pages)
      setPage(p)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not load AI history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const bizId = activeBusiness?._id
    if (!bizId || bizId === prevBizId.current) return
    prevBizId.current = bizId
    void loadHistory(1)
  }, [activeBusiness?._id])

  return (
    <div className="page-content ai-page">
      <PageHeader eyebrow="AI TRACEABILITY" title="AI history"
        description="Every KEETY AI request for this business, with timing and cost metadata."
        action={<Link to="/app/ask-keety" className="button button-primary"><Sparkles size={15} /> Ask KEETY</Link>}
      />

      {error && <Notice tone="error">{error}<button className="text-button" onClick={() => void loadHistory(page)}>Retry <RefreshCw size={13} /></button></Notice>}

      {loading ? <LoadingBlock rows={6} /> : logs.length === 0 ? (
        <EmptyState icon={<History size={22} />} title="No AI history yet"
          detail="AI requests appear here once you use Ask KEETY, Growth plan, Product analysis, or Business summary."
          action={<Link to="/app/ask-keety" className="button button-primary">Ask KEETY</Link>} />
      ) : (
        <>
          <div className="history-list">
            {logs.map((log) => (
              <div key={log._id} className="history-entry">
                <div className="history-entry-header">
                  <div className="history-entry-meta">
                    <span className={`history-status-dot history-status-${log.status.toLowerCase()}`} />
                    <strong className="history-type">{REQUEST_TYPE_LABELS[log.requestType]}</strong>
                    <span className="history-period">{PERIOD_LABELS[log.period as AIPeriod] || log.period}</span>
                    <span className="history-time">
                      <Clock size={11} /> {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="history-entry-stats">
                    <span title="Latency">{formatMs(log.latencyMs)}</span>
                    {log.tokenUsage.totalTokens > 0 && (
                      <span title="Tokens used">{log.tokenUsage.totalTokens.toLocaleString()} tokens</span>
                    )}
                    {log.estimatedCostUsd > 0 && (
                      <span title="Estimated cost">${log.estimatedCostUsd.toFixed(5)}</span>
                    )}
                  </div>
                </div>
                <p className="history-prompt">{log.userPrompt}</p>
                {log.status === 'SUCCESS' && log.response && (
                  <p className="history-response">{log.response.slice(0, 180)}{log.response.length > 180 ? '…' : ''}</p>
                )}
                {log.status === 'FAILED' && (
                  <p className="history-failed"><XCircle size={12} /> Request failed</p>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-bar">
              <button className="button button-secondary button-small" disabled={page <= 1}
                onClick={() => void loadHistory(page - 1)}>Previous</button>
              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Page {page} of {totalPages}</span>
              <button className="button button-secondary button-small" disabled={page >= totalPages}
                onClick={() => void loadHistory(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Knowledge Base (RAG documents) ──────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<BusinessDocument['sourceType'], string> = {
  PDF: 'PDF', TEXT: 'Plain text', MARKDOWN: 'Markdown',
  HTML: 'HTML', CSV: 'CSV', OTHER: 'Other',
}

const STATUS_TONE: Record<BusinessDocument['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  INDEXED:    'success',
  UPLOADED:   'neutral',
  PROCESSING: 'warning',
  FAILED:     'danger',
  DELETED:    'neutral',
}

export function KnowledgeBasePage() {
  const { activeBusiness } = useAuth()
  const [documents, setDocuments]   = useState<BusinessDocument[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const prevBizId = useRef<string | undefined>(undefined)

  // Form state
  const [docName, setDocName]         = useState('')
  const [docText, setDocText]         = useState('')
  const [docDesc, setDocDesc]         = useState('')
  const [docType, setDocType]         = useState<BusinessDocument['sourceType']>('TEXT')

  const loadDocuments = async () => {
    setLoading(true); setError('')
    try {
      const res = await ragApi.list({ limit: 50 })
      setDocuments(res.documents)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const bizId = activeBusiness?._id
    if (!bizId || bizId === prevBizId.current) return
    prevBizId.current = bizId
    void loadDocuments()
  }, [activeBusiness?._id])

  const submitDocument = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!docName.trim() || !docText.trim()) return
    setSubmitting(true); setFormError('')
    try {
      await ragApi.ingest({ name: docName.trim(), text: docText, description: docDesc, sourceType: docType })
      setDocName(''); setDocText(''); setDocDesc(''); setShowForm(false)
      await loadDocuments()
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : 'Could not upload document.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await ragApi.delete(id)
      setDocuments((prev) => prev.filter((d) => d._id !== id))
    } catch (cause) {
      alert(cause instanceof ApiError ? cause.message : 'Could not delete document.')
    }
  }

  return (
    <div className="page-content ai-page">
      <PageHeader eyebrow="BUSINESS KNOWLEDGE" title="Knowledge base"
        description="Upload business documents so KEETY can reference your policies, product guides, and other knowledge."
        action={
          <Button onClick={() => setShowForm((v) => !v)} icon={<Plus size={15} />}>
            {showForm ? 'Cancel' : 'Add document'}
          </Button>
        }
      />

      {/* Upload form */}
      {showForm && (
        <Panel className="kb-upload-form">
          <SectionHeading title="Add a document" detail="Paste text content — PDF/file parsing coming soon." />
          <form className="stack-form" onSubmit={submitDocument}>
            <div className="form-grid-two">
              <div className="field">
                <label htmlFor="doc-name">Document name *</label>
                <input id="doc-name" type="text" maxLength={255} required
                  placeholder="e.g. Return Policy v2" value={docName}
                  onChange={(e) => setDocName(e.target.value)} />
              </div>
              <SelectField label="Type" name="docType" value={docType}
                onChange={(e) => setDocType(e.target.value as BusinessDocument['sourceType'])}>
                {(Object.keys(SOURCE_TYPE_LABELS) as BusinessDocument['sourceType'][]).map((t) => (
                  <option key={t} value={t}>{SOURCE_TYPE_LABELS[t]}</option>
                ))}
              </SelectField>
            </div>
            <TextareaField label="Description (optional)" name="docDesc" rows={1} maxLength={200}
              placeholder="What this document covers" value={docDesc}
              onChange={(e) => setDocDesc(e.target.value)} />
            <TextareaField label="Document text *" name="docText" rows={8} required
              placeholder="Paste the document content here…"
              value={docText} onChange={(e) => setDocText(e.target.value)} />
            {formError && <Notice tone="error">{formError}</Notice>}
            <div className="form-actions">
              <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !docName.trim() || !docText.trim()}
                icon={submitting ? <Loader size={15} className="ai-spin" /> : <Upload size={15} />}>
                {submitting ? 'Uploading…' : 'Upload document'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? <LoadingBlock rows={4} /> : documents.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No documents yet"
          detail="Upload business documents — policies, product guides, menus, manuals — to give KEETY a knowledge base to draw from."
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={15} />}>Add first document</Button>} />
      ) : (
        <div className="kb-document-list">
          {documents.map((doc) => (
            <div key={doc._id} className="kb-document-row">
              <div className="kb-doc-icon"><FileText size={17} /></div>
              <div className="kb-doc-body">
                <div className="kb-doc-header">
                  <strong>{doc.name}</strong>
                  <StatusBadge tone={STATUS_TONE[doc.status]}>{doc.status}</StatusBadge>
                </div>
                {doc.description && <p className="kb-doc-desc">{doc.description}</p>}
                <div className="kb-doc-meta">
                  <span>{SOURCE_TYPE_LABELS[doc.sourceType]}</span>
                  <span>{doc.wordCount.toLocaleString()} words</span>
                  <span>v{doc.version}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="icon-button" title="Delete document"
                onClick={() => void handleDelete(doc._id, doc.name)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
