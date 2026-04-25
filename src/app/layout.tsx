import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://trivialevels.com'),
  title: 'Trivia Levels',
  description: 'Classroom trivia game for K–12. Ladder-style questions that get harder as you climb — solo or team mode.',
  openGraph: {
    title: 'Trivia Levels',
    description: 'Classroom trivia for K–12. Ladder-style, team-ready, and fun.',
    url: 'https://trivialevels.com',
    siteName: 'Trivia Levels',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
