import { CATEGORIES } from '@/lib/data/categories'
import { Card } from '@/components/ui/Card'

export function CategoryGrid({ onSelect }: { onSelect: (id: number) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="text-left group"
          aria-label={`Select ${cat.name} category`}
        >
          <Card className="p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group-hover:bg-blue-50 dark:group-hover:bg-blue-950">
            <div className="text-3xl mb-2">{cat.emoji}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{cat.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.description}</div>
          </Card>
        </button>
      ))}
    </div>
  )
}
