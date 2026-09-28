import { ArrowRight, CircleSlash, Users, WalletCards, Boxes, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../components/ui'

const content = {
  customers: { title: 'Customers', description: 'Understand the people behind your business.', icon: Users, next: 'Customer records and customer management routes are not available in the current backend API.', link: '/app/sales', linkLabel: 'Review sales' },
  expenses: { title: 'Expenses', description: 'Keep business costs in view.', icon: WalletCards, next: 'Expense records and expense management routes are not available in the current backend API.', link: '/app/analytics', linkLabel: 'View analytics' },
  inventory: { title: 'Inventory', description: 'Know what is on hand and what needs attention.', icon: Boxes, next: 'Inventory read and update routes are not available in the current backend API. Product quantities are not simulated here.', link: '/app/products', linkLabel: 'Manage products' },
  reports: { title: 'Reports', description: 'A clear record of your business decisions.', icon: FileText, next: 'Report history and report creation routes are not available in the current backend API.', link: '/app/analytics', linkLabel: 'View analytics' },
}

export function UnavailablePage({ section }: { section: keyof typeof content }) {
  const item = content[section]
  const Icon = item.icon
  return <div className="page-content">
    <PageHeader eyebrow="BUSINESS WORKSPACE" title={item.title} description={item.description} />
    <Panel className="unavailable-panel">
      <span className="unavailable-icon"><Icon size={21} /></span>
      <p className="eyebrow">API CONNECTION NOT AVAILABLE</p>
      <h2>This section is waiting on its backend route.</h2>
      <p>{item.next}</p>
      <Link className="button button-secondary" to={item.link}>{item.linkLabel} <ArrowRight size={16} /></Link>
      <span className="unavailable-footnote"><CircleSlash size={14} /> No sample data is shown in this section.</span>
    </Panel>
  </div>
}