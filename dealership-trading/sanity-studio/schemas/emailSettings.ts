export default {
  name: 'emailSettings',
  title: 'Email Settings',
  type: 'document',
  fields: [
    {
      name: 'settingType',
      title: 'Setting Type',
      type: 'string',
      options: {
        list: [
          { title: 'General Settings', value: 'general' },
          { title: 'Transfer Requested', value: 'transferRequested' },
          { title: 'Transfer Approved', value: 'transferApproved' },
          { title: 'Transfer In Transit', value: 'transferInTransit' },
          { title: 'Transfer Delivered', value: 'transferDelivered' },
          { title: 'Transfer Cancelled', value: 'transferCancelled' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      initialValue: true
    },
    {
      name: 'fromName',
      title: 'From Name',
      type: 'string',
      hidden: ({ parent }) => parent?.settingType !== 'general'
    },
    {
      name: 'fromEmail',
      title: 'From Email',
      type: 'string',
      hidden: ({ parent }) => parent?.settingType !== 'general',
      validation: Rule => Rule.custom((email, context) => {
        if (context.parent?.settingType === 'general' && !email) {
          return 'From email is required for general settings';
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return 'Please enter a valid email address';
        }
        return true;
      })
    },
    {
      name: 'replyToEmail',
      title: 'Reply To Email',
      type: 'string',
      hidden: ({ parent }) => parent?.settingType !== 'general'
    },
    {
      name: 'subjectTemplate',
      title: 'Subject Template',
      type: 'string',
      description: 'Use {{variable}} for dynamic content. Available: {{year}}, {{make}}, {{model}}, {{fromStore}}, {{toStore}}, {{requesterName}}',
      hidden: ({ parent }) => parent?.settingType === 'general'
    },
    {
      name: 'recipientRoles',
      title: 'Recipient Roles',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Admin', value: 'admin' },
          { title: 'Manager', value: 'manager' },
          { title: 'Sales', value: 'sales' },
          { title: 'Transport', value: 'transport' }
        ]
      },
      hidden: ({ parent }) => parent?.settingType === 'general'
    },
    {
      name: 'notifyOriginStore',
      title: 'Notify Origin Store',
      type: 'boolean',
      initialValue: true,
      hidden: ({ parent }) => !parent?.settingType || parent?.settingType === 'general'
    },
    {
      name: 'notifyDestinationStore',
      title: 'Notify Destination Store',
      type: 'boolean',
      initialValue: true,
      hidden: ({ parent }) => !parent?.settingType || parent?.settingType === 'general'
    },
    {
      name: 'notifyRequester',
      title: 'Notify Original Requester',
      type: 'boolean',
      initialValue: true,
      hidden: ({ parent }) => !['transferApproved', 'transferInTransit', 'transferDelivered', 'transferCancelled'].includes(parent?.settingType)
    },
    {
      name: 'customTemplate',
      title: 'Custom Email Template',
      type: 'text',
      description: 'Custom HTML template. Leave empty to use default. Variables: {{vehicleDetails}}, {{fromStore}}, {{toStore}}, {{requesterName}}, {{approverName}}, {{reason}}, {{transferLink}}',
      hidden: ({ parent }) => parent?.settingType === 'general'
    }
  ],
  preview: {
    select: {
      title: 'settingType',
      subtitle: 'enabled'
    },
    prepare({ title, subtitle }) {
      return {
        title: title ? title.replace(/([A-Z])/g, ' $1').trim() : 'Email Setting',
        subtitle: subtitle ? 'Enabled' : 'Disabled'
      }
    }
  }
}