import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ladder Quiz',
    short_name: 'LadderQuiz',
    description: 'Classroom trivia for K–12. Ladder-style, team-ready, and fun.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#111827',
    theme_color: '#6366f1',
    categories: ['education', 'games'],
    icons: [
      {
        src: '/ladderquiz-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/ladderquiz-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
