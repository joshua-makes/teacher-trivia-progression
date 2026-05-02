import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// All routes are public — sign-in is optional.
// Only the /api/sets routes require auth (they touch the DB).
const isProtectedApiRoute = createRouteMatcher(['/api/sets(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
