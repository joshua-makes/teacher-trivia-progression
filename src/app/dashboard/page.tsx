import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGameSessions } from '@/lib/actions/sessions'
import { DashboardClient } from './DashboardClient'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/dashboard')

  const sessions = await getGameSessions()
  const displayName = user.user_metadata?.full_name ?? user.email ?? null
  return <DashboardClient initialSessions={sessions} displayName={displayName} />
}
