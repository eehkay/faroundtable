import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: settings, error } = await supabaseAdmin
      .from('ai_settings')
      .select(`
        *,
        created_by:users!ai_settings_created_by_fkey(id, name, email),
        updated_by:users!ai_settings_updated_by_fkey(id, name, email)
      `)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching AI settings:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      data: settings 
    })
  } catch (error) {
    console.error('Failed to fetch AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Validate required fields
    if (!name || !model || !system_prompt) {
      return NextResponse.json(
        { error: 'Name, model, and system prompt are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabaseAdmin
        .from('ai_settings')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    // Insert new setting
    const { data: newSetting, error } = await supabaseAdmin
      .from('ai_settings')
      .insert({
        name,
        description,
        model,
        system_prompt,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
        response_format: response_format || 'text',
        is_active: is_active !== false,
        is_default: is_default || false,
        created_by: session.user.id,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating AI setting:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      data: newSetting 
    })
  } catch (error) {
    console.error('Failed to create AI setting:', error)
    return NextResponse.json(
      { error: 'Failed to create AI setting' },
      { status: 500 }
    )
  }
}