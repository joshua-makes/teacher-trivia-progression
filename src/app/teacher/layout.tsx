import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      {/* Float the theme toggle so teachers can switch in this window too */}
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}
