import { Trip, Driver, Vehicle, TripStatus, TripType, Ping, Expense, PingType, Stop, PreTripCheck, Incident, FloatRequest, SyncStatus, TripApprovalStatus, LateReason, ExpenseCategory, FraudFlag, ApiEndpoint, GeoLocation, Student, PingTrigger } from '../types';
import { detectExpenseFraud } from './fraudDetectionService';
import { syncService } from './syncService';

const MOCK_STUDENTS: Student[] = [
    { id: 'st1', name: 'Zainab Ahmed', grade: 'JSS 1', status: 'WAITING' },
    { id: 'st2', name: 'Chidi Okafor', grade: 'Primary 4', status: 'WAITING' },
    { id: 'st3', name: 'Babatunde Junior', grade: 'SS 2', status: 'WAITING' },
    { id: 'st4', name: 'Sarah Peters', grade: 'JSS 3', status: 'WAITING' },
];

const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Emeka Okonkwo', phone: '08012345678', floatBalance: 15000, vehicleId: 'BUS-01', boundDeviceId: 'device-123', shiftStarted: 0 },
  { id: 'd2', name: 'Tunde Bakare', phone: '08098765432', floatBalance: 5000, vehicleId: 'BUS-04', boundDeviceId: 'device-456' },
];

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'BUS-01', plateNumber: 'LAG-123-XY', make: 'Toyota', model: 'Coaster', year: 2020, capacity: 30, qrCode: 'QR-BUS-01-SECURE-HASH', status: 'ACTIVE' },
  { id: 'BUS-04', plateNumber: 'LAG-456-AB', make: 'Mercedes', model: 'Sprinter', year: 2019, capacity: 25, qrCode: 'QR-BUS-04-SECURE-HASH', status: 'ACTIVE' },
];

const MOCK_VEHICLE_QR_CODES: Record<string, string> = {
    'BUS-01': 'QR-BUS-01-SECURE-HASH',
    'BUS-04': 'QR-BUS-04-SECURE-HASH',
};

const MOCK_STOPS: Stop[] = [
  { id: 's1', name: 'Ikeja City Mall', lat: 6.6018, lng: 3.3515, completed: false, scheduledTime: '06:45 AM', manifest: [...MOCK_STUDENTS] },
  { id: 's2', name: 'Maryland Junction', lat: 6.5768, lng: 3.3653, completed: false, scheduledTime: '07:10 AM', manifest: [] },
  { id: 's3', name: 'Yaba Tech', lat: 6.5176, lng: 3.3752, completed: false, scheduledTime: '07:40 AM', manifest: [] },
];

class Store {
  drivers: Driver[] = MOCK_DRIVERS;
  vehicles: Vehicle[] = MOCK_VEHICLES;
  trips: Trip[] = [];
  floatRequests: FloatRequest[] = [];
  pendingExpenses: Expense[] = [];

  getDriver(id: string) { return this.drivers.find(d => d.id === id); }
  verifyVehicleQr(vehicleId: string, scannedData: string): boolean { return MOCK_VEHICLE_QR_CODES[vehicleId] === scannedData; }

  startShift(driverId: string) {
      const driver = this.drivers.find(d => d.id === driverId);
      if (driver) {
          driver.shiftStarted = Date.now();
          syncService.enqueue(ApiEndpoint.TELEMETRY_BATCH, { id: crypto.randomUUID(), type: 'SHIFT_START', driverId, timestamp: Date.now() });
      }
  }

  getActiveTrip(driverId: string) { return this.trips.find(t => t.driverId === driverId && t.status === TripStatus.IN_PROGRESS); }

  getScheduledTrips(driverId: string): Trip[] {
      const now = Date.now();
      const morningTrip: Trip = {
       id: `t-sched-am-${new Date().toDateString()}`,
       driverId,
       vehicleId: this.getDriver(driverId)?.vehicleId || 'BUS-XX',
       type: TripType.MORNING_RUN,
       status: TripStatus.SCHEDULED,
       approvalStatus: TripApprovalStatus.NONE,
       scheduledStartTime: new Date().setHours(6, 30, 0, 0),
       pings: [],
       expenses: [],
       stops: [...MOCK_STOPS],
       incidents: [],
       estimatedDistanceKm: 0
      };
      return [morningTrip];
  }

