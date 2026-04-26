import { cn } from '@/lib/utils'

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-sm dark:shadow-none backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
