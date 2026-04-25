import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Cup bowl */}
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none">
          <path d="M10 6h12v8q0 5-6 5t-6-5z" fill="white" />
          <path
            d="M10 9H7.5a2 2 0 000 4H10"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M22 9h2.5a2 2 0 010 4H22"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect x="14.5" y="19" width="3" height="2.5" rx=".5" fill="white" />
          <rect x="10.5" y="21.5" width="11" height="2.5" rx="1.25" fill="white" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
