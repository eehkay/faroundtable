# Notification Template Variables Reference

This document lists all available merge tags that can be used in email and SMS notification templates.

## Usage

Variables are inserted using double curly braces: `{{variable.name}}`

### Conditional Blocks
You can use conditional logic to show/hide content:
```
{{#if variable}}
  This content shows only if variable exists
{{/if}}
```

## Available Variables

### Vehicle Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{vehicle.year}}` | Vehicle model year | 2024 |
| `{{vehicle.make}}` | Vehicle manufacturer | Toyota |
| `{{vehicle.model}}` | Vehicle model name | Camry |
| `{{vehicle.vin}}` | Vehicle identification number | 1HGCM82633A123456 |
| `{{vehicle.stock_number}}` | Dealer stock number | STK-12345 |
| `{{vehicle.price}}` | Vehicle price | $25,999 |
| `{{vehicle.mileage}}` | Current mileage | 15,234 |
| `{{vehicle.color}}` | Vehicle color | Silver Metallic |
| `{{vehicle.location.name}}` | Current location | Store 1 |
| `{{vehicle.image_link1}}` | Primary vehicle image URL | https://example.com/vehicle1.jpg |
| `{{vehicle.image_link2}}` | Secondary vehicle image URL | https://example.com/vehicle2.jpg |
| `{{vehicle.image_link3}}` | Third vehicle image URL | https://example.com/vehicle3.jpg |

### Transfer Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{transfer.from_location.name}}` | Origin location | Store 1 |
| `{{transfer.to_location.name}}` | Destination location | Store 3 |
| `{{transfer.requested_by.name}}` | Requester name | John Smith |
| `{{transfer.requested_by.email}}` | Requester email | john@dealer.com |
| `{{transfer.approved_by.name}}` | Approver name | Jane Doe |
| `{{transfer.status}}` | Current status | approved |
| `{{transfer.priority}}` | Priority level | high |
| `{{transfer.created_at}}` | Request date | Jan 8, 2025 |
| `{{transfer.notes}}` | Transfer notes | Customer waiting |
| `{{transfer.cancellation_reason}}` | Cancellation reason | Vehicle sold |

### User Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user.name}}` | Recipient name | Mike Johnson |
| `{{user.email}}` | Recipient email | mike@dealer.com |
| `{{user.location.name}}` | User's store | Store 2 |
| `{{user.role}}` | User role | manager |

### System Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{system.date}}` | Current date | January 8, 2025 |
| `{{system.time}}` | Current time | 2:30 PM |

### Links

| Variable | Description | Example |
|----------|-------------|---------|
| `{{link.view_transfer}}` | Transfer details link | https://app.com/transfers/123 |
| `{{link.approve_transfer}}` | Approval link | https://app.com/approve/123 |
| `{{link.dashboard}}` | Dashboard link | https://app.com/dashboard |
| `{{link.view_short}}` | Short transfer link | https://app.com/t/123 |
| `{{link.approve_short}}` | Short approval link | https://app.com/a/123 |

## Example Templates

### Email Template Example

```html
<h2>Transfer Request for {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}</h2>

{{#if vehicle.image_link1}}
<img src="{{vehicle.image_link1}}" alt="Vehicle Image" style="width: 100%; max-width: 600px; height: auto;">
{{/if}}

<p>Hello {{user.name}},</p>

<p>A transfer has been requested for the following vehicle:</p>

<ul>
  <li><strong>Stock #:</strong> {{vehicle.stock_number}}</li>
  <li><strong>VIN:</strong> {{vehicle.vin}}</li>
  <li><strong>Price:</strong> {{vehicle.price}}</li>
  <li><strong>Mileage:</strong> {{vehicle.mileage}} miles</li>
</ul>

<p><strong>Transfer Details:</strong></p>
<ul>
  <li><strong>From:</strong> {{transfer.from_location.name}}</li>
  <li><strong>To:</strong> {{transfer.to_location.name}}</li>
  <li><strong>Requested by:</strong> {{transfer.requested_by.name}}</li>
  <li><strong>Priority:</strong> {{transfer.priority}}</li>
</ul>

{{#if transfer.notes}}
<p><strong>Notes:</strong> {{transfer.notes}}</p>
{{/if}}

<p>
  <a href="{{link.view_transfer}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Transfer Details</a>
</p>
```

### SMS Template Example

```
Transfer Request: {{vehicle.year}} {{vehicle.make}} {{vehicle.model}} ({{vehicle.stock_number}}) from {{transfer.from_location.name}} to {{transfer.to_location.name}}. View: {{link.view_short}}
```

## Best Practices

1. **Always use conditional blocks** for optional data like `transfer.notes` or `vehicle.image_link1`
2. **Keep SMS templates short** - Remember the 160 character limit
3. **Use short links for SMS** - Use `{{link.view_short}}` instead of `{{link.view_transfer}}`
4. **Test with preview data** - Always preview templates before saving
5. **Include fallbacks** - Consider what happens if a variable is missing

## Notes

- All variables are case-sensitive
- Nested properties use dot notation (e.g., `vehicle.location.name`)
- If a variable doesn't exist, it will be replaced with an empty string
- Image links (image_link1, image_link2, image_link3) come from the vehicle inventory data