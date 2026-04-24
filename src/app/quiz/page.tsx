'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { loadSession, saveSession } from '@/lib/session'
import { fetchQuestions, decodeHtmlEntities } from '@/lib/opentdb'
import { QUESTIONS } from '@/lib/data/questions'
import { CATEGORIES } from '@/lib/data/categories'
import { shuffleArray } from '@/lib/shuffle'
import { nextDifficulty } from '@/lib/progression'
import type { Difficulty } from '@/lib/data/questions'
import type { Answer } from '@/lib/scoring'

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

type QuizQuestion = {
  id: string
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: Difficulty
  category: number
  categoryName: string
}

type QuizState = 'loading' | 'playing' | 'round-complete' | 'error'

export default function QuizPage() {
  const router = useRouter()
  const [state, setState] = useState<QuizState>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [categoryId, setCategoryId] = useState<number>(9)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [allAnswers, setAllAnswers] = useState<Answer[]>([])

  const loadQuestions = useCallback(async (catId: number, diff: Difficulty) => {
    setState('loading')
    const category = CATEGORIES.find(c => c.id === catId)
    const categoryName = category?.name ?? 'General Knowledge'

    const apiResults = await fetchQuestions(catId, diff, 10)

    if (apiResults && apiResults.length > 0) {
      const mapped: QuizQuestion[] = apiResults.map((q, i) => ({
        id: `api-${i}`,
        question: decodeHtmlEntities(q.question),
        answers: shuffleArray([
          decodeHtmlEntities(q.correct_answer),
          ...q.incorrect_answers.map(decodeHtmlEntities),
        ]),
        correctAnswer: decodeHtmlEntities(q.correct_answer),
        difficulty: diff,
        category: catId,
        categoryName,
      }))
      setQuestions(mapped)
    } else {
      const local = QUESTIONS.filter(q => q.category === catId && q.difficulty === diff)
      const pool = local.length >= 10 ? local : QUESTIONS.filter(q => q.difficulty === diff)
      const selected = shuffleArray(pool).slice(0, 10)
      const mapped: QuizQuestion[] = selected.map(q => ({
        id: q.id,
        question: q.question,
        answers: shuffleArray([q.correct, ...q.incorrect]),
        correctAnswer: q.correct,
        difficulty: diff,
        category: q.category,
        categoryName: CATEGORIES.find(c => c.id === q.category)?.name ?? categoryName,
      }))
      setQuestions(mapped)
    }
    setCurrentIndex(0)
    setAnswers([])
    setState('playing')
  }, [])

  useEffect(() => {
    const session = loadSession()
    if (!session) {
      router.push('/')
      return
    }
    setCategoryId(session.categoryId)
    setDifficulty(session.difficulty)
    setAllAnswers(session.answers)
    loadQuestions(session.categoryId, session.difficulty)
  }, [router, loadQuestions])

  const handleAnswer = useCallback(
    (correct: boolean, timeMs: number) => {
      if (questions.length === 0) return
      const q = questions[currentIndex]
      const answer: Answer = {
        questionId: q.id,
        category: q.category,
        difficulty: q.difficulty,
        correct,
        timeMs,
      }
      const newAnswers = [...answers, answer]
      setAnswers(newAnswers)

      const session = loadSession()
      if (session) {
        session.answers = [...allAnswers, ...newAnswers]
        session.currentQuestionIndex = currentIndex + 1
        saveSession(session)
      }

      if (currentIndex + 1 >= questions.length) {
        setState('round-complete')
        const newAllAnswers = [...allAnswers, ...newAnswers]
        setAllAnswers(newAllAnswers)
        const session2 = loadSession()
        if (session2) {
          session2.answers = newAllAnswers
          session2.completed = true
          saveSession(session2)
        }
      } else {
        setCurrentIndex(i => i + 1)
      }
    },
    [questions, currentIndex, answers, allAnswers]
  )

  const handleContinue = () => {
    const correctCount = answers.filter(a => a.correct).length
    const next = nextDifficulty(difficulty, correctCount, questions.length)
    setDifficulty(next)
    const session = loadSession()
    if (session) {
      session.difficulty = next
      session.completed = false
      saveSession(session)
    }
    loadQuestions(categoryId, next)
  }

  const handleViewResults = () => {
    router.push('/results')
  }

  if (state === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (state === 'error') {
    return (
      <Container>
        <Card className="p-6 text-center">
          <p className="text-red-500 mb-4">Failed to load questions.</p>
          <Button onClick={() => router.push('/')}>Back to Categories</Button>
        </Card>
      </Container>
    )
  }

  if (state === 'round-complete') {
    const correctCount = answers.filter(a => a.correct).length
    const accuracy = Math.round((correctCount / questions.length) * 100)
    const next = nextDifficulty(difficulty, correctCount, questions.length)
    const nextIndex = DIFFICULTY_ORDER.indexOf(next)
    const currentDiffIndex = DIFFICULTY_ORDER.indexOf(difficulty)
    const diffChanged = next !== difficulty

    return (
      <Container>
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="text-5xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 40 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Round Complete!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {correctCount}/{questions.length} correct ({accuracy}%)
            </p>
            {diffChanged && (
              <p className="text-sm font-medium mb-4 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {nextIndex > currentDiffIndex
                  ? `⬆️ Moving up to ${next} difficulty!`
                  : `⬇️ Dropping to ${next} difficulty.`}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleContinue} variant="primary">
                Continue ({next})
              </Button>
              <Button onClick={handleViewResults} variant="secondary">
                View Results
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    )
  }

  const currentQuestion = questions[currentIndex]
  if (!currentQuestion) return null

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <QuestionCard
          data={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      </div>
    </Container>
  )
}
