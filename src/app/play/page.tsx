import { createClient } from '@/lib/supabase/server'
import { PlayClient } from './PlayClient'

export default async function PlayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <PlayClient isSignedIn={!!user} />
}
