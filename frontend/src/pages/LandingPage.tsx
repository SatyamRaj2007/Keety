import { ArrowRight, BarChart3, Check, Package, Sparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function BrandMark() {
  return <span className="brand-mark brand-mark-large"><BarChart3 size={20} strokeWidth={2.4} /></span>
}

export function LandingPage() {
  const { user, businesses, checkingSession } = useAuth()
  if (checkingSession) return <main className="landing-loading" aria-label="Loading KEETY" />
  if (user) return <Navigate to={businesses.length ? '/app/dashboard' : '/onboarding'} replace />

  return <main className="landing-page">
    <header className="landing-nav">
      <Link className="brand-link" to="/" aria-label="KEETY home"><BrandMark /><span className="brand-name">keety</span></Link>
      <nav aria-label="Account navigation">
        <Link className="landing-login" to="/login">Sign in</Link>
        <Link className="button button-primary button-small" to="/register">Get started <ArrowRight size={15} /></Link>
      </nav>
    </header>
    <section className="landing-hero">
      <div className="landing-copy">
        <p className="eyebrow"><span className="eyebrow-mark" /> A clearer way to run your business</p>
        <h1>Understand your business.<br /><em>Know what to do next.</em></h1>
        <p className="landing-lede">KEETY brings your sales and products into focus, then helps you turn what’s happening into a practical next step.</p>
        <div className="landing-actions">
          <Link className="button button-primary" to="/register">Create your workspace <ArrowRight size={17} /></Link>
          <span>No card required · Start with your own data</span>
        </div>
        <div className="landing-proof"><span><Check size={14} /> Built around your business</span><span><Check size={14} /> Private and owner-controlled</span></div>
      </div>
      <div className="landing-visual" aria-label="KEETY workflow illustration">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="visual-core"><BrandMark /><span>Business<br />signals</span></div>
        <div className="visual-node node-sales"><span className="visual-node-icon"><BarChart3 size={18} /></span><span><strong>Sales</strong><small>What’s moving</small></span></div>
        <div className="visual-node node-products"><span className="visual-node-icon"><Package size={18} /></span><span><strong>Products</strong><small>What’s performing</small></span></div>
        <div className="visual-node node-insight"><span className="visual-node-icon"><Sparkles size={18} /></span><span><strong>KEETY insight</strong><small>What to do next</small></span></div>
        <div className="visual-note">Your business, in context <ArrowRight size={15} /></div>
      </div>
    </section>
    <section className="landing-lower" aria-label="How KEETY helps">
      <p>Less time finding the signal.<br /><strong>More time acting on it.</strong></p>
      <div className="landing-lower-items"><span>01 <b>Bring your data together</b></span><span>02 <b>See what matters</b></span><span>03 <b>Choose your next move</b></span></div>
    </section>
  </main>
}