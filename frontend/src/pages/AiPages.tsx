import { useState, type FormEvent } from 'react'
import { ArrowRight, BookOpenCheck, Check, CircleAlert, Lightbulb, Send, Sparkles, Target } from 'lucide-react'
import { aiApi } from '../api/ai.api'
import { ApiError } from '../api/client'
import { Button, Notice, PageHeader, Panel, TextareaField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { AIResponse } from '../types'

const suggestedQuestions = [
  'Which products should I focus on?',
  'What changed in my business this month?',
  'Where should I look for a growth opportunity?',
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

  return <div className="page-content ai-page">
    <PageHeader eyebrow="BUSINESS ASSISTANT" title="Ask KEETY" description={`A practical perspective on ${activeBusiness?.name || 'your business'}, grounded in current data.`} />
    {!answer && !loading && <section className="ask-intro">
      <div className="ask-intro-mark"><Sparkles size={21} /></div>
      <h2>What would you like to understand?</h2>
      <p>KEETY uses your business profile and current analytics to shape each answer.</p>
      <div className="suggested-questions">{suggestedQuestions.map((suggestion) => <button key={suggestion} onClick={() => { setQuestion(suggestion); void ask(suggestion) }}>{suggestion}<ArrowRight size={14} /></button>)}</div>
    </section>}
    {error && <Notice tone="error"><strong>KEETY couldn’t generate an answer.</strong><p>{error}</p><button className="text-button" onClick={() => void ask(askedQuestion)}>Try again <ArrowRight size={15} /></button></Notice>}
    {loading && <Panel className="ai-thinking" aria-live="polite"><span className="thinking-mark"><Sparkles size={19} /></span><div><strong>KEETY is looking at your business.</strong><p>Checking the available metrics and preparing a grounded answer.</p></div><span className="thinking-dots"><i /><i /><i /></span></Panel>}
    {answer && <section className="conversation" aria-live="polite">
      <div className="conversation-question"><span className="question-avatar">{activeBusiness?.name.slice(0, 1).toUpperCase()}</span><p>{askedQuestion}</p></div>
      <Panel className="answer-panel">
        <div className="answer-heading"><span className="answer-avatar"><Sparkles size={17} /></span><div><strong>KEETY</strong><small>Based on current business analytics</small></div></div>
        <div className="answer-body">{answer.answer}</div>
        {answer.insights.length > 0 && <div className="answer-subsection"><h3><Lightbulb size={16} /> What stands out</h3>{answer.insights.map((insight) => <div className="answer-insight" key={insight.title}><strong>{insight.title}</strong><p>{insight.description}</p></div>)}</div>}
        {answer.recommendations.length > 0 && <div className="answer-subsection"><h3><Check size={16} /> Recommended actions</h3>{answer.recommendations.map((recommendation) => <div className="answer-insight" key={recommendation.title}><strong>{recommendation.title}</strong><p>{recommendation.description}</p></div>)}</div>}
        {answer.insights.length === 0 && answer.recommendations.length === 0 && <p className="answer-format-note"><CircleAlert size={14} /> The current AI endpoint returns a written answer; structured insights are not included yet.</p>}
      </Panel>
    </section>}
    <form className="ask-composer" onSubmit={submit}>
      <TextareaField label="Your question" name="question" rows={3} maxLength={1000} placeholder="Ask about your products, sales, or next move…" value={question} onChange={(event) => setQuestion(event.target.value)} />
      <div className="composer-footer"><span>{question.length}/1000 · KEETY only receives your question</span><Button type="submit" disabled={loading || question.trim().length < 3} icon={<Send size={16} />}>{loading ? 'Thinking…' : 'Ask KEETY'}</Button></div>
    </form>
  </div>
}

const growthGoals = [
  'Increase monthly revenue', 'Improve repeat customer activity', 'Improve product sales',
  'Reduce inventory risk', 'Improve profitability',
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
    try { setResult(await aiApi.growthStrategy(effectiveGoal.trim())) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'KEETY could not prepare a strategy right now.') }
    finally { setLoading(false) }
  }

  return <div className="page-content growth-page">
    <PageHeader eyebrow="PLAN YOUR NEXT MOVE" title="Growth plan" description={`Start with a goal. KEETY will use available data from ${activeBusiness?.name || 'your business'} to shape a practical response.`} />
    <div className="growth-layout">
      <Panel className="growth-form-panel">
        <div className="growth-form-heading"><span className="growth-icon"><Target size={19} /></span><div><h2>What would you like to change?</h2><p>Choose one area to focus your strategy.</p></div></div>
        <form className="stack-form" onSubmit={submit}>
          <div className="goal-options" role="radiogroup" aria-label="Growth goal">
            {growthGoals.map((item) => <label key={item} className={`goal-option ${goal === item ? 'goal-selected' : ''}`}><input type="radio" name="goal" value={item} checked={goal === item} onChange={() => setGoal(item)} /><span className="goal-check" />{item}</label>)}
            <label className={`goal-option ${goal === 'Something else' ? 'goal-selected' : ''}`}><input type="radio" name="goal" value="Something else" checked={goal === 'Something else'} onChange={() => setGoal('Something else')} /><span className="goal-check" />Something else</label>
          </div>
          {goal === 'Something else' && <TextareaField label="Describe your goal" name="customGoal" rows={3} maxLength={500} required value={customGoal} onChange={(event) => setCustomGoal(event.target.value)} placeholder="What would you like to improve?" />}
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={loading || effectiveGoal.trim().length < 3} icon={<ArrowRight size={16} />}>{loading ? 'Preparing your strategy…' : 'Generate strategy'}</Button>
        </form>
      </Panel>
      <aside className="growth-context"><p className="eyebrow">A GROUNDED APPROACH</p><h2>Useful starts with what’s true.</h2><p>KEETY combines your business profile and measured analytics. Recommendations are possibilities to review, not guaranteed outcomes.</p><div className="growth-context-line"><BookOpenCheck size={16} /><span>Based on available sales, product, and inventory metrics</span></div></aside>
    </div>
    {result && <Panel className="growth-result"><div className="growth-result-heading"><span className="answer-avatar"><Sparkles size={17} /></span><div><p className="eyebrow">KEETY’S RESPONSE</p><h2>{effectiveGoal}</h2></div></div><div className="answer-body">{result.answer}</div><Notice tone="info">This response is not saved as a report. Report creation is not available in the current backend API.</Notice></Panel>}
  </div>
}