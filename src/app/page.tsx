import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

const FEATURES = [
  {
    emoji: '🪜',
    title: 'Ladder-style difficulty',
    desc: 'Questions get harder as the class climbs. Easy, medium, and hard rungs keep every student engaged.',
  },
  {
    emoji: '🏆',
    title: 'Solo & team modes',
    desc: 'Whole-class climbs together in Classroom mode, or split into teams for buzz-in competition.',
  },
  {
    emoji: '✏️',
    title: 'Custom question sets',
    desc: 'Build your own question banks for any subject and grade. Cloud-synced when you sign in.',
  },
  {
    emoji: '📊',
    title: 'Game history & stats',
    desc: 'Track accuracy, category strengths, and progress over time in your teacher dashboard.',
  },
]

export default function LandingPage() {
  return (
    <Container>
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="rounded-3xl bg-gray-900 border border-gray-800 text-center py-16 px-8 mt-6 mb-10 shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl" />
          </div>
          <div className="relative">
            <Image
              src="/ladderquiz-logo.png"
              alt="Ladder Quiz"
              width={200}
              height={200}
              className="mx-auto mb-5 drop-shadow-2xl"
              priority
            />
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Ladder Quiz</h1>
            <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed mb-8">
              Classroom trivia for K&ndash;12. Questions that climb in difficulty &mdash; solo or team mode.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="lg" className="px-10">
                <Link href="/play" className="flex items-center gap-2">
                  Start a Game
                </Link>
              </Button>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white font-semibold text-base transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </Container>
  )
}