import { Container } from '@/components/layout/Container'

export default function QuestionsLoading() {
  return (
    <Container>
      <div className="max-w-3xl mx-auto animate-pulse">
        {/* Header */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-56 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mb-6" />

        {/* Action bar */}
        <div className="flex gap-2 mb-6">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-36" />
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-28" />
        </div>

        {/* Set cards */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    </Container>
  )
}
