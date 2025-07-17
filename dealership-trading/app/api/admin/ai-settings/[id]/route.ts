import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: setting, error } = await supabaseAdmin
      .from('ai_settings')
      .select(`
        *,
        created_by:users!ai_settings_created_by_fkey(id, name, email),
        updated_by:users!ai_settings_updated_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching AI setting:', error)
      throw error
    }

    if (!setting) {
      return NextResponse.json(
        { error: 'AI setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: setting 
    })
  } catch (error) {
    console.error('Failed to fetch AI setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI setting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      description, 
      model, 
      system_prompt, 
      temperature, 
      max_tokens,
      response_format,
      is_active,
      is_default 
    } = body

    // If setting as default, unset other defaults
    if (is_default) {
      await supabaseAdmin
        .from('ai_settings')
        .update({ is_default: false })
        .neq('id', id)
        .eq('is_default', true)
    }

    // Update setting
    const { data: updatedSetting, error } = await supabaseAdmin
      .from('ai_settings')
      .update({
        name,
        description,
        model,
        system_prompt,
        temperature,
        max_tokens,
        response_format,
        is_active,
        is_default,
        updated_by: session.user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI setting:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedSetting 
    })
  } catch (error) {
    console.error('Failed to update AI setting:', error)
    return NextResponse.json(
      { error: 'Failed to update AI setting' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if it's the default setting
    const { data: setting } = await supabaseAdmin
      .from('ai_settings')
      .select('is_default')
      .eq('id', id)
      .single()

    if (setting?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default AI setting' },
        { status: 400 }
      )
    }

    // Delete setting
    const { error } = await supabaseAdmin
      .from('ai_settings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting AI setting:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true 
    })
  } catch (error) {
    console.error('Failed to delete AI setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete AI setting' },
      { status: 500 }
    )
  }
}