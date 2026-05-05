'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  isSignedIn: boolean
  onSignOut: () => void
}

function NavLink({ href, children, onClick, target, rel }: { href: string; children: React.ReactNode; onClick: () => void; target?: string; rel?: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
        isActive
          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      {children}
    </Link>
  )
}

export function MobileNav({ isSignedIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
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
        <>
          {/* Backdrop — tap outside to close */}
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
            aria-hidden="true"
            onClick={close}
          />

          {/* Drawer */}
          <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-lg px-4 py-3 flex flex-col gap-1">
            <NavLink href="/play" onClick={close}>▶ Play</NavLink>
            {isSignedIn && <NavLink href="/dashboard" onClick={close}>📊 Dashboard</NavLink>}
            <NavLink href="/questions" onClick={close}>✏️ Questions</NavLink>
            <NavLink href="/teacher" onClick={close} target="_blank" rel="noopener">
              👁 Teacher
              <svg className="w-3 h-3 opacity-50 ml-auto" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 10 10 2M5 2h5v5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </NavLink>
            <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
            {isSignedIn ? (
              <button onClick={() => { close(); onSignOut() }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left">
                Sign out
              </button>
            ) : (
              <NavLink href="/sign-in" onClick={close}>
                <span className="w-full text-center text-teal-600 dark:text-teal-400 font-semibold">Sign in</span>
              </NavLink>
            )}
          </div>
        </>
      )}
    </div>
  )
}
