import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      location?: {
        _id: string
        name: string
        code: string
      }
      domain: string
    } & DefaultSession["user"]
  }
}