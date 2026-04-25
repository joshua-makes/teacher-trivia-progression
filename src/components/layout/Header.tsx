import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md bg-white/80 dark:bg-gray-950/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          � Trivia Levels
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/joshua-makes/teacher-trivia-progression"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="View source on GitHub"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
