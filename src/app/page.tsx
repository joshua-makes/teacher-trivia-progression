import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Container } from '@/components/layout/Container'

const FEATURES = [
  {
    emoji: '🪜',
    color: 'bg-teal-100 dark:bg-teal-900/50',
    title: 'Ladder-style difficulty',
    desc: 'Questions automatically scale from easy to hard as the class climbs. Safe zones reward streaks and keep every student in the game.',
  },
  {
    emoji: '🏆',
    color: 'bg-amber-100 dark:bg-amber-900/50',
    title: 'Solo & team modes',
    desc: 'Run a solo class climb or split into coloured teams with buzz-in competition — switch modes in seconds.',
  },
  {
    emoji: '✏️',
    color: 'bg-purple-100 dark:bg-purple-900/50',
    title: 'Custom question sets',
    desc: 'Build question banks for any subject and grade. Import from JSON or generate a prompt for ChatGPT in one click.',
  },
  {
    emoji: '📊',
    color: 'bg-blue-100 dark:bg-blue-900/50',
    title: 'Teacher dashboard',
    desc: 'Track accuracy, category strengths, and session history over time. Export any game as CSV or JSON.',
  },
]

const STEPS = [
  { n: '1', title: 'Choose your settings', desc: 'Pick a category, grade level, question count, and solo or team mode.' },
  { n: '2', title: 'Play live with your class', desc: 'Questions get harder each rung. Teams buzz in; safe zones protect earned points.' },
  { n: '3', title: 'Review the results', desc: 'See accuracy, a full question recap, and save the session to your dashboard.' },
]

const GRADES = ['K–2', '3–5', '6–8', '9–12']

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Container>
      <div>

        {/* Hero */}
        <div className="rounded-3xl bg-gray-900 border border-gray-800 text-center py-16 px-8 mt-6 mb-10 shadow-xl relative overflow-hidden">
          {/* glow orbs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-600/10 blur-2xl" />
          </div>

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-5 tracking-wide">
              <span>✦</span> Free for K–12 teachers
            </div>

            <Image
              src="/ladderquiz-logo.png"
              alt="Ladder Quiz"
              width={180}
              height={180}
              className="mx-auto mb-5 drop-shadow-2xl"
              priority
            />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              The quiz game your{' '}
              <span className="bg-gradient-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent">
                class will love
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed mb-8">
              Ladder-style trivia for K–12. Questions climb in difficulty — play solo or split into teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-base transition-all shadow-lg shadow-teal-500/30 active:scale-95"
              >
                Start a Game →
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white font-semibold text-base transition-all"
                >
                  My Dashboard
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white font-semibold text-base transition-all"
                >
                  Sign in free
                </Link>
              )}
            </div>

            {/* Stat strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><span className="text-teal-400 font-bold">15</span> difficulty levels</span>
              <span className="text-gray-700 hidden sm:block">·</span>
              <span className="flex items-center gap-1.5"><span className="text-teal-400 font-bold">4</span> grade ranges</span>
              <span className="text-gray-700 hidden sm:block">·</span>
              <span className="flex items-center gap-1.5"><span className="text-teal-400 font-bold">∞</span> custom question sets</span>
            </div>
          </div>
        </div>

        {/* Grade chips */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Works for</span>
          {GRADES.map(g => (
            <span key={g} className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-600 dark:text-gray-400 shadow-sm">
              Grade {g}
            </span>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                {/* connector line between cards on desktop */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 -right-2.5 w-5 h-px bg-gray-200 dark:bg-gray-700 z-10" />
                )}
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {step.n}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm flex gap-4 items-start"
              >
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center text-2xl shrink-0`}>
                  {f.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl bg-gray-900 border border-gray-800 p-8 sm:p-10 text-center mb-16 shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-64 h-64 rounded-full bg-teal-500/15 blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-2xl font-extrabold text-white mb-2">Ready to play?</p>
            <p className="text-gray-400 text-sm mb-6">No account needed to start — sign in later to save your history.</p>
            <Link
              href="/play"
              className="inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-base transition-all shadow-lg shadow-teal-500/30 active:scale-95"
            >
              Start a Game →
            </Link>
          </div>
        </div>

      </div>
    </Container>
  )
}