  startTrip(trip: Trip, startPing: Ping, checklist: PreTripCheck, lateReason?: LateReason): Trip {
    const newTrip: Trip = { ...trip, status: TripStatus.IN_PROGRESS, startTime: startPing.timestamp, pings: [startPing], preTripCheck: checklist, startOdometer: checklist.odometerReading, lateReason };
    this.trips.unshift(newTrip);
    syncService.enqueue(ApiEndpoint.TRIP_EVENT, { id: crypto.randomUUID(), tripId: newTrip.id, type: 'TRIP_START', timestamp: Date.now(), odometer: checklist.odometerReading, checklist, lateReason }, 'HIGH');
    syncService.bufferTelemetry(startPing);
    return newTrip;
  }

  updateStudentStatus(tripId: string, stopId: string, studentId: string, status: Student['status']) {
      const trip = this.trips.find(t => t.id === tripId);
      if (trip) {
          const stop = trip.stops.find(s => s.id === stopId);
          const student = stop?.manifest.find(st => st.id === studentId);
          if (student) {
              student.status = status;
              syncService.enqueue(ApiEndpoint.TRIP_EVENT, { id: crypto.randomUUID(), tripId, type: 'MANIFEST_UPDATE', studentId, status }, 'HIGH');
          }
      }
  }

  sendSOS(tripId: string, location: GeoLocation) {
      const trip = this.trips.find(t => t.id === tripId);
      if (trip) {
          const sosIncident: Incident = { id: crypto.randomUUID(), type: 'SOS', description: 'DRIVER EMERGENCY PANIC BUTTON PRESSED', timestamp: Date.now(), resolved: false, location, isHighPriority: true };
          trip.incidents.push(sosIncident);
          syncService.enqueue(ApiEndpoint.TRIP_EVENT, { id: crypto.randomUUID(), tripId, type: 'SOS_ALERT', payload: sosIncident }, 'HIGH');
          const ping: Ping = { id: crypto.randomUUID(), type: PingType.SOS, trigger: PingTrigger.MANUAL, location, timestamp: Date.now(), syncStatus: SyncStatus.PENDING };
          trip.pings.push(ping);
          syncService.bufferTelemetry(ping);
      }
  }

  addPing(tripId: string, ping: Ping) {
    const trip = this.trips.find(t => t.id === tripId);
    if (trip) {
      trip.pings.push(ping);
      if (ping.type === PingType.STOP_CHECKIN && ping.note) {
        const stop = trip.stops.find(s => s.id === ping.note);
        if (stop) stop.completed = true;
      }
    }
    syncService.bufferTelemetry({ ...ping, tripId });
  }

  reportIncident(tripId: string, type: Incident['type'], description: string, location?: GeoLocation) {
      const trip = this.trips.find(t => t.id === tripId);
      if (trip) {
          const incident: Incident = { id: crypto.randomUUID(), type, description, timestamp: Date.now(), resolved: false, location };
          trip.incidents.push(incident);
          syncService.enqueue(ApiEndpoint.TRIP_EVENT, { id: crypto.randomUUID(), tripId, type: 'INCIDENT_REPORT', payload: incident }, 'HIGH');
      }
  }

  addExpense(expense: Expense) {
    const trip = this.trips.find(t => t.id === expense.tripId);
    if (trip) {
      const fraudFlags = detectExpenseFraud(expense, trip, this.pendingExpenses);
      const enrichedExpense = { ...expense, fraudAnalysis: fraudFlags };
      trip.expenses.push(enrichedExpense);
      this.pendingExpenses.push(enrichedExpense);
      syncService.enqueue(ApiEndpoint.EXPENSE_CREATE, enrichedExpense, 'HIGH');
    }
  }

  endTrip(tripId: string, endPing: Ping, finalOdometer: number) {
    const trip = this.trips.find(t => t.id === tripId);
    if (trip) {
      trip.status = TripStatus.COMPLETED;
      trip.endTime = endPing.timestamp;
      trip.pings.push(endPing);
      trip.endOdometer = finalOdometer;
      syncService.enqueue(ApiEndpoint.TRIP_EVENT, { id: crypto.randomUUID(), tripId, type: 'TRIP_END', timestamp: Date.now(), finalOdometer }, 'HIGH');
    }
  }

