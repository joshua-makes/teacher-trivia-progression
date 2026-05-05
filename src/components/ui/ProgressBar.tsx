export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label?: string
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full">
      {label && <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>}
      <div
        className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
