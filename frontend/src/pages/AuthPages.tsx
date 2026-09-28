import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { ApiError } from '../api/client'
import { Button, Field, Notice } from '../components/ui'

function AuthFrame({ children, mode }: { children: React.ReactNode; mode: 'login' | 'register' }) {
  return <main className="auth-page">
    <section className="auth-story">
      <Link className="brand-link" to="/"><span className="brand-mark brand-mark-large"><LockKeyhole size={18} /></span><span className="brand-name">keety</span></Link>
      <div className="auth-story-copy">
        <p className="eyebrow">A calmer command center</p>
        <h1>Make the next<br /><em>move make sense.</em></h1>
        <p>Your business data, understood in context. Practical clarity for the decisions in front of you.</p>
      </div>
      <div className="auth-story-footer"><span>KEETY · BUSINESS INTELLIGENCE</span><span>01 / 03</span></div>
    </section>
    <section className="auth-form-side">
      <Link className="auth-back" to="/"><ArrowLeft size={16} /> Back to KEETY</Link>
      <div className="auth-form-wrap">
        <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Your workspace starts here'}</p>
        <h2>{mode === 'login' ? 'Sign in to KEETY' : 'Create your account'}</h2>
        <p className="auth-form-intro">{mode === 'login' ? 'Pick up where your business left off.' : 'A few details, then we’ll set up your business together.'}</p>
        {children}
        <p className="auth-switch">
          {mode === 'login' ? 'New to KEETY?' : 'Already have an account?'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link>
        </p>
      </div>
    </section>
  </main>
}

export function LoginPage() {
  const { user, businesses, checkingSession, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (checkingSession) return <main className="session-loading" />
  if (user) return <Navigate to={businesses.length ? '/app/dashboard' : '/onboarding'} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/app/dashboard', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthFrame mode="login">
    <form className="auth-form" onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Email address" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="password-field">
        <Field label="Password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div>
      <Button type="submit" className="auth-submit" disabled={submitting} icon={submitting ? undefined : <ArrowRight size={17} />}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  </AuthFrame>
}

export function RegisterPage() {
  const { user, businesses, checkingSession, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (checkingSession) return <main className="session-loading" />
  if (user) return <Navigate to={businesses.length ? '/app/dashboard' : '/onboarding'} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signUp(name.trim(), email.trim(), password)
      navigate('/onboarding', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Account creation failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthFrame mode="register">
    <form className="auth-form" onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Your name" name="name" type="text" autoComplete="name" minLength={1} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
      <Field label="Email address" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="password-field">
        <Field label="Password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} hint="Use at least 8 characters." required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div>
      <Button type="submit" className="auth-submit" disabled={submitting} icon={submitting ? undefined : <ArrowRight size={17} />}>{submitting ? 'Creating account…' : 'Create account'}</Button>
    </form>
  </AuthFrame>
}