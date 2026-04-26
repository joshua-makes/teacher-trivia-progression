'use client'

/**
 * Renders an emoji using Google's Noto Color Emoji CDN.
 * Shows the native Unicode character immediately as a placeholder, then fades
 * in the CDN image once it loads. Falls back permanently to the native glyph
 * if the image fails.
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
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const nativeStyle = { fontSize: size * 0.75, lineHeight: 1 }

  if (failed) {
    return (
      <span
        className={className}
        style={nativeStyle}
        role="img"
        aria-label={emoji}
      >
        {emoji}
      </span>
    )
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={emoji}
    >
      {/* Native emoji visible immediately — hidden once CDN image loads */}
      {!loaded && (
        <span
          className="absolute inset-0 flex items-center justify-center select-none"
          aria-hidden="true"
          style={nativeStyle}
        >
          {emoji}
        </span>
      )}
      <Image
        src={emojiToCdnUrl(emoji)}
        width={size}
        height={size}
        alt=""
        className={`transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        draggable={false}
        unoptimized
      />
    </span>
  )
}
