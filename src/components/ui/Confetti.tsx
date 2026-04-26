'use client'

import { useMemo } from 'react'

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f43f5e', // rose
  '#facc15', // yellow
]

const SHAPES = ['■', '●', '▲', '◆']

type Particle = {
  id: number
  left: number
  color: string
  shape: string
  delay: number
  duration: number
  size: number
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function Confetti({ count = 80 }: { count?: number }) {
  const particles: Particle[] = useMemo(() => {
    const rand = seededRandom(42)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      color: COLORS[Math.floor(rand() * COLORS.length)]!,
      shape: SHAPES[Math.floor(rand() * SHAPES.length)]!,
      delay: rand() * 1.8,
      duration: 2.2 + rand() * 1.6,
      size: 8 + rand() * 8,
    }))
  }, [count])

  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            lineHeight: 1,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  )
}
