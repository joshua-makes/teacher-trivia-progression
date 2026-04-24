import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
        >
          🎓 Teacher Trivia
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/bestacles/teacher-trivia-progression"
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
