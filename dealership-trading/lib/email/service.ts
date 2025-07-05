import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { Vehicle, DealershipLocation } from '@/types/vehicle';
import type { Transfer } from '@/types/transfer';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email templates
const emailTemplates = {
  transferRequested: (data: {
    vehicle: Vehicle;
    requestingStore: DealershipLocation | { _ref: string };
    originStore: DealershipLocation | { _ref: string };
    requesterName: string;
    transferId: string;
  }) => ({
    subject: `Transfer Request: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #1f1f1f; margin-bottom: 24px;">New Transfer Request</h2>
        
        ${data.vehicle.imageUrls && data.vehicle.imageUrls.length > 0 ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${data.vehicle.imageUrls[0]}" alt="${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        ` : ''}
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</strong></p>
          <p style="margin: 8px 0; color: #4a5568;">VIN: ${data.vehicle.vin}</p>
          <p style="margin: 8px 0; color: #4a5568;">Stock #: ${data.vehicle.stockNumber || 'N/A'}</p>
          <p style="margin: 8px 0; color: #4a5568;">Price: $${data.vehicle.price.toLocaleString()}</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #1976d2;"><strong>${data.requesterName}</strong> from <strong>${'_id' in data.requestingStore ? data.requestingStore.name : 'Store'}</strong> has requested to transfer this vehicle from your location.</p>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXTAUTH_URL}/admin/transfers?id=${data.transferId}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Review Transfer Request</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 32px; text-align: center;">
          This is an automated notification from Round Table Inventory Management
        </p>
      </div>
    `
  }),

  transferApproved: (data: {
    vehicle: Vehicle;
    approverName: string;
    requestingStore: DealershipLocation | { _ref: string };
    originStore: DealershipLocation | { _ref: string };
    transferId: string;
  }) => ({
    subject: `Transfer Approved: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-bottom: 24px;">✅ Transfer Approved</h2>
        
        ${data.vehicle.imageUrls && data.vehicle.imageUrls.length > 0 ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${data.vehicle.imageUrls[0]}" alt="${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        ` : ''}
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</strong></p>
          <p style="margin: 8px 0; color: #4a5568;">VIN: ${data.vehicle.vin}</p>
          <p style="margin: 8px 0; color: #4a5568;">From: ${'_id' in data.originStore ? data.originStore.name : 'Origin Store'}</p>
        </div>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #059669;"><strong>${data.approverName}</strong> has approved the transfer request.</p>
          <p style="margin: 8px 0; color: #059669;">You can now arrange transportation for this vehicle.</p>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXTAUTH_URL}/admin/transfers?id=${data.transferId}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Transfer Details</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 32px; text-align: center;">
          This is an automated notification from Round Table Inventory Management
        </p>
      </div>
    `
  }),

  transferStatusUpdate: (data: {
    vehicle: Vehicle;
    status: 'in-transit' | 'delivered';
    updaterName: string;
    requestingStore: DealershipLocation | { _ref: string };
    originStore: DealershipLocation | { _ref: string };
    transferId: string;
  }) => ({
    subject: `Transfer ${data.status === 'in-transit' ? 'In Transit' : 'Delivered'}: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: ${data.status === 'delivered' ? '#059669' : '#f59e0b'}; margin-bottom: 24px;">
          ${data.status === 'in-transit' ? '🚚 Vehicle In Transit' : '✅ Vehicle Delivered'}
        </h2>
        
        ${data.vehicle.imageUrls && data.vehicle.imageUrls.length > 0 ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${data.vehicle.imageUrls[0]}" alt="${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        ` : ''}
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</strong></p>
          <p style="margin: 8px 0; color: #4a5568;">VIN: ${data.vehicle.vin}</p>
          <p style="margin: 8px 0; color: #4a5568;">From: ${'_id' in data.originStore ? data.originStore.name : 'Origin Store'} → To: ${'_id' in data.requestingStore ? data.requestingStore.name : 'Requesting Store'}</p>
        </div>
        
        <div style="background-color: ${data.status === 'delivered' ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: ${data.status === 'delivered' ? '#059669' : '#f59e0b'};">Status updated by <strong>${data.updaterName}</strong></p>
          <p style="margin: 8px 0; color: ${data.status === 'delivered' ? '#059669' : '#f59e0b'};">
            ${data.status === 'in-transit' 
              ? 'The vehicle is now in transit to your location.' 
              : 'The vehicle has been successfully delivered to your location.'}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXTAUTH_URL}/admin/transfers?id=${data.transferId}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Transfer Details</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 32px; text-align: center;">
          This is an automated notification from Round Table Inventory Management
        </p>
      </div>
    `
  }),

  transferCancelled: (data: {
    vehicle: Vehicle;
    cancellerName: string;
    reason?: string;
    requestingStore: DealershipLocation | { _ref: string };
    originStore: DealershipLocation | { _ref: string };
  }) => ({
    subject: `Transfer Cancelled: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #dc2626; margin-bottom: 24px;">❌ Transfer Cancelled</h2>
        
        ${data.vehicle.imageUrls && data.vehicle.imageUrls.length > 0 ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${data.vehicle.imageUrls[0]}" alt="${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        ` : ''}
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #1f1f1f; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 8px 0; color: #4a5568;"><strong style="color: #1f1f1f;">${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}</strong></p>
          <p style="margin: 8px 0; color: #4a5568;">VIN: ${data.vehicle.vin}</p>
          <p style="margin: 8px 0; color: #4a5568;">Transfer was: ${'_id' in data.originStore ? data.originStore.name : 'Origin Store'} → ${'_id' in data.requestingStore ? data.requestingStore.name : 'Requesting Store'}</p>
        </div>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #dc2626;">This transfer has been cancelled by <strong>${data.cancellerName}</strong></p>
          ${data.reason ? `<p style="margin: 8px 0; color: #dc2626;">Reason: ${data.reason}</p>` : ''}
          <p style="margin: 8px 0; color: #dc2626;">The vehicle remains at ${'_id' in data.originStore ? data.originStore.name : 'Origin Store'} and is available for other requests.</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 32px; text-align: center;">
          This is an automated notification from Round Table Inventory Management
        </p>
      </div>
    `
  })
};

// Get recipients for different notification types
async function getRecipients(store: DealershipLocation | { _ref: string }, roles: string[] = ['manager', 'admin']): Promise<string[]> {
  const locationId = '_id' in store ? store._id : store._ref;
  
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('email, name')
    .eq('location_id', locationId)
    .in('role', roles)
    .eq('active', true);

  if (error) {
    console.error('Error fetching recipients:', error);
    return [];
  }

  // Get user emails
  const recipients: string[] = (users || []).map((u: any) => u.email).filter(Boolean);

  return [...new Set(recipients)]; // Remove duplicates
}

// Get email settings for a specific notification type
async function getEmailSettings(settingKey: string) {
  const { data, error } = await supabaseAdmin
    .from('email_settings')
    .select('*')
    .eq('setting_key', settingKey)
    .single();

  if (error) {
    console.error(`Error fetching email settings for ${settingKey}:`, error);
    return null;
  }

  return data;
}

// Send notification functions
export async function sendTransferRequestedNotification(data: {
  transfer: Transfer;
  vehicle: Vehicle;
  requester: { name: string; email: string };
}) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }
  
  try {
    // Get email settings for this notification type
    const settings = await getEmailSettings('transferRequested');
    if (!settings || !settings.enabled) {
      console.log('Transfer requested notifications are disabled');
      return;
    }

    // Get recipients based on settings
    let recipients: string[] = [];
    
    // Add role-based recipients if configured
    if (settings.metadata?.recipientRoles && Array.isArray(settings.metadata.recipientRoles)) {
      if (settings.metadata?.notifyOriginStore !== false) {
        const originRecipients = await getRecipients(data.transfer.fromStore, settings.metadata.recipientRoles);
        recipients.push(...originRecipients);
      }
      
      if (settings.metadata?.notifyDestinationStore === true) {
        const destRecipients = await getRecipients(data.transfer.toStore, settings.metadata.recipientRoles);
        recipients.push(...destRecipients);
      }
    }
    
    // Add custom recipients from settings
    if (settings.recipients && settings.recipients.length > 0) {
      recipients.push(...settings.recipients);
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];
    
    if (recipients.length === 0) {
      console.warn(`No recipients found for transfer request notification at store ${'_id' in data.transfer.fromStore ? data.transfer.fromStore.name : data.transfer.fromStore._ref}`);
      return;
    }

    const emailData = emailTemplates.transferRequested({
      vehicle: data.vehicle,
      requestingStore: data.transfer.toStore,
      originStore: data.transfer.fromStore,
      requesterName: data.requester.name,
      transferId: data.transfer._id || ''
    });

    // Use custom subject if provided in settings
    const subject = settings.subject || emailData.subject;

    const result = await resend!.emails.send({
      from: settings.metadata?.fromEmail || process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>',
      to: recipients,
      subject,
      html: emailData.html
    });

    console.log(`Transfer requested notification sent to ${recipients.length} recipients`);
    return result;
  } catch (error) {
    console.error('Failed to send transfer requested notification:', error);
    throw error;
  }
}

