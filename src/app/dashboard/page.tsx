import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getGameSessions } from '@/lib/actions/sessions'
import { DashboardClient } from './DashboardClient'

export default async function TeacherDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sessions = await getGameSessions()

  return <DashboardClient initialSessions={sessions} />
}
