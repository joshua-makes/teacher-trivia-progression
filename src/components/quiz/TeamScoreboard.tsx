import type { Team } from '@/lib/session'
import { formatPoints } from '@/lib/ladder'
import { cn } from '@/lib/utils'

const TEAM_STYLES: Record<string, { border: string; activeBg: string; text: string }> = {
  red:    { border: 'border-red-400',    activeBg: 'bg-red-50 dark:bg-red-950',       text: 'text-red-700 dark:text-red-300' },
  orange: { border: 'border-orange-400', activeBg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300' },
  amber:  { border: 'border-amber-400',  activeBg: 'bg-amber-50 dark:bg-amber-950',   text: 'text-amber-700 dark:text-amber-300' },
  green:  { border: 'border-green-400',  activeBg: 'bg-green-50 dark:bg-green-950',   text: 'text-green-700 dark:text-green-300' },
  teal:   { border: 'border-teal-400',   activeBg: 'bg-teal-50 dark:bg-teal-950',     text: 'text-teal-700 dark:text-teal-300' },
  blue:   { border: 'border-blue-400',   activeBg: 'bg-blue-50 dark:bg-blue-950',     text: 'text-blue-700 dark:text-blue-300' },
  indigo: { border: 'border-indigo-400', activeBg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300' },
  purple: { border: 'border-purple-400', activeBg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  violet: { border: 'border-violet-400', activeBg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300' },
  pink:   { border: 'border-pink-400',   activeBg: 'bg-pink-50 dark:bg-pink-950',     text: 'text-pink-700 dark:text-pink-300' },
  rose:   { border: 'border-rose-400',   activeBg: 'bg-rose-50 dark:bg-rose-950',     text: 'text-rose-700 dark:text-rose-300' },
}

const FALLBACK_STYLE = TEAM_STYLES.blue

export function TeamScoreboard({
  teams,
  currentTeamIndex,
}: {
  teams: Team[]
  currentTeamIndex: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-1">
        Scores
      </h3>
      {teams.map((team, i) => {
        const isCurrent = i === currentTeamIndex
        const style = TEAM_STYLES[team.color] ?? FALLBACK_STYLE

        return (
          <div
            key={team.id}
            className={cn(
              'rounded-xl border-2 px-3 py-3 transition-all',
              style.border,
              isCurrent ? style.activeBg : 'bg-white dark:bg-gray-800/90',
            )}
          >
            <div className={cn('text-xs font-semibold truncate', style.text)}>
              {isCurrent && '▶ '}
              {team.name}
            </div>
            <div className={cn('text-xl font-bold tabular-nums', style.text)}>
              {formatPoints(team.score)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
