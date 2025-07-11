import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "./supabase-server"

// Allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || ['delmaradv.com', 'formanautomotive.com']


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
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = profile?.email || ''
      const domain = email.split('@')[1]
      
      // Verify domain is allowed
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return false
      }
      
      // Create/update user in Supabase
      try {
        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
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
            throw updateError
          }
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
            throw createError
          }
        }
      } catch (error) {
        // Don't fail auth if database operation fails
        // User can still access the app, but may have limited functionality
      }
      
      return true
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          // Fetch user with location data
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select(`
              id,
              role,
              domain,
              location:dealership_locations(
                id,
                name,
                code
              )
            `)
            .eq('email', session.user.email)
            .single()
          
          if (error) {
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
        } catch (error) {
          // Provide fallback values
          session.user.id = crypto.randomUUID()
          session.user.role = 'sales'
          session.user.domain = session.user.email.split('@')[1]
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