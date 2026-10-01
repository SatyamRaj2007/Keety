import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity, ArrowUpRight, BarChart3, Boxes, BriefcaseBusiness, ChartNoAxesCombined,
  ChevronDown, CircleHelp, ClipboardList, Database, FileText, History, LayoutDashboard, Layers,
  LogOut, MoreHorizontal, Package, ReceiptText, Settings2, Sparkles, Users, X,
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

const primaryNavigation = [
  { path: '/app/dashboard', label: 'Overview', icon: LayoutDashboard, section: 'Workspace' },
  { path: '/app/products', label: 'Products', icon: Package, section: 'Manage' },
  { path: '/app/sales', label: 'Sales', icon: ReceiptText, section: 'Manage' },
  { path: '/app/customers', label: 'Customers', icon: Users, section: 'Manage' },
  { path: '/app/expenses', label: 'Expenses', icon: BriefcaseBusiness, section: 'Manage', unavailable: true },
  { path: '/app/inventory', label: 'Inventory', icon: Boxes, section: 'Manage', unavailable: true },
  { path: '/app/analytics',        label: 'Analytics',        icon: ChartNoAxesCombined, section: 'Insights' },
  { path: '/app/ask-keety',        label: 'Ask KEETY',        icon: Sparkles,     section: 'Insights' },
  { path: '/app/growth',           label: 'Growth plan',      icon: ArrowUpRight,  section: 'Insights' },
  { path: '/app/product-analysis', label: 'Product analysis', icon: Layers,        section: 'Insights' },
  { path: '/app/summary',          label: 'Business summary', icon: ClipboardList, section: 'Insights' },
  { path: '/app/ai-history',       label: 'AI history',       icon: History,       section: 'Insights' },
  { path: '/app/knowledge-base',   label: 'Knowledge base',   icon: Database,      section: 'Insights' },
  { path: '/app/reports',          label: 'Reports',          icon: FileText,      section: 'Insights', unavailable: true },
  { path: '/app/settings', label: 'Settings', icon: Settings2, section: 'Workspace' },
]

const pageNames: Record<string, string> = {
  '/app/dashboard': 'Overview', '/app/products': 'Products', '/app/sales': 'Sales',
  '/app/customers': 'Customers', '/app/expenses': 'Expenses', '/app/inventory': 'Inventory',
  '/app/analytics': 'Analytics', '/app/ask-keety': 'Ask KEETY', '/app/growth': 'Growth plan',
  '/app/product-analysis': 'Product analysis', '/app/summary': 'Business summary',
  '/app/ai-history': 'AI history', '/app/knowledge-base': 'Knowledge base',
  '/app/reports': 'Reports', '/app/settings': 'Settings',
}

function Brand() {
  return <div className="brand-lockup">
    <div className="brand-mark" aria-hidden="true"><Activity size={18} strokeWidth={2.5} /></div>
    <div><span className="brand-name">keety</span><span className="brand-caption">Business intelligence</span></div>
  </div>
}

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <nav className="sidebar-navigation" aria-label="Main navigation">
    {['Workspace', 'Manage', 'Insights'].map((section) => (
      <div className="nav-section" key={section}>
        <p className="nav-section-label">{section}</p>
        {primaryNavigation.filter((item) => item.section === section).map(({ path, label, icon: Icon, unavailable }) => (
          <NavLink key={path} to={path} end={path === '/app/dashboard'} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {unavailable && <span className="nav-pending" title="API not available yet">Soon</span>}
          </NavLink>
        ))}
      </div>
    ))}
  </nav>
}

export function AppShell() {
  const { user, businesses, activeBusiness, selectBusiness, signOut } = useAuth()
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const location = useLocation()
  const pageName = pageNames[location.pathname] || 'Workspace'

  return <div className="app-shell">
    <aside className="desktop-sidebar">
      <NavLink to="/app/dashboard" className="brand-link" aria-label="KEETY overview"><Brand /></NavLink>
      <NavigationLinks />
      <div className="sidebar-bottom">
        <div className="sidebar-help"><CircleHelp size={16} /><span>Here to help</span><span className="help-status" /></div>
        <button className="profile-menu" onClick={signOut} title="Sign out">
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'K'}</span>
          <span className="profile-copy"><strong>{user?.name || 'Business owner'}</strong><small>{user?.role || 'OWNER'}</small></span>
          <LogOut size={16} />
        </button>
      </div>
    </aside>

    <div className="workspace-column">
      <header className="topbar">
        <div className="mobile-brand"><Brand /></div>
        <div className="business-switcher-wrap">
          <BriefcaseBusiness size={16} aria-hidden="true" />
          <select
            className="business-switcher"
            aria-label="Active business"
            value={activeBusiness?._id || ''}
            onChange={(event) => selectBusiness(event.target.value)}
            disabled={businesses.length <= 1}
          >
            {businesses.map((business) => <option value={business._id} key={business._id}>{business.name}</option>)}
          </select>
          {businesses.length > 1 && <ChevronDown size={14} className="business-chevron" aria-hidden="true" />}
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-page-label">{pageName}</div>
        <button className="topbar-avatar" onClick={signOut} aria-label="Sign out" title={`Sign out, ${user?.name || ''}`}>
          {user?.name?.slice(0, 1).toUpperCase() || 'K'}
        </button>
      </header>

      <main className="workspace-main"><Outlet /></main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/app/dashboard" end aria-label="Overview"><LayoutDashboard size={19} /><span>Home</span></NavLink>
        <NavLink to="/app/analytics" aria-label="Analytics"><BarChart3 size={19} /><span>Analytics</span></NavLink>
        <NavLink to="/app/ask-keety" aria-label="Ask KEETY"><Sparkles size={19} /><span>Ask KEETY</span></NavLink>
        <NavLink to="/app/sales" aria-label="Sales"><ReceiptText size={19} /><span>Sales</span></NavLink>
        <button className={mobileMoreOpen ? 'mobile-nav-active' : ''} onClick={() => setMobileMoreOpen((open) => !open)} aria-expanded={mobileMoreOpen}>
          {mobileMoreOpen ? <X size={19} /> : <MoreHorizontal size={19} />}<span>More</span>
        </button>
      </nav>

      {mobileMoreOpen && <div className="mobile-more-sheet">
        <NavigationLinks onNavigate={() => setMobileMoreOpen(false)} />
        <button className="mobile-logout" onClick={signOut}><LogOut size={17} /> Sign out</button>
      </div>}
      <button className="mobile-sheet-scrim" aria-label="Close navigation" hidden={!mobileMoreOpen} onClick={() => setMobileMoreOpen(false)} />
    </div>
  </div>
}