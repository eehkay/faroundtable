'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if session is loaded and user has no location
    if (status === 'authenticated' && session && !session.user.location && !session.impersonating?.active) {
      // Skip redirect if already on onboarding page
      if (!pathname.includes('/onboarding')) {
        router.push('/onboarding')
      }
    }
  }, [session, status, pathname, router])

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    )
  }

  return <>{children}</>
}