import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const email = token?.email as string
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || []
    const userDomain = email?.split('@')[1]
    
    // Double-check domain even after authentication
    if (userDomain && !allowedDomains.includes(userDomain)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protect all routes except public ones
export const config = {
  matcher: [
    '/((?!login|api/auth|unauthorized|studio|_next/static|_next/image|favicon.ico).*)',
  ],
}