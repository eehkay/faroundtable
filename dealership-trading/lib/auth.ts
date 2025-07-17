import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "./supabase-server"
import { getImpersonationData } from "./impersonation"

// Allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()).filter(d => d.length > 0) || ['delmaradv.com', 'formanautomotive.com']


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
        
        // Try to find matching dealership by email domain
        let matchingLocationId: string | null = null
        try {
          const { data: dealerships } = await supabaseAdmin
            .from('dealership_locations')
            .select('id, email_domains')
            .not('email_domains', 'is', null)
          
          if (dealerships) {
            for (const dealership of dealerships) {
              if (dealership.email_domains && dealership.email_domains.includes(domain)) {
                matchingLocationId = dealership.id
                break
              }
            }
          }
        } catch (error) {
        }

        if (existingUser) {
          // Update last login and location if user doesn't have one
          const updateData: any = {
            last_login: new Date().toISOString(),
            name: user.name || email,
            image_url: user.image || null,
            updated_at: new Date().toISOString()
          }
          
          // Only update location if user doesn't have one and we found a match
          if (!existingUser.location_id && matchingLocationId) {
            updateData.location_id = matchingLocationId
          }
          
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', existingUser.id)
          
          if (updateError) {
            throw updateError
          }
        } else {
          // Create new user with default 'sales' role and auto-assigned location
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              name: user.name || email,
              email: email,
              image_url: user.image || null,
              domain: domain,
              role: 'sales', // Default role for new users
              location_id: matchingLocationId, // Auto-assign location based on domain
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