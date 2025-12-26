# Admin CRUD Operations Documentation

This document describes the complete CRUD (Create, Read, Update, Delete) operations available to admin/manager users in the Omaa Transport Manager application.

## Overview

Managers (admin users) have access to a comprehensive Admin Panel with full CRUD capabilities for managing:
- **Drivers** - Create, edit, view, and delete driver records
- **Vehicles** - Create, edit, view, and delete vehicle records  
- **Approvals** - Review and approve/reject expenses and float requests

## Authentication & Authorization

### Roles
The application supports two roles:
- `DRIVER` - Access to driver dashboard with trip management
- `MANAGER` - Access to manager dashboard with fleet overview AND admin panel

### Access Control
- Admin Panel is only accessible to users with `MANAGER` role
- All admin operations are performed through the authenticated context
- Role-based access is enforced at the UI level via the AuthContext

## Admin Panel Features

### 1. Driver Management

#### List Drivers
- View all drivers in the system
- Display: Name, Phone, Vehicle Assignment, Float Balance
- Real-time updates every 3 seconds

#### Create Driver
**Required Fields:**
- Name (text)
- Phone (text, format: 080XXXXXXXX)
- Vehicle ID (dropdown selection from available vehicles)
- Float Balance (number, in Naira)

**Validations:**
- All fields are required
- Phone number format validation
- Vehicle must exist in the system

**Code Example:**
```typescript
store.createDriver({
  name: 'John Doe',
  phone: '08012345678',
  vehicleId: 'BUS-01',
  floatBalance: 15000,
});
```

#### Update Driver
- Edit any driver field except ID
- Update float balance
- Reassign to different vehicle
- Change contact information

**Code Example:**
```typescript
store.updateDriver('d1', {
  name: 'Updated Name',
  floatBalance: 20000,
});
```

#### Delete Driver
**Constraints:**
- Cannot delete driver with active trip (IN_PROGRESS status)
- Permanent deletion from the system
- Confirmation dialog required

**Code Example:**
```typescript
try {
  store.deleteDriver('d1');
} catch (err) {
  // Error: "Cannot delete driver with active trip"
}
```

### 2. Vehicle Management

#### List Vehicles
- View all vehicles in the system
- Display: Plate Number, Make/Model, Year, Capacity, Status
- Status indicators: ACTIVE (green), MAINTENANCE (yellow), RETIRED (red)

#### Create Vehicle
**Required Fields:**
- Plate Number (text, unique identifier)
- Make (text, e.g., "Toyota")
- Model (text, e.g., "Coaster")
- Year (number)
- Capacity (number of seats)
- Status (dropdown: ACTIVE, MAINTENANCE, RETIRED)

**Auto-generated:**
- Vehicle ID (derived from plate number)
- QR Code (unique security code for driver verification)

**Code Example:**
```typescript
store.createVehicle({
  plateNumber: 'LAG-123-XY',
  make: 'Toyota',
  model: 'Coaster',
  year: 2020,
  capacity: 30,
});
```

#### Update Vehicle
- Edit vehicle details
- Update status (e.g., move to MAINTENANCE)
- Update maintenance date
- Cannot change plate number (ID) or QR code

**Code Example:**
```typescript
store.updateVehicle('BUS-01', {
  status: 'MAINTENANCE',
  lastMaintenanceDate: Date.now(),
});
```

#### Delete Vehicle
**Constraints:**
- Cannot delete vehicle assigned to any driver
- Permanent deletion from the system
- Confirmation dialog required

**Code Example:**
```typescript
try {
  store.deleteVehicle('BUS-01');
} catch (err) {
  // Error: "Cannot delete vehicle assigned to a driver"
}
```

### 3. Approvals Management

#### Expense Approvals

**View Pending Expenses:**
- List all expenses with PENDING status
- Display: Amount, Category, Description, Trip ID, Driver ID
- Show fraud analysis flags if present
- Timestamp of expense creation

**Approve Expense:**
```typescript
store.approveExpense(expenseId);
```
- Changes status from PENDING to APPROVED
- Removes from pending queue
- No further action required

**Reject Expense:**
```typescript
store.rejectExpense(expenseId);
```
- Changes status from PENDING to REJECTED
- Requires confirmation dialog
- Permanent decision

**Fraud Detection:**
- Expenses may have fraud analysis flags
- Displayed with severity levels: INFO, WARN, CRITICAL
- Shows friendly explanation for each flag
- Manager should review carefully before approval

#### Float Request Approvals

**View Pending Float Requests:**
- List all float requests with PENDING status
- Display: Amount, Reason, Driver ID, Timestamp

**Approve Float Request:**
```typescript
store.approveFloatRequest(requestId);
```
- Changes status to APPROVED
- In production, would trigger fund transfer

**Reject Float Request:**
```typescript
store.rejectFloatRequest(requestId);
```
- Changes status to REJECTED
- Requires confirmation dialog

### 4. Trip Management (Advanced)

**Update Trip:**
```typescript
store.updateTrip(tripId, {
  notes: 'Special instructions',
  approvalStatus: TripApprovalStatus.APPROVED,
});
```

**Cancel Trip:**
```typescript
store.cancelTrip(tripId);
```
- Cannot cancel completed trips
- Sets status to CANCELLED

**Resolve Incident:**
```typescript
store.resolveIncident(tripId, incidentId);
```
- Marks incident as resolved
- Removes from active alerts

**Delete Incident:**
```typescript
store.deleteIncident(tripId, incidentId);
```
- Permanently removes incident record

