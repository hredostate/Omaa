import { ApiEndpoint, OfflineQueueItem, SyncAuditLog } from '../types';

// Constants for Backoff
const BASE_DELAY = 1000; // 1s
const MAX_DELAY = 60 * 60 * 1000; // 1hr
const MAX_RETRIES = 10;
const BATCH_FLUSH_INTERVAL = 30000; // 30s

class SyncService {
  private queue: OfflineQueueItem[] = [];
  private telemetryBuffer: any[] = [];
  private auditLog: SyncAuditLog[] = [];
  private isProcessing = false;
  private onQueueUpdate: ((count: number) => void) | null = null;
  private networkSimulatedLatency = 800;
  private networkFailureRate = 0.3; // 30% chance of failure to simulate unstable network

  constructor() {
    // Restore queue from local storage if existing (Simulation)
    const saved = localStorage.getItem('omaa_offline_queue');
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to restore queue", e);
      }
    }

    // Start Loops
    setInterval(() => this.processQueue(), 2000); // Check queue every 2s
    setInterval(() => this.flushTelemetry(), BATCH_FLUSH_INTERVAL); // Flush pings
  }

  public setListener(cb: (count: number) => void) {
    this.onQueueUpdate = cb;
  }

  // --- Public API ---

  public enqueue(endpoint: ApiEndpoint, payload: any, priority: 'HIGH' | 'LOW' = 'LOW') {
    const item: OfflineQueueItem = {
      id: payload.id || crypto.randomUUID(), // Idempotency Key
      endpoint,
      payload,
      priority,
      attempts: 0,
      createdAt: Date.now(),
      nextRetryTime: Date.now(),
      status: 'QUEUED'
    };

    // Idempotency Check: If item with same ID exists in queue, update it or ignore
    const existingIdx = this.queue.findIndex(q => q.id === item.id);
    if (existingIdx >= 0) {
       // Log warning? For now we ignore duplicates in queue
       console.log("Duplicate Sync Item ignored:", item.id);
       return;
    }

    this.queue.push(item);
    this.saveQueue();
    this.logAudit(item.id, 'ENQUEUE', 'SUCCESS', `Added to ${priority} queue`);
  }

  public bufferTelemetry(ping: any) {
    // Add to buffer
    this.telemetryBuffer.push(ping);
  }

  public getQueueStats() {
    return {
      pending: this.queue.filter(i => i.status !== 'SUCCESS').length,
      audit: this.auditLog.slice(-5) // Last 5 logs
    };
  }

  // --- Internal Logic ---

  private saveQueue() {
    localStorage.setItem('omaa_offline_queue', JSON.stringify(this.queue));
    if (this.onQueueUpdate) {
      this.onQueueUpdate(this.queue.filter(i => i.status !== 'SUCCESS').length);
    }
  }

  private flushTelemetry() {
    if (this.telemetryBuffer.length === 0) return;

    const batch = [...this.telemetryBuffer];
    this.telemetryBuffer = [];

    const payload = {
      batchId: crypto.randomUUID(),
      timestamp: Date.now(),
      pings: batch
    };

    // Telemetry is LOW priority but batched
    this.enqueue(ApiEndpoint.TELEMETRY_BATCH, payload, 'LOW');
  }

  private async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;

    const now = Date.now();
    
    // Sort: High Priority first, then by Creation Date
    const pendingItems = this.queue
      .filter(i => i.status !== 'SUCCESS' && i.status !== 'PROCESSING' && i.nextRetryTime <= now)
      .sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority === 'LOW') return -1;
        if (a.priority === 'LOW' && b.priority === 'HIGH') return 1;
        return a.createdAt - b.createdAt;
      });

    if (pendingItems.length === 0) return;

    this.isProcessing = true;
    const item = pendingItems[0]; // Take top item
    item.status = 'PROCESSING';
    this.saveQueue();

    try {
      await this.mockNetworkRequest(item);
      
      // Success
      item.status = 'SUCCESS';
      this.logAudit(item.id, 'SYNC', 'SUCCESS', `Synced to ${item.endpoint}`);
      
      // Remove successful items to keep storage clean (or archive them)
      this.queue = this.queue.filter(i => i.id !== item.id);
      
    } catch (error: any) {
      // Failure
      item.attempts++;
      item.status = 'FAILED';
      item.lastError = error.message;

      if (error.message.includes('409')) {
        // CONFLICT: Server State differs. 
        // Rule: Server wins for state, but we log it.
        this.logAudit(item.id, 'SYNC', 'CONFLICT', `Server rejected: ${error.message}`);
        // Remove from queue because retrying won't fix a logic conflict
        this.queue = this.queue.filter(i => i.id !== item.id);
      } else if (item.attempts >= MAX_RETRIES) {
        // Dead Letter
        this.logAudit(item.id, 'SYNC', 'ERROR', `Max Retries Reached. Dropped.`);
        this.queue = this.queue.filter(i => i.id !== item.id); // Drop
      } else {
        // Exponential Backoff
        const delay = Math.min(BASE_DELAY * Math.pow(2, item.attempts), MAX_DELAY);
        item.nextRetryTime = Date.now() + delay;
        this.logAudit(item.id, 'SYNC', 'ERROR', `Failed, retry in ${delay/1000}s`);
      }
    }

    this.saveQueue();
    this.isProcessing = false;
  }

  // --- Simulated Network Layer ---
  private mockNetworkRequest(item: OfflineQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate Chaos
        if (Math.random() < this.networkFailureRate) {
           return reject(new Error("Network Timeout"));
        }

        // Simulate Specific Business Logic Validation
        if (item.endpoint === ApiEndpoint.TRIP_EVENT) {
             // Example Conflict: Trying to start a trip that is already cancelled on server
             if (item.payload.type === 'TRIP_START' && item.payload.tripId.includes('cancelled')) {
                 return reject(new Error("409 Conflict: Trip is Cancelled on Server"));
             }
        }

        resolve();
      }, this.networkSimulatedLatency);
    });
  }

  private logAudit(id: string, action: string, status: 'SUCCESS' | 'CONFLICT' | 'ERROR', details: string) {
      this.auditLog.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          action,
          status,
          details: `[${id}] ${details}`
      });
  }
}

export const syncService = new SyncService();