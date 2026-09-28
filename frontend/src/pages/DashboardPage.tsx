import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Box, CircleAlert, Package, Plus, ReceiptText, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../api/analytics.api'
import { ApiError } from '../api/client'
import { productsApi } from '../api/products.api'
import { Currency, EmptyState, LoadingBlock, PageHeader, Panel, SectionHeading, StatusBadge } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { Analytics, Product } from '../types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
}

export function DashboardPage() {
  const { activeBusiness, user } = useAuth()
  const [result, setResult] = useState<{
    businessId: string
    status: 'success' | 'error'
    analytics?: Analytics
    products?: Product[]
    error?: string
  } | null>(null)
  const requestIsCurrent = result?.businessId === activeBusiness?._id
  const loading = !requestIsCurrent
  const analytics = requestIsCurrent && result?.status === 'success' ? result.analytics || null : null
  const products = requestIsCurrent && result?.status === 'success' ? result.products || [] : []
  const error = requestIsCurrent && result?.status === 'error' ? result.error || '' : ''

  useEffect(() => {
    let active = true
    const businessId = activeBusiness?._id
    if (!businessId) return () => { active = false }
    Promise.all([analyticsApi.get('monthly'), productsApi.list({ limit: 5 })])
      .then(([metrics, productResult]) => {
        if (!active) return
        setResult({ businessId, status: 'success', analytics: metrics, products: productResult.products })
      })
      .catch((cause) => {
        if (active) setResult({ businessId, status: 'error', error: cause instanceof ApiError ? cause.message : 'We could not load your business overview.' })
      })
    return () => { active = false }
  }, [activeBusiness?._id])

  const firstName = user?.name.split(' ')[0] || 'there'
  const noSales = analytics?.salesCount === 0
  const maxProductRevenue = Math.max(...(analytics?.topProducts.map((product) => product.revenue) || [0]), 1)

  return <div className="page-content dashboard-page">
    <PageHeader eyebrow={activeBusiness?.businessType.replaceAll('_', ' ')} title={`Good to see you, ${firstName}.`} description="Here’s your business, as it stands this month." action={<Link to="/app/sales" className="button button-primary"><Plus size={17} /> Record a sale</Link>} />
    {error && <div className="page-error"><CircleAlert size={18} /><div><strong>We couldn’t load your overview.</strong><p>{error}</p><button className="text-button" onClick={() => window.location.reload()}>Try again <ArrowRight size={15} /></button></div></div>}
    {loading ? <div className="dashboard-loading"><LoadingBlock rows={5} /></div> : analytics && <>
      {noSales && <div className="dashboard-empty-callout">
        <div className="empty-callout-copy"><span className="callout-kicker">YOUR FIRST BUSINESS BRIEFING</span><h2>Your business data is ready.</h2><p>Add a product or record your first sale to start seeing what’s happening.</p></div>
        <div className="empty-callout-actions"><Link className="button button-primary" to="/app/products"><Package size={16} /> Add a product</Link><Link className="button button-secondary" to="/app/sales"><ReceiptText size={16} /> Record sale</Link></div>
      </div>}
      <div className="metric-grid">
        <Panel className="metric-panel metric-primary"><div className="metric-heading"><span>Revenue</span><span className="metric-icon"><span className="currency-glyph">{activeBusiness?.currency === 'INR' ? '₹' : activeBusiness?.currency?.slice(0, 1)}</span></span></div><strong className="metric-value"><Currency amount={analytics.revenue} code={activeBusiness?.currency} compact /></strong><div className="metric-foot"><span className={analytics.growthPercent >= 0 ? 'metric-change-positive' : 'metric-change-negative'}>{analytics.growthPercent >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{Math.abs(analytics.growthPercent)}%</span><span>vs previous month</span></div></Panel>
        <Panel className="metric-panel"><div className="metric-heading"><span>Sales completed</span><span className="metric-icon metric-icon-mint"><ReceiptText size={17} /></span></div><strong className="metric-value">{analytics.salesCount.toLocaleString()}</strong><div className="metric-foot"><span className="metric-context">This month</span></div></Panel>
        <Panel className="metric-panel"><div className="metric-heading"><span>Average order value</span><span className="metric-icon metric-icon-peach"><ArrowUpRight size={17} /></span></div><strong className="metric-value"><Currency amount={analytics.averageOrderValue} code={activeBusiness?.currency} compact /></strong><div className="metric-foot"><span className="metric-context">Across completed sales</span></div></Panel>
        <Panel className="metric-panel"><div className="metric-heading"><span>Needs attention</span><span className="metric-icon metric-icon-alert"><CircleAlert size={17} /></span></div><strong className="metric-value">{analytics.lowStockProducts.length}</strong><div className="metric-foot"><span className="metric-context">Products at reorder level</span></div></Panel>
      </div>
      <div className="dashboard-content-grid">
        <Panel className="product-performance-panel">
          <SectionHeading title="Product performance" detail="Top products by revenue this month" action={<Link to="/app/products" className="subtle-link">View products <ArrowRight size={14} /></Link>} />
          {analytics.topProducts.length ? <div className="performance-list">{analytics.topProducts.slice(0, 5).map((product, index) => <div className="performance-row" key={product._id}>
            <span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><div className="performance-main"><div className="performance-copy"><strong>{product.name}</strong><span>{product.quantitySold} sold</span></div><div className="performance-bar-track"><span style={{ width: `${Math.max((product.revenue / maxProductRevenue) * 100, 3)}%` }} /></div></div><strong className="performance-revenue"><Currency amount={product.revenue} code={activeBusiness?.currency} compact /></strong>
          </div>)}</div> : <EmptyState icon={<Package size={21} />} title="No product sales yet" detail="Once a sale is recorded, your strongest products will appear here." />}
        </Panel>
        <Panel className="attention-panel">
          <SectionHeading title="Stock to review" detail="At or below reorder level" action={<Link to="/app/inventory" className="subtle-link">Inventory <ArrowRight size={14} /></Link>} />
          {analytics.lowStockProducts.length ? <div className="stock-list">{analytics.lowStockProducts.slice(0, 4).map((item) => <div className="stock-row" key={item.productId}>
            <span className="stock-symbol"><Package size={17} /></span><span className="stock-name"><strong>{item.name}</strong><small>Reorder at {item.reorderLevel}</small></span><StatusBadge tone={item.quantity === 0 ? 'danger' : 'warning'}>{item.quantity} left</StatusBadge>
          </div>)}</div> : <EmptyState icon={<Box size={20} />} title="Nothing needs attention" detail="Low-stock items will appear here when inventory is connected." />}
        </Panel>
      </div>
      <Panel className="briefing-panel">
        <span className="briefing-symbol"><Sparkles size={18} /></span>
        <div className="briefing-copy"><p className="eyebrow">A VERIFIED BUSINESS SIGNAL</p>
          <h2>{analytics.salesCount ? analytics.growthPercent >= 0 ? `Revenue is ${analytics.growthPercent}% higher than last month.` : `Revenue is ${Math.abs(analytics.growthPercent)}% lower than last month.` : 'Your first business signal is one sale away.'}</h2>
          <p>{analytics.salesCount ? `Measured across completed sales from ${formatDate(analytics.period.startDate)} to ${formatDate(analytics.period.endDate)}.` : 'Record a sale when you’re ready. KEETY will use confirmed business data for your briefing.'}</p>
        </div>
        <Link to="/app/ask-keety" className="briefing-action">Ask KEETY <ArrowRight size={15} /></Link>
      </Panel>
      {products.length > 0 && <div className="dashboard-bottom-note"><span><Package size={16} /> {products.length} products in your catalog</span><Link to="/app/products">Manage catalog <ArrowRight size={14} /></Link></div>}
    </>}
  </div>
}