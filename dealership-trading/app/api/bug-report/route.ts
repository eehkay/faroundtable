import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-server'

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const message = formData.get('message') as string
    const screenshot = formData.get('screenshot') as File | null
    
    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Bug description is required' }, { status: 400 })
    }

    // Handle screenshot if provided
    let screenshotBase64: string | null = null
    let screenshotName: string | null = null
    
    if (screenshot && screenshot.size > 0) {
      // Validate file size (5MB limit)
      if (screenshot.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Screenshot must be less than 5MB' }, { status: 400 })
      }

      // Convert to base64 for email attachment
      const bytes = await screenshot.arrayBuffer()
      const buffer = Buffer.from(bytes)
      screenshotBase64 = buffer.toString('base64')
      screenshotName = screenshot.name
    }

    // Format date
    const reportDate = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    // Create email HTML
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #dc2626; margin-bottom: 24px;">🐛 Bug Report</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Reporter Information</h3>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">Name:</strong> ${session.user.name || 'N/A'}</p>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">Email:</strong> ${session.user.email}</p>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">Role:</strong> ${session.user.role}</p>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">Location:</strong> ${session.user.location?.name || 'N/A'}</p>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">Date:</strong> ${reportDate}</p>
        </div>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Bug Description</h3>
          <p style="margin: 8px 0; color: #4a5568; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        ${screenshotName ? `
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #1976d2;"><strong>Screenshot attached:</strong> ${screenshotName}</p>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px; margin-top: 32px; text-align: center;">
          This bug report was submitted from Roundtable Inventory Management
        </p>
      </div>
    `

    // Send email if Resend is configured
    if (resend) {
      const emailData: any = {
        from: process.env.RESEND_FROM_EMAIL || 'Roundtable Bug Reports <bugs@roundtable.app>',
        to: 'kellogg@delmaradv.com',
        subject: `Bug Report - ${session.user.name} - ${new Date().toLocaleDateString()}`,
        html: emailHtml
      }

      // Add screenshot as attachment if provided
      if (screenshotBase64 && screenshotName) {
        emailData.attachments = [{
          filename: screenshotName,
          content: screenshotBase64
        }]
      }

      const emailResult = await resend.emails.send(emailData)
      console.log('Bug report email sent:', emailResult)
    } else {
      console.warn('Resend not configured - bug report not sent via email')
    }

    // Log activity
    try {
      await supabaseAdmin
        .from('activities')
        .insert({
          action: 'bug_report_submitted',
          userId: session.user.id,
          details: {
            message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
            hasScreenshot: !!screenshot,
            reportedAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log bug report activity:', error)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Bug report submitted successfully'
    })

  } catch (error) {
    console.error('Bug report error:', error)
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    )
  }
}