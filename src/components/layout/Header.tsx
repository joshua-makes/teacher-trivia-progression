import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { MobileNav } from './MobileNav'
import { ActiveLink } from './ActiveLink'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

const PlayIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M3 2l9 5-9 5V2z"/>
  </svg>
)
const DashboardIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="0"    y="6" width="3.5" height="8"  rx="0.5"/>
    <rect x="5.25" y="3" width="3.5" height="11" rx="0.5"/>
    <rect x="10.5" y="0" width="3.5" height="14" rx="0.5"/>
  </svg>
)
const QuestionsIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12.5h10M9.5 2.5l2 2-7 7H2.5v-2l7-7z"/>
  </svg>
)
const TeacherIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="1" width="12" height="9" rx="1.5"/>
    <path d="M5 13h4M7 10v3"/>
  </svg>
)
const ExternalIcon = () => (
  <svg className="w-3 h-3 opacity-40 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2 10 10 2M5 2h5v5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? ''

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-950/90 shadow-sm dark:shadow-none">
      <div className="relative max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/ladderquiz-logo.png" alt="Ladder Quiz" width={40} height={40} className="rounded-lg" priority />
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Ladder Quiz</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Primary nav links */}
          <ActiveLink
            href="/play"
            exact
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            activeClassName="bg-teal-700 text-white"
            title="Start a new game"
          >
            <PlayIcon /> Play
          </ActiveLink>
          {user && (
            <ActiveLink
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              activeClassName="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
              title="View your class game history"
            >
              <DashboardIcon /> Dashboard
            </ActiveLink>
          )}
          <ActiveLink
            href="/questions"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            activeClassName="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
            title="Manage your custom question bank"
          >
            <QuestionsIcon /> Questions
          </ActiveLink>
          <ActiveLink
            href="/teacher"
            target="_blank"
            rel="noopener"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Open teacher view in a new window"
          >
            <TeacherIcon /> Teacher <ExternalIcon />
          </ActiveLink>

          {/* Separator */}
          <div className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" aria-hidden="true" />

          {/* Utility buttons */}
          <ThemeToggle />

          {/* User section */}
          {user ? (
            <UserMenu displayName={displayName} onSignOut={signOut} />
          ) : (
            <Link
              href="/sign-in"
              className="hidden sm:block ml-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              Sign in
            </Link>
          )}

          <MobileNav isSignedIn={!!user} userName={displayName} onSignOut={signOut} />
        </div>
      </div>
    </header>
  )
}
