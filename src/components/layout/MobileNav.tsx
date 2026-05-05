'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  isSignedIn: boolean
  userName?: string
  onSignOut: () => void
}

const PlayIcon = () => (
  <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M3 2l9 5-9 5V2z"/></svg>
)
const DashboardIcon = () => (
  <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="0" y="6" width="3.5" height="8" rx="0.5"/>
    <rect x="5.25" y="3" width="3.5" height="11" rx="0.5"/>
    <rect x="10.5" y="0" width="3.5" height="14" rx="0.5"/>
  </svg>
)
const QuestionsIcon = () => (
  <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12.5h10M9.5 2.5l2 2-7 7H2.5v-2l7-7z"/>
  </svg>
)
const TeacherIcon = () => (
  <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="1" width="12" height="9" rx="1.5"/>
    <path d="M5 13h4M7 10v3"/>
  </svg>
)

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
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
        isActive
          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      {children}
    </Link>
  )
}

export function MobileNav({ isSignedIn, userName, onSignOut }: Props) {
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
            aria-hidden="true"
            onClick={close}
          />

          {/* Drawer */}
          <div className="anim-slide-down absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-lg px-3 py-3 flex flex-col gap-1">

            {/* User header */}
            {isSignedIn && userName && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 border-b border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center select-none shrink-0">
                  {userName[0]?.toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{userName}</p>
              </div>
            )}

            <NavLink href="/play" onClick={close}><PlayIcon /> Play</NavLink>
            {isSignedIn && <NavLink href="/dashboard" onClick={close}><DashboardIcon /> Dashboard</NavLink>}
            <NavLink href="/questions" onClick={close}><QuestionsIcon /> Questions</NavLink>
            <NavLink href="/teacher" onClick={close} target="_blank" rel="noopener">
              <TeacherIcon /> Teacher
              <svg className="w-3 h-3 opacity-40 ml-auto shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 10 10 2M5 2h5v5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </NavLink>

            <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

            {isSignedIn ? (
              <button
                onClick={() => { close(); onSignOut() }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left"
              >
                Sign out
              </button>
            ) : (
              <NavLink href="/sign-in" onClick={close}>
                <span className="text-teal-600 dark:text-teal-400">Sign in free</span>
              </NavLink>
            )}
          </div>
        </>
      )}
    </div>
  )
}
