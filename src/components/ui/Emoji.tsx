'use client'

/**
 * Renders an emoji using Google's Noto Color Emoji CDN.
 * Falls back to the raw Unicode character if the image fails to load.
 * License: https://github.com/googlefonts/noto-emoji/blob/main/svg/LICENSE
 */

import { useState } from 'react'
import Image from 'next/image'

function emojiToCdnUrl(emoji: string): string {
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0)!.toString(16).toLowerCase())
    .filter(cp => cp !== 'fe0f') // strip variation selector-16
    .join('_')
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoints}/512.webp`
}

export function Emoji({
  emoji,
  size = 40,
  className = '',
}: {
  emoji: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.75, lineHeight: 1 }}
        role="img"
        aria-label={emoji}
      >
        {emoji}
      </span>
    )
  }

  return (
    <Image
      src={emojiToCdnUrl(emoji)}
      width={size}
      height={size}
      alt={emoji}
      className={className}
      onError={() => setFailed(true)}
      draggable={false}
      unoptimized
    />
  )
}
