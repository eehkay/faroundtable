// Notification system types

export type NotificationChannel = 'email' | 'sms';
export type NotificationCategory = 'transfer' | 'system' | 'vehicle' | 'general';
export type TemplateVariableContext = 'vehicle' | 'transfer' | 'user' | 'system' | 'link';

export interface EmailChannel {
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface SMSChannel {
  enabled: boolean;
  message: string;
}

export interface NotificationChannels {
  email?: EmailChannel;
  sms?: SMSChannel;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category: NotificationCategory;
  channels: NotificationChannels;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
  context: TemplateVariableContext;
}

export interface TemplatePreviewData {
  vehicle?: {
    year: string;
    make: string;
    model: string;
    vin: string;
    stock_number: string;
    price: string;
    mileage: string;
    color?: string;
    location?: {
      name: string;
    };
    image_link1?: string;
    image_link2?: string;
    image_link3?: string;
  };
  transfer?: {
    from_location: {
      name: string;
    };
    to_location: {
      name: string;
    };
    requested_by: {
      name: string;
      email: string;
    };
    approved_by?: {
      name: string;
    };
    status: string;
    priority?: string;
    created_at: string;
    notes?: string;
    cancellation_reason?: string;
  };
  user?: {
    name: string;
    email: string;
    location?: {
      name: string;
    };
    role: string;
  };
  system?: {
    date: string;
    time: string;
  };
  link?: {
    view_transfer: string;
    approve_transfer: string;
    dashboard: string;
    view_short?: string;
    approve_short?: string;
  };
}

// Notification Rules types
export type NotificationEvent = 
  | 'transfer_requested'
  | 'transfer_approved'
  | 'transfer_in_transit'
  | 'transfer_delivered'
  | 'transfer_cancelled'
  | 'comment_added'
  | 'vehicle_updated'
  | 'daily_summary';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';
export type ConditionLogic = 'AND' | 'OR';
export type ChannelPriority = 'email_only' | 'sms_only' | 'sms_first' | 'email_first' | 'both';

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface RecipientConfig {
  useConditions: boolean;
  currentLocation?: string[];
  requestingLocation?: string[];
  destinationLocation?: string[];
  specificUsers?: string[];
  additionalEmails?: string[];
  additionalPhones?: string[];
}

export interface ChannelConfig {
  email: {
    enabled: boolean;
    templateId: string;
  };
  sms: {
    enabled: boolean;
    templateId: string;
  };
  priority: ChannelPriority;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  event: NotificationEvent;
  conditions: RuleCondition[];
  conditionLogic: ConditionLogic;
  recipients: RecipientConfig;
  channels: ChannelConfig;
  created_at: string;
  updated_at: string;
}

// Notification Log types
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface NotificationLog {
  id: string;
  rule_id?: string;
  template_id?: string;
  event: NotificationEvent;
  recipient_id?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error_message?: string;
  sent_at: string;
  metadata?: Record<string, any>;
}