'use client'

import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { CategoryGrid } from '@/components/quiz/CategoryGrid'
import { clearSession, createSession, saveSession } from '@/lib/session'

export default function HomePage() {
  const router = useRouter()

  function handleSelectCategory(categoryId: number) {
    clearSession()
    const session = createSession(categoryId, 'easy')
    saveSession(session)
    router.push('/quiz')
  }

  return (
    <Container>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          🎓 Teacher Trivia Progression
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
          Test your knowledge across 8 categories. Start easy, advance to harder difficulties as you improve!
        </p>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Choose a Category</h2>
      <CategoryGrid onSelect={handleSelectCategory} />
    </Container>
  )
}
