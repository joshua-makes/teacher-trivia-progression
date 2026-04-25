export type Category = {
  id: number
  name: string
  emoji: string
  description: string
}

export const CATEGORIES: Category[] = [
  { id: 9, name: 'General Knowledge', emoji: '🌍', description: 'Test your general knowledge' },
  { id: 17, name: 'Science & Nature', emoji: '🔬', description: 'Explore science and nature' },
  { id: 18, name: 'Computers', emoji: '💻', description: 'Technology and computers' },
  { id: 21, name: 'Sports', emoji: '⚽', description: 'Sports and athletics' },
  { id: 22, name: 'Geography', emoji: '🗺️', description: 'World geography' },
  { id: 23, name: 'History', emoji: '📜', description: 'Historical events and figures' },
  { id: 25, name: 'Art', emoji: '🎨', description: 'Art and culture' },
  { id: 27, name: 'Animals', emoji: '🐾', description: 'Wildlife and animals' },
]
