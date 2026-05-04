import { createClient } from '@/lib/supabase/server'
import { getCloudSets } from '@/lib/actions/sets'
import { QuestionsClient } from './QuestionsClient'

export default async function QuestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const serverSets = user ? await getCloudSets() : []
  return <QuestionsClient serverSets={serverSets} isSignedIn={!!user} />
}

