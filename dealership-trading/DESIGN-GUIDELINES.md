# Round Table - Design Guidelines

## 🎨 Design Philosophy

Our design system emphasizes a modern, sophisticated dark interface with high contrast and subtle depth. We prioritize clarity, consistency, and professional aesthetics suitable for an automotive dealership platform.

### Core Principles
- **Clarity First**: Information hierarchy through contrast, not decoration
- **Subtle Depth**: Use background colors with subtle borders for enhanced definition
- **Consistent Spacing**: 4px base unit grid system
- **Smooth Interactions**: Thoughtful transitions and hover states
- **Professional Aesthetic**: Clean, modern, automotive-industry appropriate

---

## 🎨 Color System

### Background Hierarchy

```css
/* True blacks with improved contrast steps */
--background-primary: #000000;        /* Main app background */
--background-secondary: #141414;      /* Slightly elevated (8% brightness) */
--background-tertiary: #1f1f1f;       /* Cards and surfaces (12% brightness) */
--background-elevated: #2a2a2a;       /* Modals, dropdowns (16% brightness) */
--background-hover: #333333;          /* Hover states (20% brightness) */
```

### Brand Colors

```css
/* Primary - Electric Blue */
--brand-primary: #3b82f6;             /* Primary actions, links */
--brand-primary-hover: #2563eb;       /* Hover state */
--brand-primary-muted: #1e40af;       /* Pressed state */

/* Status Colors - Optimized for dark backgrounds */
--status-success: #10b981;            /* Available, success */
--status-warning: #f59e0b;            /* Pending, warning */
--status-danger: #ef4444;             /* Error, urgent */
--status-info: #3b82f6;               /* Information */
```

### Text Colors

```css
/* High contrast for readability */
--text-primary: #ffffff;              /* Primary content */
--text-secondary: #a3a3a3;            /* Secondary content */
--text-tertiary: #737373;             /* Muted content */
--text-disabled: #525252;             /* Disabled state */
--text-on-brand: #ffffff;             /* Text on blue backgrounds */
```

### Semantic Colors

```css
/* Borders and Dividers */
--border-subtle: #2a2a2a;             /* Subtle borders */
--border-default: #333333;            /* Default borders */
--border-strong: #404040;             /* Emphasized borders */

/* Interactive States */
--focus-ring: #3b82f6;                /* Focus indicators */
--selection: rgba(59, 130, 246, 0.3); /* Text selection */
```

---

## 📝 Typography

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
```

### Type Scale
```css
/* Headings */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Text Hierarchy
- **Page Titles**: text-3xl, font-bold, text-primary
- **Section Headers**: text-2xl, font-semibold, text-primary
- **Card Titles**: text-lg, font-semibold, text-primary
- **Body Text**: text-base, font-normal, text-primary
- **Secondary Text**: text-sm, font-normal, text-secondary
- **Captions**: text-xs, font-normal, text-tertiary

---

## 🧩 Component Patterns

### Cards
```css
/* Subtle borders enhance visual definition */
.card {
  background: var(--background-tertiary); /* #1f1f1f */
  border: 1px solid var(--border-subtle); /* #2a2a2a */
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--background-hover); /* #333333 */
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--brand-primary);
  color: var(--text-on-brand);
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--brand-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--background-hover);
}
```

### Tables
```css
/* Clean data presentation like the vehicle inventory */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-default);
}

.table-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.2s ease;
}

.table-row:hover {
  background: var(--background-hover);
}
```

### Status Badges
```css
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-active {
  background: var(--brand-primary);
  color: var(--text-on-brand);
}

.badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: var(--status-success);
}
```

### Forms
```css
.input {
  background: var(--background-secondary);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--brand-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

---

## 📐 Layout & Spacing

### Spacing Scale
Based on 4px unit (0.25rem)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Border Radius
```css
--radius-sm: 0.25rem;   /* 4px - Buttons, inputs */
--radius-md: 0.375rem;  /* 6px - Cards */
--radius-lg: 0.5rem;    /* 8px - Modals */
--radius-xl: 0.75rem;   /* 12px - Large cards */
--radius-full: 9999px;  /* Pills, badges */
```

---

## ✨ Visual Effects

### Shadows
```css
/* Subtle shadows for depth */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);

