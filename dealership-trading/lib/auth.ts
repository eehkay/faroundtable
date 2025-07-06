import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "./supabase-server"
import { getImpersonationData } from "./impersonation"

// Allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || ['delmaradv.com', 'formanautomotive.com']

console.log('NextAuth Config:', {
  ALLOWED_DOMAINS,
  SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
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
      
      // Create/update user in Supabase
      try {
        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          console.error('Error fetching user:', fetchError)
          throw fetchError
        }
        
        if (existingUser) {
          // Update last login
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              last_login: new Date().toISOString(),
              name: user.name || email,
              image_url: user.image || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
          
          if (updateError) {
            console.error('Error updating user:', updateError)
            throw updateError
          }
          
          console.log('Updated existing user:', existingUser.id)
        } else {
          // Create new user with default 'sales' role
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              name: user.name || email,
              email: email,
              image_url: user.image || null,
              domain: domain,
              role: 'sales', // Default role for new users
              active: true,
              last_login: new Date().toISOString()
            })
            .select()
            .single()
          
          if (createError) {
            console.error('Error creating user:', createError)
            throw createError
          }
          
          console.log('Created new user:', newUser.id)
        }
      } catch (error) {
        console.error('Error in user sign-in:', error)
        // Don't fail auth if database operation fails
        // User can still access the app, but may have limited functionality
      }
      
      return true
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          // Check for impersonation
          const impersonationData = await getImpersonationData()
          
          if (impersonationData?.active) {
            // Load the impersonated user's data
            const { data: targetUser, error: targetError } = await supabaseAdmin
              .from('users')
              .select(`
                id,
                name,
                email,
                role,
                domain,
                image_url,
                location:location_id(
                  id,
                  name,
                  code
                )
              `)
              .eq('id', impersonationData.targetUserId)
              .single()
            
            if (!targetError && targetUser) {
              // Override session with impersonated user data
              session.user = {
                ...session.user,
                id: targetUser.id,
                name: targetUser.name || targetUser.email,
                email: targetUser.email,
                role: targetUser.role || 'sales',
                domain: targetUser.domain || targetUser.email.split('@')[1],
                location: targetUser.location && !Array.isArray(targetUser.location) ? targetUser.location : undefined,
                image: targetUser.image_url || session.user.image
              }
              
              // Add impersonation info to session
              session.impersonating = impersonationData
            }
          } else {
            // Normal session enrichment
            const { data: user, error } = await supabaseAdmin
              .from('users')
              .select(`
                id,
                role,
                domain,
                location:location_id(
                  id,
                  name,
                  code
                )
              `)
              .eq('email', session.user.email)
              .single()
            
            if (error) {
              console.error('Error fetching user for session:', error)
              // Provide fallback values
              session.user.id = crypto.randomUUID()
              session.user.role = 'sales'
              session.user.domain = session.user.email.split('@')[1]
              session.user.location = undefined
            } else if (user) {
              session.user.id = user.id
              session.user.role = user.role || 'sales'
              session.user.domain = user.domain || session.user.email.split('@')[1]
              session.user.location = user.location && !Array.isArray(user.location) ? user.location : undefined
            }
          }
        } catch (error) {
          console.error('Error enriching session:', error)
          // Provide fallback values
          session.user.id = crypto.randomUUID()
          session.user.role = 'sales'
          session.user.domain = session.user.email?.split('@')[1] || 'unknown'
          session.user.location = undefined
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