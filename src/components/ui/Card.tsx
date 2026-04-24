import { cn } from '@/lib/utils'

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
