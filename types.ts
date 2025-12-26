

export enum Role {
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER'
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TripApprovalStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TripType {
  MORNING_RUN = 'MORNING_RUN',
  AFTERNOON_RUN = 'AFTERNOON_RUN',
  EXTRACURRICULAR = 'EXTRACURRICULAR'
}

export enum LateReason {
  TRAFFIC_HEAVY = 'TRAFFIC_HEAVY',
  MECHANICAL_ISSUE = 'MECHANICAL_ISSUE',
  POLICE_CHECKPOINT = 'POLICE_CHECKPOINT',
  WAITING_FOR_STUDENTS = 'WAITING_FOR_STUDENTS',
  WEATHER_CONDITIONS = 'WEATHER_CONDITIONS',
  OTHER = 'OTHER'
}

export enum PingType {
  START = 'START',
  STOP = 'STOP',
  CHECKPOINT = 'CHECKPOINT',
  TRAFFIC = 'TRAFFIC',
  FUEL_STOP = 'FUEL_STOP',
  STOP_CHECKIN = 'STOP_CHECKIN',
  DEVIATION_ALERT = 'DEVIATION_ALERT',
  SOS = 'SOS',
  BIOMETRIC_VERIFY = 'BIOMETRIC_VERIFY'
}

export enum PingTrigger {
  MANUAL = 'MANUAL',
  DISTANCE = 'DISTANCE',
  TIMER = 'TIMER',
  GEOFENCE = 'GEOFENCE',
  SYSTEM_FORCE = 'SYSTEM_FORCE'
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  isMock?: boolean;
}

export interface Ping {
  id: string;
  type: PingType;
  trigger: PingTrigger;
  location: GeoLocation;
  timestamp: number;
  note?: string;
  batteryLevel?: number;
  syncStatus: SyncStatus;
}

export enum ExpenseCategory {
  FUEL = 'FUEL',
  REPAIR_MECHANICAL = 'REPAIR_MECHANICAL',
  REPAIR_TYRE = 'REPAIR_TYRE',
  REPAIR_BATTERY = 'REPAIR_BATTERY',
  TOWING = 'TOWING',
  TOLLS_PARKING = 'TOLLS_PARKING',
  EMERGENCY_CASH = 'EMERGENCY_CASH',
  SERVICING = 'SERVICING',
  POLICE_LEVY = 'POLICE_LEVY',
  OTHER = 'OTHER'
}

export enum FraudSeverity {
  INFO = 'INFO',
  WARN = 'WARN',
  CRITICAL = 'CRITICAL'
}

export interface FraudFlag {
  ruleId: string;
  severity: FraudSeverity;
  message: string;
  friendlyExplanation: string;
}

export interface Expense {
  id: string;
  tripId: string;
  driverId: string;
  type: ExpenseCategory;
  amount: number;
  liters?: number;
  description: string;
  proofImageUrl?: string;
  timestamp: number;
  location?: GeoLocation;
  verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  captureMethod: 'CAMERA' | 'UPLOAD'; 
  fraudAnalysis?: FraudFlag[];
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'WAITING' | 'ONBOARD' | 'DROPPED';
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  completed: boolean;
  scheduledTime: string;
  manifest: Student[];
}

export interface PreTripCheck {
  tires: boolean;
  oil: boolean;
  lights: boolean;
  brakes: boolean;
  horn: boolean;
  odometerReading: number;
  odometerPhotoUrl?: string;
  timestamp: number;
}

export interface Incident {
  id: string;
  type: 'BREAKDOWN' | 'ACCIDENT' | 'DELAY' | 'MEDICAL' | 'ROUTE_DEVIATION' | 'SOS';
  description: string;
  timestamp: number;
  resolved: boolean;
  location?: GeoLocation;
  isHighPriority?: boolean;
}

export interface FloatRequest {
  id: string;
  driverId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  type: TripType;
  status: TripStatus;
  approvalStatus: TripApprovalStatus;
  scheduledStartTime: number;
  startTime?: number;
  endTime?: number;
  pings: Ping[];
  expenses: Expense[];
  stops: Stop[];
  preTripCheck?: PreTripCheck;
  incidents: Incident[];
  estimatedDistanceKm: number;
  notes?: string;
  startOdometer?: number;
  endOdometer?: number;
  lateReason?: LateReason; 
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  floatBalance: number; 
  vehicleId: string;
  boundDeviceId?: string; 
  shiftStarted?: number; 
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  qrCode: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
  lastMaintenanceDate?: number;
}

export enum ApiEndpoint {
  TELEMETRY_BATCH = '/api/v1/sync/telemetry',
  TRIP_EVENT = '/api/v1/trips/events',
  EXPENSE_CREATE = '/api/v1/expenses',
  EXPENSE_UPLOAD = '/api/v1/upload',
  FLOAT_REQUEST = '/api/v1/floats'
}

export interface OfflineQueueItem {
  id: string;
  endpoint: ApiEndpoint;
  payload: any;
  priority: 'HIGH' | 'LOW';
  attempts: number;
  createdAt: number;
  nextRetryTime: number;
  status: 'QUEUED' | 'PROCESSING' | 'FAILED' | 'SUCCESS';
  lastError?: string;
}

// Added SyncAuditLog to resolve compilation error in syncService.ts
export interface SyncAuditLog {
  id: string;
  timestamp: number;
  action: string;
  status: 'SUCCESS' | 'CONFLICT' | 'ERROR';
  details: string;
}
