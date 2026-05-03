import { auth } from '@clerk/nextjs/server'
import { getCloudSets } from '@/lib/actions/sets'
import { QuestionsClient } from './QuestionsClient'

export default async function QuestionsPage() {
  const { userId } = await auth()
  const serverSets = userId ? await getCloudSets() : []
  return <QuestionsClient serverSets={serverSets} />
}

