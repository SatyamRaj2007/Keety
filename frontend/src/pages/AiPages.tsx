import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight, BarChart3, BookOpenCheck,
  Check, Layers, Lightbulb, Loader,
  Package, RefreshCw, Send, Sparkles, Target, TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { aiApi } from '../api/ai.api'
import { ApiError } from '../api/client'
import { productsApi } from '../api/products.api'
import {
  Button, Currency, EmptyState, LoadingBlock, Notice,
  PageHeader, Panel, SelectField, TextareaField,
} from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { AIInsight, AIRecommendation, AIResponse, Product } from '../types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const PRIORITY_LABEL = { HIGH: 'High priority', MEDIUM: 'Medium priority', LOW: 'Lower priority' }

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

/** Full structured answer panel — shared by all AI pages */
function AnswerPanel({
  answer,
  loading,
  error,
  onRetry,
  label = 'Based on current business analytics',
}: {
  answer: AIResponse | null
  loading: boolean
  error: string
  onRetry?: () => void
  label?: string
}) {
  if (loading) {
    return (
      <Panel className="ai-thinking" aria-live="polite">
        <span className="thinking-mark"><Loader size={19} className="ai-spin" /></span>
        <div>
          <strong>KEETY is reviewing your business data.</strong>
          <p>Building context from your analytics and preparing a grounded answer.</p>
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

  const hasInsights = answer.insights.length > 0
  const hasRecs = answer.recommendations.length > 0
  const hasLimitations = (answer.limitations ?? []).length > 0

  return (
    <Panel className="answer-panel" aria-live="polite">
      <div className="answer-heading">
        <span className="answer-avatar"><Sparkles size={17} /></span>
        <div>
          <strong>KEETY</strong>
          <small>{label}</small>
        </div>
      </div>

      {/* Main answer */}
      <div className="answer-body">{answer.answer}</div>

      {/* Insights */}
      {hasInsights && (
        <div className="answer-subsection">
          <h3><Lightbulb size={15} /> What stands out</h3>
          <div className="ai-cards-grid">
            {answer.insights.map((insight) => (
              <InsightCard key={insight.title} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {hasRecs && (
        <div className="answer-subsection">
          <h3><TrendingUp size={15} /> Recommended actions</h3>
          <div className="ai-recs-list">
            {answer.recommendations.map((rec) => (
              <RecommendationCard key={rec.title} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Evidence / limitations */}
      {hasLimitations && <LimitationsNotice limitations={answer.limitations!} />}
      <DataSourceLine source={answer.dataSource} />
    </Panel>
  )
}

// ─── Ask KEETY ─────────────────────────────────────────────────────────────────

const suggestedQuestions = [
  'Which products should I focus on this month?',
  'How is my business performing compared to last month?',
  'What inventory should I reorder?',
  'Where is the biggest growth opportunity?',
]

export function AskPage() {
  const { activeBusiness } = useAuth()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AIResponse | null>(null)
  const [askedQuestion, setAskedQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ask = async (value = question) => {
    const trimmed = value.trim()
    if (trimmed.length < 3 || loading) return
    setQuestion(trimmed)
    setAskedQuestion(trimmed)
    setError('')
    setAnswer(null)
    setLoading(true)
    try {
      setAnswer(await aiApi.ask(trimmed))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'KEETY could not answer right now. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ask()
  }

  return (
    <div className="page-content ai-page">
      <PageHeader
        eyebrow="BUSINESS ASSISTANT"
        title="Ask KEETY"
        description={`A practical perspective on ${activeBusiness?.name || 'your business'}, grounded in current data.`}
      />

      {/* Intro with suggested questions */}
      {!answer && !loading && !error && (
        <section className="ask-intro">
          <div className="ask-intro-mark"><Sparkles size={21} /></div>
          <h2>What would you like to understand?</h2>
          <p>KEETY uses your business profile, product data, and current analytics to shape each answer.</p>
          <div className="suggested-questions">
            {suggestedQuestions.map((suggestion) => (
              <button key={suggestion} onClick={() => { setQuestion(suggestion); void ask(suggestion) }}>
                {suggestion}<ArrowRight size={14} />
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
            answer={answer}
            loading={loading}
            error={error}
            onRetry={() => void ask(askedQuestion)}
          />
        </section>
      )}

      {/* Composer */}
      <form className="ask-composer" onSubmit={submit}>
        <TextareaField
          label="Your question"
          name="question"
          rows={3}
          maxLength={1000}
          placeholder="Ask about your products, sales, inventory, or next move…"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="composer-footer">
          <span>{question.length}/1000 · KEETY only receives your question and business analytics</span>
          <Button
            type="submit"
            disabled={loading || question.trim().length < 3}
            icon={<Send size={16} />}
          >
            {loading ? 'Thinking…' : 'Ask KEETY'}
          </Button>
        </div>
      </form>

      {/* Secondary links */}
      <div className="ai-page-links">
        <Link to="/app/growth" className="subtle-link">
          <Target size={14} /> Build a growth plan <ArrowRight size={13} />
        </Link>
        <Link to="/app/summary" className="subtle-link">
          <BarChart3 size={14} /> Business summary <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

// ─── Growth plan ───────────────────────────────────────────────────────────────

const growthGoals = [
  'Increase monthly revenue',
  'Improve repeat customer activity',
  'Improve product sales',
  'Reduce inventory risk',
  'Improve profitability',
]

export function GrowthPage() {
  const { activeBusiness } = useAuth()
  const [goal, setGoal] = useState(growthGoals[0])
  const [customGoal, setCustomGoal] = useState('')
  const [result, setResult] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const effectiveGoal = goal === 'Something else' ? customGoal : goal

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (effectiveGoal.trim().length < 3) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await aiApi.growthStrategy(effectiveGoal.trim()))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'KEETY could not prepare a strategy right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content growth-page">
      <PageHeader
        eyebrow="PLAN YOUR NEXT MOVE"
        title="Growth plan"
        description={`Start with a goal. KEETY will use ${activeBusiness?.name || 'your business'} data to shape an evidence-based response.`}
      />

      <div className="growth-layout">
        {/* Goal selector */}
        <Panel className="growth-form-panel">
          <div className="growth-form-heading">
            <span className="growth-icon"><Target size={19} /></span>
            <div>
              <h2>What would you like to change?</h2>
              <p>Choose one area to focus your strategy.</p>
            </div>
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
              <TextareaField
                label="Describe your goal"
                name="customGoal"
                rows={3}
                maxLength={500}
                required
                value={customGoal}
                onChange={(event) => setCustomGoal(event.target.value)}
                placeholder="What would you like to improve?"
              />
            )}

            {error && <Notice tone="error">{error}</Notice>}

            <Button
              type="submit"
              disabled={loading || effectiveGoal.trim().length < 3}
              icon={<ArrowRight size={16} />}
            >
              {loading ? 'Preparing your strategy…' : 'Generate strategy'}
            </Button>
          </form>
        </Panel>

        {/* Context sidebar */}
        <aside className="growth-context">
          <p className="eyebrow">A GROUNDED APPROACH</p>
          <h2>Useful starts with what's true.</h2>
          <p>
            KEETY combines your business profile and measured analytics.
            Recommendations are evidence-based possibilities — not guaranteed outcomes.
          </p>
          <div className="growth-context-line">
            <BookOpenCheck size={16} />
            <span>Based on available sales, product, inventory, and expense metrics</span>
          </div>
          <div className="growth-context-links">
            <Link to="/app/ask-keety" className="subtle-link">
              <Sparkles size={13} /> Ask a specific question <ArrowRight size={13} />
            </Link>
            <Link to="/app/summary" className="subtle-link">
              <BarChart3 size={13} /> View business summary <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </div>

      {/* Result */}
      {result && (
        <div className="growth-result-section">
          <AnswerPanel
            answer={result}
            loading={false}
            error=""
            label={`Strategy based on ${activeBusiness?.name || 'your business'} data`}
          />
        </div>
      )}
    </div>
  )
}

// ─── Product Analysis ─────────────────────────────────────────────────────────

export function ProductAnalysisPage() {
  const { activeBusiness } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const prevBizId = useRef<string | undefined>(undefined)

  // Load active products for the selector
  useEffect(() => {
    const bizId = activeBusiness?._id
    if (!bizId || bizId === prevBizId.current) return
    prevBizId.current = bizId
    setLoadingProducts(true)
    setSelectedId('')
    setAnswer(null)
    productsApi.list({ status: 'ACTIVE', limit: 100 })
      .then((res) => setProducts(res.products))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [activeBusiness?._id])

  const analyse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId || loading) return
    setLoading(true)
    setError('')
    setAnswer(null)
    try {
      setAnswer(await aiApi.productAnalysis(selectedId, question.trim() || undefined))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'KEETY could not analyse this product right now.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p._id === selectedId)

  return (
    <div className="page-content ai-page">
      <PageHeader
        eyebrow="PRODUCT INTELLIGENCE"
        title="Product analysis"
        description="Understand a product's performance, inventory risk, and what your data suggests."
        action={
          <Link to="/app/products" className="button button-secondary">
            <Package size={15} /> Manage products
          </Link>
        }
      />

      <div className="product-analysis-layout">
        <Panel className="product-analysis-form">
          <form className="stack-form" onSubmit={analyse}>
            {loadingProducts ? (
              <LoadingBlock rows={3} />
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package size={20} />}
                title="No active products"
                detail="Add products to your catalog before using product analysis."
                action={<Link to="/app/products" className="button button-primary">Add a product</Link>}
              />
            ) : (
              <>
                <SelectField
                  label="Select a product"
                  name="product"
                  value={selectedId}
                  onChange={(event) => { setSelectedId(event.target.value); setAnswer(null) }}
                  required
                >
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}{p.sku ? ` · ${p.sku}` : ''}
                    </option>
                  ))}
                </SelectField>

                {/* Show selected product quick stats */}
                {selectedProduct && (
                  <div className="product-quick-stats">
                    <span><strong>Price:</strong> <Currency amount={selectedProduct.price} code={activeBusiness?.currency} /></span>
                    {selectedProduct.category && <span><strong>Category:</strong> {selectedProduct.category}</span>}
                    <span className={`product-status-inline ${selectedProduct.status.toLowerCase()}`}>
                      {selectedProduct.status}
                    </span>
                  </div>
                )}

                <TextareaField
                  label="Specific question (optional)"
                  name="question"
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Should I run a promotion? Why is this product slow?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />

                <Button
                  type="submit"
                  disabled={!selectedId || loading}
                  icon={<Sparkles size={15} />}
                >
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
          <p className="ai-sidebar-note">
            Numbers come from your business database.
            KEETY explains what the data says — it doesn't invent metrics.
          </p>
        </aside>
      </div>

      {(answer || loading || error) && (
        <AnswerPanel
          answer={answer}
          loading={loading}
          error={error}
          label={selectedProduct ? `Analysis of ${selectedProduct.name}` : 'Product analysis'}
          onRetry={() => {
            if (selectedId) {
              const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>
              void analyse(fakeEvent)
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Business Summary ─────────────────────────────────────────────────────────

const PERIOD_LABELS = {
  daily: 'Today',
  weekly: 'This week',
  monthly: 'This month',
} as const

type Period = keyof typeof PERIOD_LABELS

export function BusinessSummaryPage() {
  const { activeBusiness } = useAuth()
  const [period, setPeriod] = useState<Period>('monthly')
  const [answer, setAnswer] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  const generate = async (selectedPeriod = period) => {
    setLoading(true)
    setError('')
    setAnswer(null)
    setGenerated(false)
    try {
      setAnswer(await aiApi.summary(selectedPeriod))
      setGenerated(true)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'KEETY could not generate a summary right now.')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
    setAnswer(null)
    setGenerated(false)
    setError('')
  }

  return (
    <div className="page-content ai-page">
      <PageHeader
        eyebrow="BUSINESS INTELLIGENCE"
        title="Business summary"
        description={`An AI-generated summary of ${activeBusiness?.name || 'your business'} performance, grounded in current data.`}
      />

      {/* Period selector + generate */}
      <Panel className="summary-controls">
        <div className="summary-controls-row">
          <div className="summary-period-buttons" role="group" aria-label="Summary period">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                className={`summary-period-btn ${period === p ? 'active' : ''}`}
                onClick={() => handlePeriodChange(p)}
                type="button"
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button
            onClick={() => void generate(period)}
            disabled={loading}
            icon={loading ? <Loader size={15} className="ai-spin" /> : <Sparkles size={15} />}
          >
            {loading ? 'Generating…' : generated ? 'Regenerate' : 'Generate summary'}
          </Button>
        </div>
        <p className="summary-controls-note">
          <BarChart3 size={13} />
          Summary uses your {PERIOD_LABELS[period].toLowerCase()} sales, product performance,
          inventory, expense, and customer data.
        </p>
      </Panel>

      {/* Result */}
      {(answer || loading || error) && (
        <AnswerPanel
          answer={answer}
          loading={loading}
          error={error}
          label={`${PERIOD_LABELS[period]} summary · ${activeBusiness?.name || 'your business'}`}
          onRetry={() => void generate(period)}
        />
      )}

      {/* Links to detailed views */}
      {!loading && !answer && !error && (
        <div className="ai-empty-prompt">
          <Sparkles size={24} className="ai-empty-icon" />
          <h2>Choose a period and generate your summary.</h2>
          <p>KEETY will analyse your business data and return a grounded briefing with insights and recommendations.</p>
          <div className="ai-page-links">
            <Link to="/app/analytics" className="subtle-link">
              <BarChart3 size={14} /> View full analytics <ArrowRight size={13} />
            </Link>
            <Link to="/app/ask-keety" className="subtle-link">
              <Sparkles size={14} /> Ask a specific question <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
