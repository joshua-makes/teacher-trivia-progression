'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  title?: string
  target?: string
  rel?: string
  exact?: boolean
}

export function ActiveLink({ href, children, className, activeClassName, exact = false, ...rest }: Props) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        className,
        isActive && (activeClassName ?? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'),
      )}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Link>
  )
}
