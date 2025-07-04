import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/permissions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, template } = await request.json();

    if (!email || !template) {
      return NextResponse.json({ error: 'Email and template are required' }, { status: 400 });
    }

    // Sample data for test emails
    const sampleData = {
      vehicle: {
        year: 2024,
        make: 'Toyota',
        model: 'Camry',
        vin: '1HGCM82633A123456',
        stockNumber: 'TC2024-001',
        price: 32500
      },
      fromStore: { name: 'Forman Ford' },
      toStore: { name: 'Forman Mazda' },
      requesterName: 'John Smith',
      approverName: 'Jane Doe',
      reason: 'Customer is interested in this specific vehicle'
    };

    let subject = '';
    let html = '';

    switch (template) {
      case 'transferRequested':
        subject = `[TEST] Transfer Request: ${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h2 style="color: #1f1f1f; margin-bottom: 24px;">New Transfer Request</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 8px 0;"><strong>${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}</strong></p>
              <p style="margin: 8px 0;">VIN: ${sampleData.vehicle.vin}</p>
              <p style="margin: 8px 0;">Stock #: ${sampleData.vehicle.stockNumber}</p>
              <p style="margin: 8px 0;">Price: $${sampleData.vehicle.price.toLocaleString()}</p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 8px 0;"><strong>${sampleData.requesterName}</strong> from <strong>${sampleData.toStore.name}</strong> has requested to transfer this vehicle from your location.</p>
            </div>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${process.env.NEXTAUTH_URL}/admin/transfers" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Review Transfer Request</a>
            </div>
          </div>
        `;
        break;

      case 'transferApproved':
        subject = `[TEST] Transfer Approved: ${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h2 style="color: #059669; margin-bottom: 24px;">✅ Transfer Approved</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 8px 0;"><strong>${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}</strong></p>
              <p style="margin: 8px 0;">VIN: ${sampleData.vehicle.vin}</p>
              <p style="margin: 8px 0;">From: ${sampleData.fromStore.name}</p>
            </div>
            
            <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 8px 0;"><strong>${sampleData.approverName}</strong> has approved the transfer request.</p>
              <p style="margin: 8px 0;">You can now arrange transportation for this vehicle.</p>
            </div>
          </div>
        `;
        break;

      case 'transferInTransit':
        subject = `[TEST] Transfer In Transit: ${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h2 style="color: #f59e0b; margin-bottom: 24px;">🚚 Vehicle In Transit</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 8px 0;"><strong>${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}</strong></p>
              <p style="margin: 8px 0;">VIN: ${sampleData.vehicle.vin}</p>
              <p style="margin: 8px 0;">From: ${sampleData.fromStore.name} → To: ${sampleData.toStore.name}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 8px 0;">The vehicle is now in transit to your location.</p>
            </div>
          </div>
        `;
        break;

      case 'transferDelivered':
        subject = `[TEST] Transfer Delivered: ${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h2 style="color: #059669; margin-bottom: 24px;">✅ Vehicle Delivered</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 8px 0;"><strong>${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}</strong></p>
              <p style="margin: 8px 0;">VIN: ${sampleData.vehicle.vin}</p>
              <p style="margin: 8px 0;">From: ${sampleData.fromStore.name} → To: ${sampleData.toStore.name}</p>
            </div>
            
            <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 8px 0;">The vehicle has been successfully delivered to your location.</p>
            </div>
          </div>
        `;
        break;

      case 'transferCancelled':
        subject = `[TEST] Transfer Cancelled: ${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h2 style="color: #dc2626; margin-bottom: 24px;">❌ Transfer Cancelled</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 8px 0;"><strong>${sampleData.vehicle.year} ${sampleData.vehicle.make} ${sampleData.vehicle.model}</strong></p>
              <p style="margin: 8px 0;">VIN: ${sampleData.vehicle.vin}</p>
              <p style="margin: 8px 0;">Transfer was: ${sampleData.fromStore.name} → ${sampleData.toStore.name}</p>
            </div>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 8px 0;">This transfer has been cancelled.</p>
              <p style="margin: 8px 0;">Reason: ${sampleData.reason}</p>
              <p style="margin: 8px 0;">The vehicle remains at ${sampleData.fromStore.name} and is available for other requests.</p>
            </div>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>',
      to: email,
      subject,
      html
    });

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}