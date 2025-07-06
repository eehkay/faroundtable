import { cookies } from 'next/headers'

const IMPERSONATION_COOKIE = 'rt-impersonation'
const IMPERSONATION_DURATION = 60 * 60 * 1000 // 1 hour

export interface ImpersonationData {
  active: boolean
  targetUserId: string
  targetUserEmail: string
  originalUser: {
    id: string
    email: string
    name: string
    role: string
  }
  startedAt: string
  expiresAt: string
}

export async function getImpersonationData(): Promise<ImpersonationData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(IMPERSONATION_COOKIE)
  
  if (!cookie?.value) return null
  
  try {
    const data = JSON.parse(cookie.value) as ImpersonationData
    
    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      await clearImpersonation()
      return null
    }
    
    return data
  } catch {
    return null
  }
}

export async function setImpersonation(data: Omit<ImpersonationData, 'startedAt' | 'expiresAt' | 'active'>) {
  const cookieStore = await cookies()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + IMPERSONATION_DURATION)
  
  const impersonationData: ImpersonationData = {
    ...data,
    active: true,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  }
  
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(impersonationData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })
}

export async function clearImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATION_COOKIE)
}