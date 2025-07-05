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
  }
}