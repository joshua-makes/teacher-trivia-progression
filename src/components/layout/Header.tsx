import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-950/90 shadow-sm dark:shadow-none">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/ladderquiz-logo.png"
            alt="Ladder Quiz"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Ladder Quiz
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

