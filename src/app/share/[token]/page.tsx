import { getSharedSet } from '@/lib/actions/sets'
import { ShareClient } from './ShareClient'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const preview = await getSharedSet(token)

  if (!preview) {
    return (
      <Container>
        <div className="max-w-lg mx-auto py-20 text-center space-y-4">
          <p className="text-5xl">??</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Set not found</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This share link may have expired or been removed by its owner.
          </p>
          <form action="/">
            <Button variant="primary">Go home</Button>
          </form>
        </div>
      </Container>
    )
  }

  return <ShareClient preview={preview} />
}
