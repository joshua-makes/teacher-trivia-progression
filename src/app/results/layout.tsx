import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
