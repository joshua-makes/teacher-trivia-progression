import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignInForm } from './SignInForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next = '/dashboard' } = await searchParams
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(safeNext)

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}

