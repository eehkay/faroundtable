import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from '@sanity/client'

const sanityClient = process.env.SANITY_PROJECT_ID ? createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false,
}) : null

// Allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || ['delmaradv.com', 'formanautomotive.com']

console.log('NextAuth Config:', {
  ALLOWED_DOMAINS,
  SANITY_CONFIGURED: !!process.env.SANITY_PROJECT_ID,
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID
})

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
          // Removed hd parameter to allow any Google account to attempt sign in
          // We'll handle domain validation in the signIn callback
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = profile?.email || ''
      const domain = email.split('@')[1]
      
      console.log('Sign in attempt:', { email, domain, ALLOWED_DOMAINS })
      
      // Verify domain is allowed
      if (!ALLOWED_DOMAINS.includes(domain)) {
        console.log(`Rejected login from unauthorized domain: ${domain}`)
        return false
      }
      
      // If Sanity is not configured yet, allow sign in for testing
      if (!sanityClient) {
        console.log('Sanity not configured, allowing sign in for:', email)
        return true
      }
      
      try {
        // Check if user exists and is active
        const existingUser = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]`,
          { email }
        )
        
        if (existingUser && existingUser.active === false) {
          console.log(`Rejected login from deactivated user: ${email}`)
          return false
        }
        
        // Create or update user
        await sanityClient.createOrReplace({
          _id: `user.${email.replace(/[^a-z0-9]/gi, '_')}`,
          _type: 'user',
          email,
          name: user.name,
          image: user.image,
          domain,
          lastLogin: new Date().toISOString(),
          active: true,
          role: existingUser?.role || 'sales' // Preserve existing role
        })
        
        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        // Allow sign in even if Sanity fails for now
        return true
      }
    },
    
    async session({ session, token }) {
      if (session?.user?.email) {
        // If Sanity is not configured, return basic session
        if (!sanityClient) {
          session.user.id = `user.${session.user.email.replace(/[^a-z0-9]/gi, '_')}`
          session.user.role = 'sales'
          session.user.domain = session.user.email.split('@')[1]
          return session
        }
        
        try {
          // Fetch user data from Sanity
          const sanityUser = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]{
              _id,
              email,
              name,
              role,
              location->{_id, name, code},
              active
            }`,
            { email: session.user.email }
          )
          
          if (sanityUser) {
            session.user.id = sanityUser._id
            session.user.role = sanityUser.role
            session.user.location = sanityUser.location
            session.user.domain = session.user.email.split('@')[1]
          } else {
            // Fallback if user not found in Sanity
            session.user.id = `user.${session.user.email.replace(/[^a-z0-9]/gi, '_')}`
            session.user.role = 'sales'
            session.user.domain = session.user.email.split('@')[1]
          }
        } catch (error) {
          console.error('Error fetching user from Sanity:', error)
          // Fallback on error
          session.user.id = `user.${session.user.email.replace(/[^a-z0-9]/gi, '_')}`
          session.user.role = 'sales'
          session.user.domain = session.user.email.split('@')[1]
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login?error=auth',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }