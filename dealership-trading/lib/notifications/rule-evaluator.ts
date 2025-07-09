import type { NotificationRule, RuleCondition } from '@/types/notifications';

/**
 * Evaluate a notification rule against a given context
 */
export async function evaluateRule(
  rule: NotificationRule,
  context: Record<string, any>
): Promise<boolean> {
  if (!rule.conditions || rule.conditions.length === 0) {
    // No conditions means always send
    return true;
  }

  const results = await Promise.all(
    rule.conditions.map(condition => evaluateCondition(condition, context))
  );

  // Apply condition logic (AND/OR)
  if (rule.conditionLogic === 'OR') {
    return results.some(result => result);
  } else {
    // Default to AND logic
    return results.every(result => result);
  }
}

/**
 * Evaluate a single condition
 */
async function evaluateCondition(
  condition: RuleCondition,
  context: Record<string, any>
): Promise<boolean> {
  const fieldValue = getNestedValue(context, condition.field);
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue == conditionValue;
    
    case 'not_equals':
      return fieldValue != conditionValue;
    
    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue);
      }
      return false;
    
    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return !fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(conditionValue);
      }
      return true;
    
    default:
      return false;
  }
}

/**
 * Get a nested value from an object using dot notation
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
 * Get available fields for condition building based on event type
 */
export function getAvailableFields(event: string): Array<{
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
}> {
  const commonFields = [
    { field: 'user.role', label: 'Recipient Role', type: 'string' as const },
    { field: 'user.location_id', label: 'Recipient Location ID', type: 'string' as const },
    { field: 'user.email', label: 'Recipient Email', type: 'string' as const }
  ];

  const transferFields = [
    { field: 'transfer.status', label: 'Transfer Status', type: 'string' as const },
    { field: 'transfer.priority', label: 'Transfer Priority', type: 'string' as const },
    { field: 'transfer.from_location_id', label: 'From Location ID', type: 'string' as const },
    { field: 'transfer.to_location_id', label: 'To Location ID', type: 'string' as const },
    { field: 'vehicle.location_id', label: 'Vehicle Location ID', type: 'string' as const },
    { field: 'vehicle.price', label: 'Vehicle Price', type: 'number' as const },
    { field: 'vehicle.year', label: 'Vehicle Year', type: 'string' as const },
    { field: 'vehicle.make', label: 'Vehicle Make', type: 'string' as const },
    { field: 'vehicle.model', label: 'Vehicle Model', type: 'string' as const }
  ];

  // Return fields based on event type
  if (event.startsWith('transfer_')) {
    return [...commonFields, ...transferFields];
  }

  return commonFields;
}