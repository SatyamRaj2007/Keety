import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, CircleAlert, Package, Users, WalletCards } from 'lucide-react'
import { analyticsApi, type AnalyticsPeriod } from '../api/analytics.api'
import { ApiError } from '../api/client'
import { Currency, EmptyState, LoadingBlock, Notice, PageHeader, Panel, SelectField, SectionHeading, StatusBadge } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import type { Analytics } from '../types'

const periodLabels: Record<AnalyticsPeriod, string> = { daily: 'Today', weekly: 'This week', monthly: 'This month' }

export function AnalyticsPage() {
  const { activeBusiness } = useAuth()
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly')
  const [result, setResult] = useState<{ key: string; status: 'success' | 'error'; analytics?: Analytics; error?: string } | null>(null)
  const key = `${activeBusiness?._id || ''}:${period}`
  const requestIsCurrent = result?.key === key
  const loading = !requestIsCurrent
  const analytics = requestIsCurrent && result?.status === 'success' ? result.analytics || null : null
  const error = requestIsCurrent && result?.status === 'error' ? result.error || '' : ''

  useEffect(() => {
    let active = true
    if (!activeBusiness?._id) return () => { active = false }
    analyticsApi.get(period)
      .then((analyticsResult) => { if (active) setResult({ key, status: 'success', analytics: analyticsResult }) })
      .catch((cause) => { if (active) setResult({ key, status: 'error', error: cause instanceof ApiError ? cause.message : 'We could not load analytics.' }) })
    return () => { active = false }
  }, [activeBusiness?._id, key, period])

  const topRevenue = Math.max(...(analytics?.topProducts.map((product) => product.revenue) || [0]), 1)

  return <div className="page-content">
    <PageHeader eyebrow="BUSINESS PERFORMANCE" title="Analytics" description="A grounded view of what your business has measured." action={<SelectField label="Reporting period" name="reportingPeriod" className="period-select" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}><option value="daily">Today</option><option value="weekly">This week</option><option value="monthly">This month</option></SelectField>} />
    {error && <Notice tone="error">{error}</Notice>}
    {loading ? <div className="analytics-loading"><LoadingBlock rows={5} /></div> : analytics && <>
      <div className="analytics-period-line"><span className="period-indicator" />{periodLabels[period]}<span>·</span><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(analytics.period.startDate))} – {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(analytics.period.endDate))}</time></div>
      <div className="analytics-metric-grid">
        <Panel className="analytics-metric"><span>Revenue</span><strong><Currency amount={analytics.revenue} code={activeBusiness?.currency} compact /></strong><small className={analytics.growthPercent >= 0 ? 'metric-change-positive' : 'metric-change-negative'}>{analytics.growthPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(analytics.growthPercent)}% vs previous period</small></Panel>
        <Panel className="analytics-metric"><span>Completed sales</span><strong>{analytics.salesCount.toLocaleString()}</strong><small>Completed transactions</small></Panel>
        <Panel className="analytics-metric"><span>Average order value</span><strong><Currency amount={analytics.averageOrderValue} code={activeBusiness?.currency} compact /></strong><small>Revenue divided by completed sales</small></Panel>
      </div>
      <div className="analytics-grid">
        <Panel>
          <SectionHeading title="Products by revenue" detail={`${periodLabels[period]} · completed sales`} />
          {analytics.topProducts.length ? <div className="analytics-products">{analytics.topProducts.map((product, index) => <div key={product._id} className="analytics-product-row">
            <div className="analytics-product-heading"><span className="analytics-product-rank">{String(index + 1).padStart(2, '0')}</span><strong>{product.name}</strong><span>{product.quantitySold} sold</span><b><Currency amount={product.revenue} code={activeBusiness?.currency} compact /></b></div>
            <div className="analytics-bar"><span style={{ width: `${Math.max((product.revenue / topRevenue) * 100, 3)}%` }} /></div>
          </div>)}</div> : <EmptyState icon={<BarChart3 size={20} />} title="No product performance to show" detail="Completed sales with product details will appear here." />}
        </Panel>
        <Panel>
          <SectionHeading title="Inventory to review" detail="Products at or below reorder level" />
          {analytics.lowStockProducts.length ? <div className="stock-list">{analytics.lowStockProducts.map((item) => <div className="stock-row" key={item.productId}><span className="stock-symbol"><Package size={17} /></span><span className="stock-name"><strong>{item.name}</strong><small>Reorder level {item.reorderLevel}</small></span><StatusBadge tone={item.quantity === 0 ? 'danger' : 'warning'}>{item.quantity} left</StatusBadge></div>)}</div> : <EmptyState icon={<Package size={20} />} title="No low-stock items" detail="Inventory data will appear when it is available for this business." />}
        </Panel>
        <Panel>
          <SectionHeading title="Customer activity" detail="New customer records in period" />
          <div className="analytics-summary"><span className="summary-icon summary-icon-mint"><Users size={18} /></span><div><strong>{analytics.customerSummary.newCustomers}</strong><small>new customers</small></div><span className={analytics.customerSummary.growthPercent >= 0 ? 'summary-change-positive' : 'summary-change-negative'}>{analytics.customerSummary.growthPercent >= 0 ? '+' : ''}{analytics.customerSummary.growthPercent}%</span></div>
          <p className="summary-footnote">Customer creation is included in backend analytics. Customer management routes are not yet available.</p>
        </Panel>
        <Panel>
          <SectionHeading title="Expense overview" detail="Recorded expense totals in period" />
          <div className="analytics-summary"><span className="summary-icon summary-icon-peach"><WalletCards size={18} /></span><div><strong><Currency amount={analytics.expenseSummary.total} code={activeBusiness?.currency} compact /></strong><small>total expenses</small></div></div>
          {Object.keys(analytics.expenseSummary.byCategory).length ? <div className="expense-category-list">{Object.entries(analytics.expenseSummary.byCategory).map(([category, amount]) => <div key={category}><span>{category.toLowerCase().replaceAll('_', ' ')}</span><strong><Currency amount={amount} code={activeBusiness?.currency} compact /></strong></div>)}</div> : <p className="summary-footnote">No expense records were returned for this period.</p>}
        </Panel>
      </div>
      <div className="analytics-data-note"><CircleAlert size={16} /><p>This API provides period summaries and product rankings, but no daily time-series. Trends are shown only where the backend returns measured values.</p></div>
    </>}
  </div>
}