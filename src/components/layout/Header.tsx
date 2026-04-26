import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { Emoji } from '@/components/ui/Emoji'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-950/90 shadow-sm dark:shadow-none">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
        >
          <Emoji emoji="🪜" size={22} />
          Ladder Quiz
        </Link>
        <div className="flex items-center gap-3">

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

