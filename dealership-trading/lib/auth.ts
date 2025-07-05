import { NextAuthOptions } from "next-auth"
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
      
      // User passed domain check
      console.log(`Accepted login from authorized domain: ${domain}`)
      
      // Create/update user in Sanity only if configured
      if (sanityClient) {
        try {
          // Create ID from email
          const userId = `user.${email.replace(/[^a-z0-9]/gi, '_')}`
          
          // Check if user exists
          const existingUser = await sanityClient.fetch(
            `*[_type == "user" && _id == $userId][0]`,
            { userId }
          )
          
          if (existingUser) {
            // Update last login
            await sanityClient
              .patch(userId)
              .set({ 
                lastLogin: new Date().toISOString(),
                name: user.name || email,
                image: user.image || null
              })
              .commit()
            console.log('Updated existing user:', userId)
          } else {
            // Create new user with default 'sales' role
            await sanityClient.create({
              _type: 'user',
              _id: userId,
              name: user.name || email,
              email: email,
              image: user.image || null,
              role: 'sales', // Default role for new users
              active: true,
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString()
            })
            console.log('Created new user:', userId)
          }
        } catch (error) {
          console.error('Error creating/updating user in Sanity:', error)
          // Don't fail auth if Sanity operation fails
        }
      }
      
      return true
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          if (sanityClient) {
            const userId = `user.${session.user.email.replace(/[^a-z0-9]/gi, '_')}`
            const user = await sanityClient.fetch(
              `*[_type == "user" && _id == $userId][0]{
                _id,
                role,
                location->{
                  _id,
                  name,
                  code
                }
              }`,
              { userId }
            )
            
            if (user) {
              session.user.id = user._id
              session.user.role = user.role || 'sales'
              session.user.location = user.location || null
              session.user.domain = session.user.email.split('@')[1]
            } else {
              // Fallback if user not found in Sanity
              session.user.id = `user.${session.user.email.replace(/[^a-z0-9]/gi, '_')}`
              session.user.role = 'sales'
              session.user.domain = session.user.email.split('@')[1]
            }
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