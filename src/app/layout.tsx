import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider, themeScript } from '@/components/layout/ThemeProvider'

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const viewport: Viewport = {
  themeColor: '#6366f1',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://ladderquiz.com'),
  title: 'Ladder Quiz',
  description: 'Classroom trivia game for K–12. Ladder-style questions that get harder as you climb — solo or team mode.',
  appleWebApp: {
    capable: true,
    title: 'LadderQuiz',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Ladder Quiz',
    description: 'Classroom trivia for K–12. Ladder-style, team-ready, and fun.',
    url: 'https://ladderquiz.com',
    siteName: 'Ladder Quiz',
    images: [{ url: '/ladderquiz-logo.png', width: 1080, height: 1080, alt: 'Ladder Quiz' }],
  },
  twitter: {
    card: 'summary',
    title: 'Ladder Quiz',
    description: 'Classroom trivia for K–12.',
    images: ['/ladderquiz-logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: sets `dark` class before first paint — no FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
