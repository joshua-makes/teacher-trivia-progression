'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const SettingsModal = dynamic(
  () => import('./SettingsModal').then(m => m.SettingsModal),
  { ssr: false },
)

export function UserMenu({
  displayName,
  onSignOut,
}: {
  displayName: string
  onSignOut: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <div ref={ref} className="relative hidden sm:block ml-0.5">
        <button
          onClick={() => setOpen(o => !o)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={`Account menu for ${displayName}`}
          title={displayName}
          className="w-7 h-7 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center select-none transition-colors"
        >
          {displayName[0]?.toUpperCase()}
        </button>

        {open && (
          <div className="absolute right-0 top-9 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{displayName}</p>
            </div>
            <button
              onClick={() => { setSettingsOpen(true); setOpen(false) }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-base leading-none">⚙️</span> Settings
            </button>
            <form action={onSignOut}>
              <button
                type="submit"
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6"/>
                </svg>
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
