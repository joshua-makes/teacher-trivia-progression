import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import { FullscreenButton } from './FullscreenButton'
import { SettingsButton } from './SettingsButton'
import { MobileNav } from './MobileNav'
import { ActiveLink } from './ActiveLink'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-950/90 shadow-sm dark:shadow-none">
      <div className="relative max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/ladderquiz-logo.png" alt="Ladder Quiz" width={40} height={40} className="rounded-lg" priority />
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Ladder Quiz</span>
        </Link>
        <div className="flex items-center gap-1">
          <ActiveLink
            href="/play"
            exact
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Start a new game"
          >
            ▶ Play
          </ActiveLink>
          {user && (
            <ActiveLink
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="View your class game history"
            >
              📊 Dashboard
            </ActiveLink>
          )}
          <ActiveLink
            href="/questions"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Manage your custom question bank"
          >
            ✏️ Questions
          </ActiveLink>
          <ActiveLink
            href="/teacher"
            target="_blank"
            rel="noopener"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Open teacher view in a new window"
          >
            👁 Teacher
          </ActiveLink>
          <FullscreenButton />
          <SettingsButton />
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 ml-1">
                {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="hidden sm:block ml-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="hidden sm:block ml-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Sign in
            </Link>
          )}
          <MobileNav isSignedIn={!!user} onSignOut={signOut} />
        </div>
      </div>
    </header>
  )
}