export async function sendTransferApprovedNotification(data: {
  transfer: Transfer;
  vehicle: Vehicle;
  approver: { name: string; email: string };
}) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }
  
  try {
    // Get email settings for this notification type
    const settings = await getEmailSettings('transferApproved');
    if (!settings || !settings.enabled) {
      console.log('Transfer approved notifications are disabled');
      return;
    }

    // Get recipients based on settings
    let recipients: string[] = [];
    
    // Add role-based recipients if configured
    if (settings.metadata?.recipientRoles && Array.isArray(settings.metadata.recipientRoles)) {
      if (settings.metadata?.notifyOriginStore === true) {
        const originRecipients = await getRecipients(data.transfer.fromStore, settings.metadata.recipientRoles);
        recipients.push(...originRecipients);
      }
      
      if (settings.metadata?.notifyDestinationStore !== false) {
        const destRecipients = await getRecipients(data.transfer.toStore, settings.metadata.recipientRoles);
        recipients.push(...destRecipients);
      }
    }
    
    // Notify the original requester if configured
    if (settings.metadata?.notifyRequester === true && 'email' in data.transfer.requestedBy && data.transfer.requestedBy.email) {
      recipients.push(data.transfer.requestedBy.email);
    }
    
    // Add custom recipients from settings
    if (settings.recipients && settings.recipients.length > 0) {
      recipients.push(...settings.recipients);
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      console.warn(`No recipients found for transfer approved notification`);
      return;
    }

    const emailData = emailTemplates.transferApproved({
      vehicle: data.vehicle,
      approverName: data.approver.name,
      requestingStore: data.transfer.toStore,
      originStore: data.transfer.fromStore,
      transferId: data.transfer._id || ''
    });

    // Use custom subject if provided in settings
    const subject = settings.subject || emailData.subject;

    const result = await resend!.emails.send({
      from: settings.metadata?.fromEmail || process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>',
      to: recipients,
      subject,
      html: emailData.html
    });

    console.log(`Transfer approved notification sent to ${recipients.length} recipients`);
    return result;
  } catch (error) {
    console.error('Failed to send transfer approved notification:', error);
    throw error;
  }
}

