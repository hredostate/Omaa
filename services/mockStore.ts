import { Trip, Driver, TripStatus, TripType, Ping, Expense, PingType, Stop, PreTripCheck, Incident, FloatRequest, SyncStatus, TripApprovalStatus, LateReason, ExpenseCategory, FraudFlag, ApiEndpoint, GeoLocation, Student, PingTrigger } from '../types';
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
      const fraudFlags = detectExpenseFraud(expense, trip, []);
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
}

export const store = new Store();