/* Glow effects for interactive elements */
--glow-blue: 0 0 20px rgba(59, 130, 246, 0.4);
```

### Transitions
```css
/* Consistent timing functions */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* Standard transitions */
--transition-colors: color, background-color, border-color 200ms ease;
--transition-transform: transform 200ms ease;
--transition-all: all 200ms ease;
```

### Overlays
```css
/* For modals and dropdowns */
--overlay-backdrop: rgba(0, 0, 0, 0.8);
--overlay-gradient: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8));
```

---

## 🔄 Interactive States

### Hover States
- Buttons: Slight brightness increase + subtle shadow
- Cards: Background lightens + small Y translation
- Links: Color brightens
- Table rows: Background highlight

### Focus States
- 3px blue outline with slight glow
- Never remove focus indicators
- High contrast for accessibility

### Active States
- Slightly darker background
- Reduced shadow
- Small scale reduction (0.98)

### Disabled States
- 50% opacity
- No hover effects
- Cursor: not-allowed

### Text Selection
- Light mode: Blue background (#3b82f6) with white text
- Dark mode: Light blue background (#60a5fa) with black text for maximum contrast
- Ensures selected text is always clearly visible
- Applied globally to all text, inputs, and textareas

```css
/* Text selection styles */
::selection {
  background-color: #3b82f6;
  color: #ffffff;
}

.dark ::selection {
  background-color: #60a5fa;
  color: #000000;
}

/* Input and textarea specific */
input::selection,
textarea::selection {
  background-color: #3b82f6;
  color: #ffffff;
}

.dark input::selection,
.dark textarea::selection {
  background-color: #60a5fa;
  color: #000000;
}
```

---

## 📱 Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile Considerations
- Increase tap targets to 44px minimum
- Reduce padding on small screens
- Stack elements vertically
- Simplify navigation to hamburger menu

---

## ✅ Implementation Checklist

When implementing new UI:
1. [ ] Use the correct background hierarchy
2. [ ] Apply proper text color based on importance
3. [ ] Use 4px spacing units
4. [ ] Add smooth transitions
5. [ ] Ensure proper hover/focus states
6. [ ] Test in both light and dark modes
7. [ ] Verify mobile responsiveness
8. [ ] Check accessibility contrast ratios

---

## 🚫 What to Avoid

- Heavy or thick borders (keep them subtle at 1px)
- Pure white (#FFFFFF) on dark backgrounds (use #FAFAFA)
- Harsh shadows (keep them subtle)
- Abrupt transitions (always smooth)
- Inconsistent spacing (stick to the scale)
- Too many colors (maintain the minimal palette)
- Small tap targets on mobile
- Missing focus indicators
- Inconsistent border usage (all cards should have subtle borders)

---

## 🎯 Quick Reference

### Common Combinations
- **Primary CTA**: bg-[#3b82f6] text-white hover:bg-[#2563eb]
- **Secondary Button**: bg-[#141414] text-gray-100 hover:bg-[#1f1f1f]
- **Card**: bg-[#1f1f1f] border border-[#2a2a2a] p-6 rounded-lg
- **Input**: bg-[#141414] border-[#2a2a2a] focus:border-[#3b82f6]
- **Badge Active**: bg-[#3b82f6]/20 text-[#3b82f6] px-3 py-1 rounded-full

### CSS Custom Properties to Use
```css
/* In components */
background: var(--background-tertiary); /* #1f1f1f */
color: var(--text-primary); /* #ffffff */
border: 1px solid var(--border-subtle); /* #2a2a2a */
border-radius: var(--radius-md); /* 0.375rem */
padding: var(--space-6); /* 1.5rem */
transition: var(--transition-all); /* all 0.2s ease */
```

### Border Usage Guidelines
- **All cards and containers**: Use `border border-[#2a2a2a]`
- **Interactive elements**: Use `border border-[#2a2a2a]` with hover states
- **Dividers**: Use `border-b border-[#2a2a2a]/30` for subtle separation
- **Focus states**: Use `border-[#3b82f6]` for active/focused elements
- **Dropdowns**: Use `border-[#333333]` for elevated surfaces