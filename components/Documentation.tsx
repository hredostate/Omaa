import React from 'react';
import { Wifi, Server, Database, ShieldCheck, RefreshCw } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="space-y-8 text-slate-800 max-w-4xl mx-auto pb-10">
      
      {/* Sync Protocol & Architecture */}
      <section className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b pb-2 flex items-center gap-2">
            <Wifi className="text-blue-600" /> Offline Sync Protocol
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Database size={16} /> Idempotency Strategy
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                    To prevent duplicate trips or double-charges during flaky network conditions:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-mono">
                    <li>Client generates v4 UUIDs for all entities.</li>
                    <li>Server uses ID as primary key (UPSERT logic).</li>
                    <li>Retries with same ID = No-Op on Server.</li>
                </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <RefreshCw size={16} /> Retry Policy
                </h3>
                 <p className="text-sm text-slate-600 mb-2">
                    Exponential backoff to conserve driver battery and data:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    <li>Initial Retry: Immediate</li>
                    <li>Subsequent: 2s, 4s, 8s... max 1 hour.</li>
                    <li>Critical Events (Trip Start) > Telemetry Pings.</li>
                </ul>
            </div>
        </div>

        <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-1">API Endpoint Reference</h3>
        <div className="overflow-x-auto">
             <table className="w-full text-xs text-left border rounded">
                <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                        <th className="p-2 border">Method</th>
                        <th className="p-2 border">Endpoint</th>
                        <th className="p-2 border">Payload Structure</th>
                        <th className="p-2 border">Conflict Rule</th>
                    </tr>
                </thead>
                <tbody className="font-mono">
                    <tr>
                        <td className="p-2 border text-green-600 font-bold">POST</td>
                        <td className="p-2 border">/api/v1/sync/telemetry</td>
                        <td className="p-2 border">{`{ batchId: UUID, pings: [...] }`}</td>
                        <td className="p-2 border">Append-Only (Logs always accepted)</td>
                    </tr>
                    <tr>
                        <td className="p-2 border text-blue-600 font-bold">POST</td>
                        <td className="p-2 border">/api/v1/trips/events</td>
                        <td className="p-2 border">{`{ eventId: UUID, type: 'START', ... }`}</td>
                        <td className="p-2 border text-red-600">Server Wins (409 if status mismatch)</td>
                    </tr>
                    <tr>
                        <td className="p-2 border text-blue-600 font-bold">POST</td>
                        <td className="p-2 border">/api/v1/expenses</td>
                        <td className="p-2 border">{`{ id: UUID, amount: 5000, ... }`}</td>
                        <td className="p-2 border">Locked after Approval</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </section>

      {/* Evidence Requirements */}
      <section className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b pb-2">Evidence Requirements</h2>
        <table className="w-full text-sm text-left border rounded overflow-hidden">
            <thead className="bg-slate-100 font-bold">
                <tr><th className="p-3 border">Category</th><th className="p-3 border">Required Photo Evidence</th></tr>
            </thead>
            <tbody>
                <tr><td className="p-3 border font-bold">Fuel</td><td className="p-3 border">Pump Screen (Liters/Price) + Dashboard Odometer</td></tr>
                <tr><td className="p-3 border font-bold">Repairs (Parts)</td><td className="p-3 border">Old Part (Removed) + New Part (Boxed/Installed)</td></tr>
                <tr><td className="p-3 border font-bold">Tyres</td><td className="p-3 border">Serial Number of New Tyre + Old Tyre Condition</td></tr>
                <tr><td className="p-3 border font-bold">Towing</td><td className="p-3 border">Vehicle hooked to Tow Truck (License Plate Visible)</td></tr>
                <tr><td className="p-3 border font-bold">Emergency Cash</td><td className="p-3 border">Item Purchased or Logbook Entry</td></tr>
            </tbody>
        </table>
      </section>

      {/* Fraud Rules */}
      <section className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-red-700 border-b pb-2 flex items-center gap-2">
            <ShieldCheck /> Fraud & Anomaly Detection Rules
        </h2>
        <p className="text-sm text-slate-600 mb-4">The system automatically flags transactions based on these 20 heuristics.</p>
        
        <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded border border-red-100">
                <h3 className="font-bold text-red-800 mb-2">Critical Severity (Auto-Flag)</h3>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    <li>Fuel Liters &gt; Tank Capacity (90L)</li>
                    <li>Duplicate Receipt (Same amount &lt; 24h)</li>
                    <li>Towing Claimed without Breakdown Incident</li>
                    <li>Future Date Timestamp</li>
                    <li>Location Mismatch (&gt;5km from Route)</li>
                </ul>
            </div>
            <div className="bg-orange-50 p-4 rounded border border-orange-100">
                <h3 className="font-bold text-orange-800 mb-2">Warning Severity</h3>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    <li>Fuel Efficiency &lt; 4km/L (Excessive Consumption)</li>
                    <li>Transaction at Odd Hours (10PM - 5AM)</li>
                    <li>Tyre Replacement Frequency (&gt;1 in 30 days)</li>
                    <li>Emergency Cash &gt; ₦5,000</li>
                    <li>Multiple Police Levies in 12 hours</li>
                </ul>
            </div>
             <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">Info Severity</h3>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    <li>Weekend Fueling (Sunday)</li>
                    <li>Perfect Round Number (e.g., 10,000.00)</li>
                    <li>Servicing Cost &gt; ₦35,000</li>
                    <li>Description Length &lt; 5 characters</li>
                </ul>
            </div>
        </div>
      </section>

      {/* Approval Matrix */}
      <section className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-2">Approval Matrix</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border rounded">
                <thead className="bg-slate-100 font-bold">
                    <tr>
                        <th className="p-3 border">Amount (₦)</th>
                        <th className="p-3 border">Required Approver</th>
                        <th className="p-3 border">SLA</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="p-3 border">&lt; 5,000</td><td className="p-3 border">Auto-Approve (If no Flags)</td><td className="p-3 border">Instant</td></tr>
                    <tr><td className="p-3 border">5,000 - 50,000</td><td className="p-3 border">Transport Manager</td><td className="p-3 border">4 Hours</td></tr>
                    <tr><td className="p-3 border">&gt; 50,000</td><td className="p-3 border">School Bursar / Admin</td><td className="p-3 border">24 Hours</td></tr>
                </tbody>
            </table>
        </div>
      </section>
    </div>
  );
};

export default Documentation;