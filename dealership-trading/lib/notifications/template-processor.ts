import type { TemplatePreviewData } from '@/types/notifications';

/**
 * Process a template string by replacing merge tags with actual data
 * Supports:
 * - Basic variables: {{variable}}
 * - Nested variables: {{object.property}}
 * - Conditional blocks: {{#if condition}}...{{/if}}
 */
export function processTemplate(template: string, data: TemplatePreviewData): string {
  if (!template) return '';

  let processed = template;

  // Process conditional blocks first
  processed = processConditionalBlocks(processed, data);

  // Process variables
  processed = processVariables(processed, data);

  return processed;
}

/**
 * Process conditional blocks in the template
 * {{#if variable}}content{{/if}}
 */
function processConditionalBlocks(template: string, data: TemplatePreviewData): string {
  const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  return template.replace(conditionalRegex, (match, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    return value ? content : '';
  });
}

/**
 * Process variable replacements in the template
 * {{variable}} or {{object.property}}
 */
function processVariables(template: string, data: TemplatePreviewData): string {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(variableRegex, (match, variable) => {
    // Skip conditional block markers
    if (variable.startsWith('#if') || variable === '/if') {
      return match;
    }

    const value = getNestedValue(data, variable.trim());
    
    // Debug logging for missing values
    if (value === undefined || value === null) {
      console.log('[Template Debug] Missing value for variable:', variable.trim());
      console.log('[Template Debug] Available data keys:', Object.keys(data));
      if (variable.trim().startsWith('transfer')) {
        console.log('[Template Debug] Transfer data:', JSON.stringify(data.transfer, null, 2));
      }
    }
    
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Get a nested value from an object using dot notation
 * e.g., getNestedValue({a: {b: 'c'}}, 'a.b') => 'c'
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Get all available template variables for documentation
 */
export function getTemplateVariables() {
  return {
    vehicle: [
      { key: 'vehicle.year', description: 'Vehicle model year', example: '2024' },
      { key: 'vehicle.make', description: 'Vehicle manufacturer', example: 'Toyota' },
      { key: 'vehicle.model', description: 'Vehicle model name', example: 'Camry' },
      { key: 'vehicle.vin', description: 'Vehicle identification number', example: '1HGCM82633A123456' },
      { key: 'vehicle.stock_number', description: 'Dealer stock number', example: 'STK-12345' },
      { key: 'vehicle.price', description: 'Vehicle price', example: '$25,999' },
      { key: 'vehicle.mileage', description: 'Current mileage', example: '15,234' },
      { key: 'vehicle.color', description: 'Vehicle color', example: 'Silver Metallic' },
      { key: 'vehicle.location.name', description: 'Current location', example: 'Store 1' },
      { key: 'vehicle.image_link1', description: 'Primary vehicle image URL', example: 'https://example.com/vehicle1.jpg' },
      { key: 'vehicle.image_link2', description: 'Secondary vehicle image URL', example: 'https://example.com/vehicle2.jpg' },
      { key: 'vehicle.image_link3', description: 'Third vehicle image URL', example: 'https://example.com/vehicle3.jpg' }
    ],
    transfer: [
      { key: 'transfer.from_location.name', description: 'Origin location', example: 'Store 1' },
      { key: 'transfer.to_location.name', description: 'Destination location', example: 'Store 3' },
      { key: 'transfer.requested_by.name', description: 'Requester name', example: 'John Smith' },
      { key: 'transfer.requested_by.email', description: 'Requester email', example: 'john@dealer.com' },
      { key: 'transfer.approved_by.name', description: 'Approver name', example: 'Jane Doe' },
      { key: 'transfer.status', description: 'Current status', example: 'approved' },
      { key: 'transfer.priority', description: 'Priority level', example: 'high' },
      { key: 'transfer.created_at', description: 'Request date', example: 'Jan 8, 2025' },
      { key: 'transfer.notes', description: 'Transfer notes', example: 'Customer waiting' },
      { key: 'transfer.cancellation_reason', description: 'Cancellation reason', example: 'Vehicle sold' }
    ],
    user: [
      { key: 'user.name', description: 'Recipient name', example: 'Mike Johnson' },
      { key: 'user.email', description: 'Recipient email', example: 'mike@dealer.com' },
      { key: 'user.location.name', description: 'User\'s store', example: 'Store 2' },
      { key: 'user.role', description: 'User role', example: 'manager' }
    ],
    system: [
      { key: 'system.date', description: 'Current date', example: 'January 8, 2025' },
      { key: 'system.time', description: 'Current time', example: '2:30 PM' }
    ],
    link: [
      { key: 'link.view_transfer', description: 'Transfer details link', example: 'https://app.com/transfers/123' },
      { key: 'link.approve_transfer', description: 'Approval link', example: 'https://app.com/approve/123' },
      { key: 'link.dashboard', description: 'Dashboard link', example: 'https://app.com/dashboard' },
      { key: 'link.view_short', description: 'Short transfer link', example: 'https://app.com/t/123' },
      { key: 'link.approve_short', description: 'Short approval link', example: 'https://app.com/a/123' }
    ]
  };
}