export async function sendTransferStatusUpdateNotification(data: {
  transfer: Transfer;
  vehicle: Vehicle;
  status: 'in-transit' | 'delivered';
  updater: { name: string; email: string };
}) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }
  
  try {
    // Get email settings for this notification type
    const settingKey = data.status === 'in-transit' ? 'transferInTransit' : 'transferDelivered';
    const settings = await getEmailSettings(settingKey);
    if (!settings || !settings.enabled) {
      console.log(`Transfer ${data.status} notifications are disabled`);
      return;
    }

    // Get recipients based on settings
    let recipients: string[] = [];
    
    // Add role-based recipients if configured
    if (settings.metadata?.recipientRoles && Array.isArray(settings.metadata.recipientRoles)) {
      if (settings.metadata?.notifyOriginStore !== false) {
        const originRecipients = await getRecipients(data.transfer.fromStore, settings.metadata.recipientRoles);
        recipients.push(...originRecipients);
      }
      
      if (settings.metadata?.notifyDestinationStore !== false) {
        const destRecipients = await getRecipients(data.transfer.toStore, settings.metadata.recipientRoles);
        recipients.push(...destRecipients);
      }
    }
    
    // Add custom recipients from settings
    if (settings.recipients && settings.recipients.length > 0) {
      recipients.push(...settings.recipients);
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      console.warn(`No recipients found for transfer status update notification`);
      return;
    }

    const emailData = emailTemplates.transferStatusUpdate({
      vehicle: data.vehicle,
      status: data.status,
      updaterName: data.updater.name,
      requestingStore: data.transfer.toStore,
      originStore: data.transfer.fromStore,
      transferId: data.transfer._id || ''
    });

    // Use custom subject if provided in settings
    const subject = settings.subject || emailData.subject;

    const result = await resend!.emails.send({
      from: settings.metadata?.fromEmail || process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>',
      to: recipients,
      subject,
      html: emailData.html
    });

    console.log(`Transfer ${data.status} notification sent to ${recipients.length} recipients`);
    return result;
  } catch (error) {
    console.error(`Failed to send transfer ${data.status} notification:`, error);
    throw error;
  }
}

