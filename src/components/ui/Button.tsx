import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-base',
        size === 'lg' && 'px-8 py-3.5 text-lg',
        variant === 'primary' &&
          'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:from-indigo-400 hover:to-indigo-500 active:from-indigo-700 active:to-indigo-700 shadow-md shadow-indigo-500/25 focus:ring-indigo-500',
        variant === 'secondary' &&
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border dark:border-gray-600',
        variant === 'ghost' &&
          'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 dark:text-gray-400 dark:hover:bg-gray-800',
        variant === 'danger' && 'bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-md focus:ring-red-500',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
