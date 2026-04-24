'use client'

import { useEffect, useRef } from 'react'

export function Timer({
  seconds,
  isPaused,
  onTick,
  onExpire,
}: {
  seconds: number
  isPaused: boolean
  onTick: (remaining: number) => void
  onExpire: () => void
}) {
  const remainingRef = useRef(seconds)
  const onTickRef = useRef(onTick)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    remainingRef.current = seconds
    onTickRef.current(seconds)
  }, [seconds])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      remainingRef.current -= 1
      onTickRef.current(remainingRef.current)
      if (remainingRef.current <= 0) {
        clearInterval(interval)
        onExpireRef.current()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, seconds])

  return null
}
