import type { GradeLevel } from '@/lib/ladder'

export type Category = {
  id: number
  name: string
  emoji: string
  description: string
  gradeLevels: GradeLevel[]
}

export const CATEGORIES: Category[] = [
  { id: 9,  name: 'General Knowledge', emoji: '🌍', description: 'Fun facts about the world',        gradeLevels: ['K-2', '3-5', '6-8', '9-12'] },
  { id: 17, name: 'Science & Nature',  emoji: '🔬', description: 'Explore science and the world',    gradeLevels: ['K-2', '3-5', '6-8', '9-12'] },
  { id: 19, name: 'Mathematics',       emoji: '🔢', description: 'Numbers, shapes, and patterns',    gradeLevels: ['K-2', '3-5', '6-8', '9-12'] },
  { id: 27, name: 'Animals',           emoji: '🐾', description: 'Wildlife and creatures',            gradeLevels: ['K-2', '3-5', '6-8'] },
  { id: 22, name: 'Geography',         emoji: '🗺️', description: 'Countries, capitals, and maps',    gradeLevels: ['3-5', '6-8', '9-12'] },
  { id: 23, name: 'History',           emoji: '📜', description: 'Important events and figures',      gradeLevels: ['3-5', '6-8', '9-12'] },
  { id: 21, name: 'Sports',            emoji: '⚽', description: 'Sports and athletics',              gradeLevels: ['3-5', '6-8', '9-12'] },
  { id: 12, name: 'Music',             emoji: '🎵', description: 'Songs, artists, and instruments',  gradeLevels: ['3-5', '6-8', '9-12'] },
  { id: 25, name: 'Art',               emoji: '🎨', description: 'Art, artists, and creativity',     gradeLevels: ['K-2', '3-5', '6-8', '9-12'] },
  { id: 18, name: 'Technology',        emoji: '💻', description: 'Computers and technology',          gradeLevels: ['6-8', '9-12'] },
  { id: 20, name: 'Mythology',         emoji: '⚡', description: 'Gods, myths, and legends',          gradeLevels: ['6-8', '9-12'] },
  { id: 11, name: 'Movies & TV',       emoji: '🎬', description: 'Film and television',               gradeLevels: ['6-8', '9-12'] },
]
