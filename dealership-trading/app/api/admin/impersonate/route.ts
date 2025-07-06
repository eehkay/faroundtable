import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { setImpersonation, clearImpersonation } from '@/lib/impersonation'
import { canImpersonate, canBeImpersonated } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !canImpersonate(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Fetch target user
    const { data: targetUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, active')
      .eq('id', userId)
      .single()
    
    if (error || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (!targetUser.active) {
      return NextResponse.json({ error: 'Cannot impersonate inactive user' }, { status: 400 })
    }
    
    if (!canBeImpersonated(targetUser.role)) {
      return NextResponse.json({ error: 'Cannot impersonate this user role' }, { status: 403 })
    }
    
    // Set impersonation cookie
    await setImpersonation({
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      originalUser: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        role: session.user.role
      }
    })
    
    // Log the impersonation activity
    await supabaseAdmin
      .from('activities')
      .insert({
        user_id: session.user.id,
        action: 'impersonation-started',
        metadata: {
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.role
        }
      })
    
    return NextResponse.json({ 
      success: true,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      }
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Log the end of impersonation if active
    if (session.impersonating?.active) {
      await supabaseAdmin
        .from('activities')
        .insert({
          user_id: session.impersonating.originalUser.id,
          action: 'impersonation-ended',
          metadata: {
            targetUserId: session.impersonating.targetUserId,
            targetUserEmail: session.impersonating.targetUserEmail,
            duration: new Date().getTime() - new Date(session.impersonating.startedAt).getTime()
          }
        })
    }
    
    // Clear impersonation cookie
    await clearImpersonation()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stop impersonation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}