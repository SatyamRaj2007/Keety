import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('KEETY UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return <main className="not-found" role="alert">
        <p className="eyebrow">A pause in the workspace</p>
        <h1>Something went wrong.</h1>
        <p className="page-description">Your business data is safe. Refresh KEETY to try again.</p>
        <Button onClick={() => window.location.reload()} icon={<RefreshCw size={16} />}>Refresh KEETY</Button>
      </main>
    }

    return this.props.children
  }
}