export async function sendTransferCancelledNotification(data: {
  transfer: Transfer;
  vehicle: Vehicle;
  canceller: { name: string; email: string };
  reason?: string;
}) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return;
  }
  
  try {
    // Get email settings for this notification type
    const settings = await getEmailSettings('transferCancelled');
    if (!settings || !settings.enabled) {
      console.log('Transfer cancelled notifications are disabled');
      return;
    }

    // Get recipients based on settings
    let recipients: string[] = [];
    
    // Add role-based recipients if configured
    if (settings.metadata?.recipientRoles && Array.isArray(settings.metadata.recipientRoles)) {
      if (settings.metadata?.notifyOriginStore !== false) {
        const originRecipients = await getRecipients(data.transfer.fromStore, settings.metadata.recipientRoles);
        recipients.push(...originRecipients);
      }
      
      if (settings.metadata?.notifyDestinationStore !== false) {
        const destRecipients = await getRecipients(data.transfer.toStore, settings.metadata.recipientRoles);
        recipients.push(...destRecipients);
      }
    }
    
    // Notify the original requester if configured
    if (settings.metadata?.notifyRequester === true && 'email' in data.transfer.requestedBy && data.transfer.requestedBy.email) {
      recipients.push(data.transfer.requestedBy.email);
    }
    
    // Add custom recipients from settings
    if (settings.recipients && settings.recipients.length > 0) {
      recipients.push(...settings.recipients);
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      console.warn(`No recipients found for transfer cancelled notification`);
      return;
    }

    const emailData = emailTemplates.transferCancelled({
      vehicle: data.vehicle,
      cancellerName: data.canceller.name,
      reason: data.reason,
      requestingStore: data.transfer.toStore,
      originStore: data.transfer.fromStore
    });

    // Use custom subject if provided in settings
    const subject = settings.subject || emailData.subject;

    const result = await resend!.emails.send({
      from: settings.metadata?.fromEmail || process.env.RESEND_FROM_EMAIL || 'Round Table <notifications@roundtable.app>',
      to: recipients,
      subject,
      html: emailData.html
    });

    console.log(`Transfer cancelled notification sent to ${recipients.length} recipients`);
    return result;
  } catch (error) {
    console.error('Failed to send transfer cancelled notification:', error);
    throw error;
  }
}