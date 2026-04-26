'use client'

/**
 * Renders an emoji using Google's Noto Color Emoji CDN.
 * Shows the native Unicode character immediately (no layout gap while CDN loads).
 * Falls back permanently to the native glyph if the CDN image fails.
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

  // Block display so mx-auto centering works (same as Next.js Image default)
  const wrapStyle: React.CSSProperties = {
    display: 'block',
    width: size,
    height: size,
    position: 'relative',
    flexShrink: 0,
  }

  if (failed) {
    return (
      <span
        className={className}
        style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.8 }}
        role="img"
        aria-label={emoji}
      >
        {emoji}
      </span>
    )
  }

  return (
    <span
      className={className}
      style={wrapStyle}
      role="img"
      aria-label={emoji}
    >
      {/* Native emoji — visible immediately, hidden once CDN image loads */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.8,
          lineHeight: 1,
          opacity: loaded ? 0 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {emoji}
      </span>
      <Image
        src={emojiToCdnUrl(emoji)}
        width={size}
        height={size}
        alt=""
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.15s' }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        draggable={false}
        unoptimized
      />
    </span>
  )
}