  getAllTrips() { return this.trips; }
  getPendingFloatRequests() { return this.floatRequests.filter(r => r.status === 'PENDING'); }
  getPendingTripRequests() { return this.trips.filter(t => t.approvalStatus === TripApprovalStatus.PENDING); }
  getPendingExpenses() { return this.pendingExpenses.filter(e => e.status === 'PENDING'); }

  approveFloatRequest(id: string) {
    const req = this.floatRequests.find(r => r.id === id);
    if (req) req.status = 'APPROVED';
  }

  approveExpense(id: string) {
    const exp = this.pendingExpenses.find(e => e.id === id);
    if (exp) exp.status = 'APPROVED';
  }

  rejectExpense(id: string) {
    const exp = this.pendingExpenses.find(e => e.id === id);
    if (exp) exp.status = 'REJECTED';
  }

  rejectFloatRequest(id: string) {
    const req = this.floatRequests.find(r => r.id === id);
    if (req) req.status = 'REJECTED';
  }

  // ===== DRIVER CRUD OPERATIONS =====
  getAllDrivers(): Driver[] {
    return this.drivers;
  }

  createDriver(driver: Omit<Driver, 'id'>): Driver {
    const newDriver: Driver = {
      ...driver,
      id: `d${Date.now()}`,
      shiftStarted: 0,
    };
    this.drivers.push(newDriver);
    return newDriver;
  }

  updateDriver(id: string, updates: Partial<Omit<Driver, 'id'>>): Driver | null {
    const driver = this.drivers.find(d => d.id === id);
    if (!driver) return null;
    Object.assign(driver, updates);
    return driver;
  }

  deleteDriver(id: string): boolean {
    const activeTrip = this.trips.find(t => t.driverId === id && t.status === TripStatus.IN_PROGRESS);
    if (activeTrip) {
      throw new Error('Cannot delete driver with active trip');
    }
    const index = this.drivers.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.drivers.splice(index, 1);
    return true;
  }

  // ===== VEHICLE CRUD OPERATIONS =====
  getAllVehicles(): Vehicle[] {
    return this.vehicles;
  }

  getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  createVehicle(vehicle: Omit<Vehicle, 'id' | 'qrCode'>): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: vehicle.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '-'),
      qrCode: `QR-${vehicle.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${Date.now()}`,
      status: 'ACTIVE',
    };
    this.vehicles.push(newVehicle);
    MOCK_VEHICLE_QR_CODES[newVehicle.id] = newVehicle.qrCode;
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Omit<Vehicle, 'id' | 'qrCode'>>): Vehicle | null {
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) return null;
    Object.assign(vehicle, updates);
    return vehicle;
  }

  deleteVehicle(id: string): boolean {
    const assignedDriver = this.drivers.find(d => d.vehicleId === id);
    if (assignedDriver) {
      throw new Error('Cannot delete vehicle assigned to a driver');
    }
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) return false;
    this.vehicles.splice(index, 1);
    delete MOCK_VEHICLE_QR_CODES[id];
    return true;
  }

  // ===== TRIP CRUD OPERATIONS =====
  getTrip(id: string): Trip | undefined {
    return this.trips.find(t => t.id === id);
  }

  updateTrip(id: string, updates: Partial<Omit<Trip, 'id'>>): Trip | null {
    const trip = this.trips.find(t => t.id === id);
    if (!trip) return null;
    Object.assign(trip, updates);
    return trip;
  }

  cancelTrip(id: string): boolean {
    const trip = this.trips.find(t => t.id === id);
    if (!trip) return false;
    if (trip.status === TripStatus.COMPLETED) {
      throw new Error('Cannot cancel completed trip');
    }
    trip.status = TripStatus.CANCELLED;
    return true;
  }

  // ===== INCIDENT CRUD OPERATIONS =====
  resolveIncident(tripId: string, incidentId: string): boolean {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return false;
    const incident = trip.incidents.find(i => i.id === incidentId);
    if (!incident) return false;
    incident.resolved = true;
    return true;
  }

  deleteIncident(tripId: string, incidentId: string): boolean {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return false;
    const index = trip.incidents.findIndex(i => i.id === incidentId);
    if (index === -1) return false;
    trip.incidents.splice(index, 1);
    return true;
  }
}

export const store = new Store();
