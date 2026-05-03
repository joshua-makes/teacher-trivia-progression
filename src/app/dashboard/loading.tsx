import { Container } from '@/components/layout/Container'

export default function DashboardLoading() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Header */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8" />

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>

        {/* Table header */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />

        {/* Table rows */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    </Container>
  )
}
