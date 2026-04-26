import { LADDER } from '@/lib/ladder'
import { cn } from '@/lib/utils'

export function LadderDisplay({ currentRung, totalRungs }: { currentRung: number; totalRungs: number }) {
  const visibleLadder = LADDER.slice(0, totalRungs)
  return (
    <div className="flex flex-col gap-0.5">
      {[...visibleLadder].reverse().map(rung => {
        const isCurrent = rung.number === currentRung
        const isCompleted = rung.number < currentRung
        const isTop = rung.number === totalRungs

        return (
          <div
            key={rung.number}
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-150',
              isCurrent &&
                'bg-yellow-400 text-yellow-900 shadow-sm font-bold ring-2 ring-yellow-300 ring-offset-1',
              isCompleted && !rung.isSafeZone &&
                'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
              isCompleted && rung.isSafeZone &&
                'bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200 font-semibold',
              !isCurrent && !isCompleted && !rung.isSafeZone &&
                'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              !isCurrent && !isCompleted && rung.isSafeZone &&
                'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold',
            )}
          >
            <span className="shrink-0 mr-1 opacity-70">
              {isTop
                ? '🏆'
                : rung.isSafeZone
                  ? '🛡️'
                  : `${rung.number}.`}
            </span>
            <span className="tabular-nums">{rung.label}</span>
          </div>
        )
      })}
    </div>
  )
}