## User Interface Components

### Admin Panel Layout
- **Tab Navigation**: Drivers | Vehicles | Approvals
- **Action Buttons**: Create, Edit, Delete with appropriate icons
- **Data Tables**: Sortable, with inline actions
- **Modal Forms**: Create/Edit forms overlay the main view
- **Toast Notifications**: Success/Error messages (5s timeout for errors, 3s for success)

### Form Validation
- Required field indicators (*)
- Real-time validation feedback
- Disabled submit until valid
- Clear error messages

### Confirmation Dialogs
All destructive actions (delete, reject) require confirmation:
- Clear warning message
- "Are you sure?" prompt
- Two-step confirmation for safety

### Success/Error Handling
**Success Messages:**
- "Driver created successfully"
- "Vehicle updated successfully"
- "Expense approved"

**Error Messages:**
- "Cannot delete driver with active trip"
- "Cannot delete vehicle assigned to a driver"
- "Please fill all required fields"

## Data Integrity & Edge Cases

### Driver Management
✅ **Handled:**
- Cannot delete driver with active trips
- Automatic ID generation
- Float balance validation (non-negative)
- Vehicle assignment validation

### Vehicle Management
✅ **Handled:**
- Cannot delete vehicle assigned to driver
- Unique plate number enforcement (via ID generation)
- Auto-generated QR codes
- Status transitions (ACTIVE → MAINTENANCE → RETIRED)

### Approval Management
✅ **Handled:**
- Fraud detection integration
- Multiple fraud flags per expense
- Pending state management
- Status transitions are one-way (cannot undo approval/rejection)

### Trip Management
✅ **Handled:**
- Cannot cancel completed trips
- Incident resolution tracking
- Multiple incidents per trip
- SOS incidents highlighted as high priority

## Testing

### Manual Testing Checklist

#### Driver CRUD
- [ ] Create new driver with all fields
- [ ] Update driver information
- [ ] Reassign driver to different vehicle
- [ ] Delete driver (should succeed when no active trips)
- [ ] Attempt to delete driver with active trip (should fail)
- [ ] View driver list refreshes automatically

#### Vehicle CRUD
- [ ] Create new vehicle with unique plate
- [ ] Update vehicle status to MAINTENANCE
- [ ] Update vehicle back to ACTIVE
- [ ] Delete unassigned vehicle (should succeed)
- [ ] Attempt to delete assigned vehicle (should fail)
- [ ] Verify QR code generation

#### Approvals
- [ ] View pending expenses
- [ ] Review fraud flags on expenses
- [ ] Approve expense
- [ ] Reject expense with confirmation
- [ ] View pending float requests
- [ ] Approve float request
- [ ] Reject float request with confirmation

#### Data Integrity
- [ ] Verify real-time updates (3-second refresh)
- [ ] Test form validations
- [ ] Test error handling for invalid data
- [ ] Verify confirmation dialogs work
- [ ] Check success/error notifications display correctly

### Automated Testing
See `tests/adminCRUD.test.ts` for automated test suite.

Run in browser console:
```javascript
// After logging in as MANAGER
testAdminCRUD.runAllTests();
```

## Security Considerations

### Current Implementation
- ✅ Role-based access (MANAGER role required)
- ✅ Confirmation dialogs for destructive operations
- ✅ Data validation on all inputs
- ✅ Business logic constraints (e.g., cannot delete active resources)
- ✅ Fraud detection on expenses

### Production Recommendations
- Add audit logging for all admin operations
- Implement rate limiting on bulk operations
- Add additional authorization checks at API level
- Encrypt sensitive data (QR codes, device IDs)
- Implement soft deletes instead of hard deletes
- Add rollback capability for critical operations

## API Integration

The current implementation uses an in-memory mock store (`mockStore.ts`). For production deployment:

1. Replace mock store calls with API endpoints
2. Implement proper error handling for network failures
3. Add loading states for async operations
4. Implement pagination for large datasets
5. Add search and filter capabilities
6. Implement optimistic UI updates

## Future Enhancements

### Planned Features
- Bulk operations (import/export drivers and vehicles)
- Advanced filtering and search
- Analytics dashboard for admin metrics
- Audit trail viewer
- Role management UI (create custom roles)
- Permission granularity (separate permissions for create/edit/delete)
- Approval workflows (multi-level approvals)
- Automated notifications for pending approvals

### UI Improvements
- Keyboard shortcuts for common actions
- Drag-and-drop for reassigning drivers to vehicles
- Calendar view for vehicle maintenance scheduling
- Real-time collaboration indicators
- Mobile-responsive admin panel

## Troubleshooting

### Common Issues

**"Cannot delete driver with active trip"**
- Solution: Wait for the driver to complete their active trip, or reassign the trip to another driver first

**"Cannot delete vehicle assigned to a driver"**
- Solution: Unassign the driver first by editing the driver record and selecting a different vehicle

**Forms not submitting**
- Check that all required fields are filled
- Verify vehicle selection for driver creation
- Ensure numeric fields have valid numbers

**Changes not appearing**
- UI refreshes every 3 seconds automatically
- Try manually refreshing the browser if needed
- Check browser console for errors

## Support & Contact

For issues or questions about admin functionality:
1. Check this documentation
2. Review the test suite in `tests/adminCRUD.test.ts`
3. Inspect the implementation in `components/AdminPanel.tsx`
4. Examine the service layer in `services/mockStore.ts`

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Maintained By:** Omaa Development Team
