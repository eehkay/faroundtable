# Inventory Management Feature Specification

## Overview

Build an admin-only inventory management interface that allows dealership administrators to view, edit, and delete vehicles from the inventory. The interface should follow the layout shown in the reference screenshots while adhering to the project's DESIGN-GUIDELINES.md.

## Feature Requirements

### 1. Inventory Table View

#### Layout
- **Header**: "Vehicles" title with subtitle "View and manage your vehicles"
- **Search Bar**: Full-width search input with placeholder "Search inventory"
- **Filter Dropdown**: Options for "All (222)", "New", "Used", "Available", "Claimed", etc.
- **Data Table**: Responsive table with horizontal scroll on mobile

#### Table Columns
| Column | Type | Description |
|--------|------|-------------|
| Select | Checkbox | For bulk operations |
| Stock | Text | Stock number |
| VIN | Text | Vehicle VIN |
| Condition | Text | New/Used |
| Year | Number | Vehicle year |
| Make | Text | Vehicle manufacturer |
| Model | Text | Vehicle model |
| Trim | Text | Trim level (optional) |
| Retail Price | Currency | MSRP/Original price |
| Selling Price | Currency | Current selling price |

#### Features
- Click any row to open edit modal
- Sortable columns (Stock #, Year, Price, etc.)
- Pagination showing "1-17 of 222" format
- Bulk select with "Select All" option
- Loading skeleton while fetching data

### 2. Vehicle Edit Modal

#### Modal Structure
```
┌─────────────────────────────────────────┐
│ [Make Year Model Trim]            [X] │
├─────────────────────────────────────────┤
│ 📄 Stock: [stock_number]               │
│ 🔑 VIN: [vin_number]                   │
│                                         │
│ ──── Pricing ────                       │
│ Retail Price *  Selling Price *         │
│ $[_____]       $[_____]                │
│                                         │
│ ──── Vehicle Details ────               │
│ Status          Condition               │
│ [Available ▼]   [New ▼]                │
│                                         │
│ Mileage         Location                │
│ [_____]        [Store Name]            │
│                                         │
│ ──── Features ────                      │
│ [+ Add Feature]                         │
│ • Feature 1 [x]                         │
│ • Feature 2 [x]                         │
│                                         │
│ ──── Notes ────                         │
│ [________________________]              │
│ [________________________]              │
│                                         │
│ ──── System Information ────            │
│ Imported: [date]                        │
│ Last Updated: [date]                    │
│ Days on Lot: [number]                   │
│                                         │
│ [Delete Vehicle] [Cancel] [Save Changes]│
└─────────────────────────────────────────┘
```

#### Editable Fields
- **Retail Price** (required, positive number - MSRP/Original price)
- **Selling Price** (required, positive number - Current selling price)
- **Status** (dropdown: available, claimed, in-transit, delivered)
- **Condition** (dropdown: new, used)
- **Mileage** (positive integer)
- **Features** (add/remove capability)
- **Notes** (text area)

#### Read-Only Fields
- Stock Number
- VIN
- Year, Make, Model, Trim
- Location
- Import Date
- Last Updated
- Days on Lot

### 3. Delete Functionality

#### Single Vehicle Delete
- Red "Delete Vehicle" button in modal footer
- Confirmation dialog: "Delete Vehicle? This action cannot be undone. This will permanently delete the vehicle and all associated data (comments, activities, etc.)"
- Cannot delete if vehicle has active transfer

#### Bulk Delete
- Select multiple vehicles via checkboxes
- "Delete Selected" button appears when items selected
- Confirmation shows count: "Delete 3 vehicles? This action cannot be undone."

### 4. Search & Filter

#### Search Functionality
- Searches across: Stock #, VIN, Make, Model
- Debounced at 300ms
- Updates URL params for shareable links
- Shows "No results found" state

#### Filter Options
- All Vehicles
- By Condition: New, Used
- By Status: Available, Claimed, In Transit, Delivered
- By Location: Store filters
- Recently Added (last 7 days)
- High Value (> $50,000)

## Technical Implementation

### Admin Dashboard Integration

#### Navigation Update
Add "Inventory Management" to the admin navigation menu:

```typescript
// In app/(authenticated)/admin/layout.tsx
const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/inventory', label: 'Inventory Management', icon: '📦' }, // NEW
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/transfers', label: 'Transfer History', icon: '🚚' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];
```

#### Access Control
Ensure only admin users can access this section:

```typescript
// In app/(authenticated)/admin/inventory/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function InventoryManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  // Page implementation
}
```

#### Dashboard Widget
Add inventory summary widget to admin dashboard home:

```typescript
// In app/(authenticated)/admin/page.tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <StatCard
    title="Total Vehicles"
    value={stats.totalVehicles}
    icon="🚗"
    href="/admin/inventory"
  />
  <StatCard
    title="Available"
    value={stats.availableVehicles}
    icon="✅"
    trend="+5 this week"
  />
  <StatCard
    title="In Transfer"
    value={stats.inTransferVehicles}
    icon="🚚"
  />
  <StatCard
    title="Low Stock Items"
    value={stats.lowStockCount}
    icon="⚠️"
    status="warning"
  />
</div>
```

### File Structure
```
app/
├── (authenticated)/
│   ├── admin/
│   │   ├── layout.tsx                    // Admin layout wrapper
│   │   ├── inventory/
│   │   │   ├── page.tsx                  // Main inventory page
│   │   │   ├── loading.tsx               // Loading skeleton
│   │   │   └── components/
│   │   │       ├── InventoryTable.tsx    // Table component
│   │   │       ├── VehicleModal.tsx      // Edit modal
│   │   │       ├── DeleteConfirmDialog.tsx
│   │   │       ├── StatusBadge.tsx       // Status indicator
│   │   │       ├── TableFilters.tsx     // Search & filters
│   │   │       └── BulkActions.tsx      // Bulk operations
│   └── api/
│       └── admin/
│           └── vehicles/
│               ├── route.ts              // GET all, DELETE bulk
│               └── [id]/
│                   └── route.ts          // GET one, PATCH, DELETE
```

### Database Schema Updates

```sql
-- Add admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for admin operations
CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (is_admin() OR true); -- Everyone can view

CREATE POLICY "Admins can update vehicles" ON vehicles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete vehicles" ON vehicles
  FOR DELETE USING (is_admin());

-- Add audit log table
CREATE TABLE vehicle_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  action VARCHAR NOT NULL, -- 'update', 'delete'
  changes JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### GET /api/admin/vehicles
Query params:
- `search`: Search term
- `status`: Filter by status
- `condition`: Filter by condition
- `page`: Page number
- `limit`: Items per page (default 50)

Response:
```json
{
  "vehicles": [...],
  "total": 222,
  "page": 1,
  "limit": 50
}
```

#### PATCH /api/admin/vehicles/[id]
Body:
```json
{
  "retailPrice": 38000,
  "sellingPrice": 36500,
  "status": "available",
  "condition": "new",
  "mileage": 15,
  "features": ["Leather Seats", "Sunroof"],
  "notes": "Excellent condition"
}
```

#### DELETE /api/admin/vehicles/[id]
- Returns 400 if vehicle has active transfer
- Logs deletion in audit table
- Soft delete option for recovery

#### DELETE /api/admin/vehicles (Bulk)
Body:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Component Examples

#### InventoryTable.tsx Structure
```typescript
interface InventoryTableProps {
  vehicles: Vehicle[];
  loading: boolean;
  onVehicleClick: (vehicle: Vehicle) => void;
  onSelectionChange: (selected: string[]) => void;
}

export function InventoryTable({ vehicles, loading, onVehicleClick, onSelectionChange }: InventoryTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'stockNumber', direction: 'asc' });

  // Table implementation following DESIGN-GUIDELINES.md
}
```

#### VehicleModal.tsx Structure
```typescript
interface VehicleModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Vehicle>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function VehicleModal({ vehicle, isOpen, onClose, onSave, onDelete }: VehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Modal implementation with form validation
}
```

### State Management

Using React hooks and Supabase real-time:
```typescript
// Custom hook for inventory management
export function useInventory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('vehicles-admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicles' },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // CRUD operations
}
```

### UI/UX Guidelines

#### Status Badge Colors
- **Available**: Green (`bg-green-100 text-green-800`)
- **Claimed**: Blue (`bg-blue-100 text-blue-800`)
- **In Transit**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Delivered**: Gray (`bg-gray-100 text-gray-800`)

#### Responsive Behavior
- **Desktop**: Full table view with all columns
- **Tablet**: Hide Trim column, combine prices
- **Mobile**: Card view with key details

#### Loading States
- Table skeleton with animated rows
- Modal shows spinner overlay during save
- Optimistic updates with rollback on error

#### Error Handling
- Toast notifications for all actions
- Form validation messages inline
- Network error recovery with retry

### Security Considerations

1. **Role Verification**
   - Check admin role in middleware
   - Verify role in API routes
   - RLS policies as final defense
   - Redirect non-admins to regular dashboard

2. **Audit Trail**
   - Log all updates with before/after values
   - Track who made changes
   - Retention policy for logs

3. **Data Validation**
   - Sanitize all inputs
   - Validate VIN format
   - Ensure price logic (selling price can be less than retail)

4. **Rate Limiting**
   - Limit bulk operations
   - Throttle API calls
   - Prevent accidental mass deletion

### Admin Dashboard Menu Structure

The inventory management section should appear in the admin dashboard with the following hierarchy:

```
Admin Dashboard
├── Overview (Dashboard home with stats)
├── Inventory Management 📦 (NEW)
│   ├── All Vehicles
│   ├── Search & Filters
│   └── Bulk Operations
├── User Management 👥
├── Transfer History 🚚
├── Reports 📊
└── Settings ⚙️
```

### Mobile Navigation
On mobile devices, the admin navigation should be accessible via a hamburger menu with the same structure. The "Inventory Management" item should be prominently placed as it will be frequently accessed.

## Implementation Checklist

- [ ] Update admin layout with navigation item
- [ ] Add access control middleware for admin routes
- [ ] Create inventory summary widget for dashboard
- [ ] Create admin layout with navigation
- [ ] Build inventory table component
- [ ] Implement search and filters
- [ ] Create vehicle edit modal
- [ ] Add form validation
- [ ] Implement single delete with confirmation
- [ ] Add bulk selection and delete
- [ ] Create API routes with proper auth
- [ ] Add RLS policies to Supabase
- [ ] Implement audit logging
- [ ] Add real-time updates
- [ ] Create loading skeletons
- [ ] Add error handling and toasts
- [ ] Test responsive design
- [ ] Add keyboard navigation
- [ ] Write unit tests for critical paths
- [ ] Document admin features

## Future Enhancements

1. **Export Functionality**
   - Export filtered results to CSV
   - Generate inventory reports

2. **Bulk Edit**
   - Update multiple vehicles at once
   - Bulk price adjustments

3. **Advanced Filters**
   - Date range filters
   - Custom saved filters
   - Complex query builder

4. **History View**
   - View audit log per vehicle
   - Restore deleted vehicles
   - Track price history

5. **Keyboard Shortcuts**
   - `Cmd/Ctrl + K` for search
   - `E` to edit selected
   - `D` to delete selected