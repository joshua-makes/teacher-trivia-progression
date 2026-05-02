'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error)
    return { hasError: true, errorMessage: msg }
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Surface to console for debugging; do not re-throw
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              The game encountered an unexpected error. This can happen if saved data becomes corrupted.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs font-mono text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-3 text-left break-words">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <button
                onClick={() => {
                  // Clear potentially corrupted session data and go home
                  try { localStorage.removeItem('trivia_session') } catch { /* ignore */ }
                  window.location.href = '/'
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
              >
                🏠 Go Home
              </button>
              <button
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-5 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
