'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  isSignedIn: boolean
  onSignOut: () => void
}

export function MobileNav({ isSignedIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          {open ? (
            <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          ) : (
            <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-lg px-4 py-3 flex flex-col gap-1">
          <Link href="/play" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            ▶ Play
          </Link>
          {isSignedIn && (
            <Link href="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              📊 Dashboard
            </Link>
          )}
          <Link href="/questions" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            ✏️ Questions
          </Link>
          <Link href="/teacher" target="_blank" rel="noopener" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            👁 Teacher
          </Link>
          <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
          {isSignedIn ? (
            <button onClick={() => { setOpen(false); onSignOut() }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left">
              Sign out
            </button>
          ) : (
            <Link href="/sign-in" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              Sign in
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
