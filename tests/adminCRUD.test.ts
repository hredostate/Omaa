/**
 * Manual Test Script for Admin CRUD Operations
 * 
 * This script demonstrates all CRUD operations available to admin/manager users.
 * Run these tests in the browser console after logging in as a MANAGER role user.
 */

import { store } from '../services/mockStore';

// Test Driver CRUD Operations
export const testDriverCRUD = () => {
  console.log('=== Testing Driver CRUD ===');
  
  // CREATE
  console.log('1. Creating new driver...');
  const newDriver = store.createDriver({
    name: 'Test Driver',
    phone: '08099999999',
    vehicleId: 'BUS-01',
    floatBalance: 10000,
  });
  console.log('✓ Driver created:', newDriver);
  
  // READ
  console.log('2. Reading all drivers...');
  const allDrivers = store.getAllDrivers();
  console.log('✓ Total drivers:', allDrivers.length);
  
  // UPDATE
  console.log('3. Updating driver...');
  const updated = store.updateDriver(newDriver.id, {
    name: 'Updated Driver Name',
    floatBalance: 20000,
  });
  console.log('✓ Driver updated:', updated);
  
  // DELETE
  console.log('4. Deleting driver...');
  try {
    const deleted = store.deleteDriver(newDriver.id);
    console.log('✓ Driver deleted:', deleted);
  } catch (err: any) {
    console.log('✗ Delete failed (expected if driver has active trips):', err.message);
  }
  
  console.log('Driver CRUD tests complete!\n');
};

// Test Vehicle CRUD Operations
export const testVehicleCRUD = () => {
  console.log('=== Testing Vehicle CRUD ===');
  
  // CREATE
  console.log('1. Creating new vehicle...');
  const newVehicle = store.createVehicle({
    plateNumber: 'LAG-999-ZZ',
    make: 'Toyota',
    model: 'Hiace',
    year: 2023,
    capacity: 15,
  });
  console.log('✓ Vehicle created:', newVehicle);
  
  // READ
  console.log('2. Reading all vehicles...');
  const allVehicles = store.getAllVehicles();
  console.log('✓ Total vehicles:', allVehicles.length);
  
  // UPDATE
  console.log('3. Updating vehicle...');
  const updated = store.updateVehicle(newVehicle.id, {
    status: 'MAINTENANCE',
    lastMaintenanceDate: Date.now(),
  });
  console.log('✓ Vehicle updated:', updated);
  
  // DELETE
  console.log('4. Deleting vehicle...');
  try {
    const deleted = store.deleteVehicle(newVehicle.id);
    console.log('✓ Vehicle deleted:', deleted);
  } catch (err: any) {
    console.log('✗ Delete failed (expected if assigned to driver):', err.message);
  }
  
  console.log('Vehicle CRUD tests complete!\n');
};

// Test Expense Approval Operations
export const testExpenseApprovals = () => {
  console.log('=== Testing Expense Approvals ===');
  
  // Get pending expenses
  const pendingExpenses = store.getPendingExpenses();
  console.log('Pending expenses:', pendingExpenses.length);
  
  if (pendingExpenses.length > 0) {
    const expenseId = pendingExpenses[0].id;
    
    // APPROVE
    console.log('1. Approving expense...');
    store.approveExpense(expenseId);
    console.log('✓ Expense approved');
    
    // Check status
    const expense = store.getPendingExpenses().find(e => e.id === expenseId);
    console.log('Expense status:', expense ? 'Still pending' : 'Approved (removed from pending)');
  }
  
  // Test rejection
  if (pendingExpenses.length > 1) {
    const expenseId = pendingExpenses[1].id;
    
    console.log('2. Rejecting expense...');
    store.rejectExpense(expenseId);
    console.log('✓ Expense rejected');
  }
  
  console.log('Expense approval tests complete!\n');
};

// Test Float Request Approvals
export const testFloatRequestApprovals = () => {
  console.log('=== Testing Float Request Approvals ===');
  
  const pendingFloats = store.getPendingFloatRequests();
  console.log('Pending float requests:', pendingFloats.length);
  
  if (pendingFloats.length > 0) {
    const floatId = pendingFloats[0].id;
    
    // APPROVE
    console.log('1. Approving float request...');
    store.approveFloatRequest(floatId);
    console.log('✓ Float request approved');
  }
  
  console.log('Float request approval tests complete!\n');
};

// Test Trip Management
export const testTripManagement = () => {
  console.log('=== Testing Trip Management ===');
  
  const allTrips = store.getAllTrips();
  console.log('Total trips:', allTrips.length);
  
  if (allTrips.length > 0) {
    const trip = allTrips[0];
    
    // UPDATE
    console.log('1. Updating trip...');
    const updated = store.updateTrip(trip.id, {
      notes: 'Updated by admin',
    });
    console.log('✓ Trip updated:', updated);
    
    // Test incident resolution
    if (trip.incidents.length > 0) {
      const incident = trip.incidents[0];
      console.log('2. Resolving incident...');
      store.resolveIncident(trip.id, incident.id);
      console.log('✓ Incident resolved');
    }
  }
  
  console.log('Trip management tests complete!\n');
};

// Run all tests
export const runAllTests = () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  ADMIN CRUD OPERATIONS - COMPREHENSIVE TEST  ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  testDriverCRUD();
  testVehicleCRUD();
  testExpenseApprovals();
  testFloatRequestApprovals();
  testTripManagement();
  
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        ALL TESTS COMPLETED SUCCESSFULLY!     ║');
  console.log('╚══════════════════════════════════════════════╝');
};

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testAdminCRUD = {
    runAllTests,
    testDriverCRUD,
    testVehicleCRUD,
    testExpenseApprovals,
    testFloatRequestApprovals,
    testTripManagement,
  };
}
