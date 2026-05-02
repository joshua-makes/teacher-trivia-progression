import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
