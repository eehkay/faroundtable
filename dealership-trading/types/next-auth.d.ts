import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      location?: {
        id: string
        name: string
        code: string
      }
      domain: string
    } & DefaultSession["user"]
    impersonating?: {
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
  }
}