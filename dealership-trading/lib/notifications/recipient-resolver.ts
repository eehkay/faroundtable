import { supabaseAdmin } from '@/lib/supabase-server';
import type { RecipientConfig } from '@/types/notifications';

interface ResolvedRecipients {
  emails: string[];
  phones: string[];
  details: Array<{
    type: string;
    source: string;
    recipients: string[];
  }>;
}

/**
 * Resolve recipients based on rule configuration and context
 */
export async function resolveRecipients(
  config: RecipientConfig,
  context: Record<string, any>
): Promise<ResolvedRecipients> {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const details: ResolvedRecipients['details'] = [];

  // 1. Recipients based on conditions
  if (config.useConditions) {
    // This would be handled by the rule evaluator - recipients matching conditions
    // are determined by who the notification is being sent to
    if (context.user?.email) {
      emails.add(context.user.email);
      details.push({
        type: 'condition',
        source: 'Matched rule conditions',
        recipients: [context.user.email]
      });
    }
  }

  // 2. Current location recipients
  if (config.currentLocation && config.currentLocation.length > 0 && context.vehicle?.location_id) {
    const recipients = await getLocationRecipients(
      context.vehicle.location_id,
      config.currentLocation
    );
    recipients.emails.forEach(email => emails.add(email));
    recipients.phones.forEach(phone => phones.add(phone));
    
    if (recipients.emails.length > 0) {
      details.push({
        type: 'location',
        source: `Current vehicle location (${context.vehicle.location?.name || context.vehicle.location_id})`,
        recipients: recipients.emails
      });
    }
  }

  // 3. Requesting location recipients (from location)
  if (config.requestingLocation && config.requestingLocation.length > 0 && context.transfer?.from_location_id) {
    const recipients = await getLocationRecipients(
      context.transfer.from_location_id,
      config.requestingLocation
    );
    recipients.emails.forEach(email => emails.add(email));
    recipients.phones.forEach(phone => phones.add(phone));
    
    if (recipients.emails.length > 0) {
      details.push({
        type: 'location',
        source: `Requesting location (${context.transfer.from_location?.name || context.transfer.from_location_id})`,
        recipients: recipients.emails
      });
    }
  }

  // 4. Destination location recipients (to location)
  if (config.destinationLocation && config.destinationLocation.length > 0 && context.transfer?.to_location_id) {
    const recipients = await getLocationRecipients(
      context.transfer.to_location_id,
      config.destinationLocation
    );
    recipients.emails.forEach(email => emails.add(email));
    recipients.phones.forEach(phone => phones.add(phone));
    
    if (recipients.emails.length > 0) {
      details.push({
        type: 'location',
        source: `Destination location (${context.transfer.to_location?.name || context.transfer.to_location_id})`,
        recipients: recipients.emails
      });
    }
  }

  // 5. Specific users
  if (config.specificUsers && config.specificUsers.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('email, phone')
      .in('id', config.specificUsers)
      .eq('active', true);

    if (users) {
      const userEmails = users.map(u => u.email).filter(Boolean);
      userEmails.forEach(email => emails.add(email));
      
      const userPhones = users.map(u => u.phone).filter(Boolean);
      userPhones.forEach(phone => phones.add(phone));
      
      if (userEmails.length > 0) {
        details.push({
          type: 'specific',
          source: 'Specific users',
          recipients: userEmails
        });
      }
    }
  }

  // 5. Additional emails
  if (config.additionalEmails && config.additionalEmails.length > 0) {
    config.additionalEmails.forEach(email => emails.add(email));
    details.push({
      type: 'additional',
      source: 'Additional emails',
      recipients: config.additionalEmails
    });
  }

  // 6. Additional phones
  if (config.additionalPhones && config.additionalPhones.length > 0) {
    config.additionalPhones.forEach(phone => phones.add(phone));
  }

  // Special handling for specific notification types
  if (context.event === 'transfer_approved' && context.transfer?.requested_by?.email) {
    // Always notify the requester for approved transfers
    emails.add(context.transfer.requested_by.email);
    details.push({
      type: 'requester',
      source: 'Transfer requester',
      recipients: [context.transfer.requested_by.email]
    });
  }

  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
    details
  };
}

/**
 * Get recipients from a specific location with given roles
 */
async function getLocationRecipients(
  locationId: string,
  roles: string[]
): Promise<{ emails: string[]; phones: string[] }> {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('email, phone')
    .eq('location_id', locationId)
    .in('role', roles)
    .eq('active', true);

  if (!users) {
    return { emails: [], phones: [] };
  }

  return {
    emails: users.map(u => u.email).filter(Boolean),
    phones: users.map(u => u.phone).filter(Boolean)
  };
}