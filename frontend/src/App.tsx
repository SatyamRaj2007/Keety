import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './contexts/useAuth'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { SalesPage } from './pages/SalesPage'
import { CustomersPage } from './pages/CustomersPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AskPage, GrowthPage, ProductAnalysisPage, BusinessSummaryPage, AIHistoryPage, KnowledgeBasePage } from './pages/AiPages'
import { SettingsPage } from './pages/SettingsPage'
import { UnavailablePage } from './pages/UnavailablePage'
import { LoadingBlock } from './components/ui'

function ProtectedRoute() {
  const { user, checkingSession } = useAuth()
  if (checkingSession) return <div className="session-loading"><LoadingBlock rows={4} /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function BusinessRoute() {
  const { businesses, activeBusiness, checkingSession } = useAuth()
  if (checkingSession) return <div className="session-loading"><LoadingBlock rows={4} /></div>
  if (!businesses.length || !activeBusiness) return <Navigate to="/onboarding" replace />
  return <AppShell />
}

function OnboardingRoute() {
  const { businesses, checkingSession } = useAuth()
  if (checkingSession) return <div className="session-loading"><LoadingBlock rows={4} /></div>
  if (!businesses.length) return <OnboardingPage />
  return <Navigate to="/app/dashboard" replace />
}

function NotFoundPage() {
  return <main className="not-found"><p className="eyebrow">404 · Not here</p><h1>That page wandered off.</h1><a href="/">Back to KEETY</a></main>
}

function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/app" element={<BusinessRoute />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="expenses" element={<UnavailablePage section="expenses" />} />
        <Route path="inventory" element={<UnavailablePage section="inventory" />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="ask-keety"        element={<AskPage />} />
        <Route path="growth"           element={<GrowthPage />} />
        <Route path="product-analysis" element={<ProductAnalysisPage />} />
        <Route path="summary"          element={<BusinessSummaryPage />} />
        <Route path="ai-history"       element={<AIHistoryPage />} />
        <Route path="knowledge-base"   element={<KnowledgeBasePage />} />
        <Route path="reports"          element={<UnavailablePage section="reports" />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}

export default App
