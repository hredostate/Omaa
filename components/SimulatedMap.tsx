import React from 'react';
import { Trip, TripStatus, Incident } from '../types';
import { MapPin, Bus, AlertTriangle } from 'lucide-react';

interface SimulatedMapProps {
  trips?: Trip[]; // For manager view (multiple buses)
  activeTrip?: Trip; // For driver view (single bus route)
  showUserLocation?: boolean;
}

// A simple simulated map of Lagos (Mainland to Island roughly)
// Coordinate system 0-100% for X and Y
const SimulatedMap: React.FC<SimulatedMapProps> = ({ trips, activeTrip, showUserLocation }) => {
  
  // Helper to project lat/lng to screen coords (0-100%)
  const project = (lat: number, lng: number) => {
      // Normalize Lagos coords roughly: Lat 6.4-6.7, Lng 3.3-3.5
      // These scaling factors are tuned to fit the mock points on screen
      const x = (lng - 3.3) * 500; 
      const y = 100 - (lat - 6.4) * 333; 
      return { x, y };
  };

  // Render Driver View
  if (activeTrip) {
    const completedStops = activeTrip.stops.filter(s => s.completed);
    const nextStop = activeTrip.stops.find(s => !s.completed);
    const lastPing = activeTrip.pings[activeTrip.pings.length - 1];
    
    // Use last ping for location, else interpolate
    let busX = 50;
    let busY = 50;

    if (lastPing) {
        const p = project(lastPing.location.latitude, lastPing.location.longitude);
        busX = p.x;
        busY = p.y;
    } else if (nextStop) {
        // Fallback to start position near next stop
        const p = project(nextStop.lat, nextStop.lng);
        busX = p.x;
        busY = p.y;
    }

    // Generate path points for SVG
    const pathPoints = activeTrip.stops.map(s => {
        const p = project(s.lat, s.lng);
        return `${p.x}%,${p.y}%`;
    }).join(' ');

    const hasDeviation = activeTrip.incidents.some(i => i.type === 'ROUTE_DEVIATION' && !i.resolved);

    return (
      <div className="absolute inset-0 bg-slate-200 overflow-hidden z-0">
         {/* Map Background Pattern */}
         <div className="absolute inset-0 opacity-10" 
              style={{
                  backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
              }}>
         </div>
         
         {/* Approved Route Line (Dashed) */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline 
                points={pathPoints}
                fill="none"
                stroke={hasDeviation ? "#ef4444" : "#3b82f6"} // Red if deviation
                strokeWidth="4"
                strokeDasharray="10,5"
                opacity="0.6"
            />
            {/* If there is a deviation, draw a line from route to bus */}
            {hasDeviation && nextStop && (
                <line 
                    x1={`${project(nextStop.lat, nextStop.lng).x}%`} 
                    y1={`${project(nextStop.lat, nextStop.lng).y}%`}
                    x2={`${busX}%`}
                    y2={`${busY}%`}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                />
            )}
         </svg>

         {/* Stops */}
         {activeTrip.stops.map((stop, idx) => {
             const { x, y } = project(stop.lat, stop.lng);
             return (
                 <div key={stop.id} 
                      className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg transition-colors
                      ${stop.completed ? 'bg-green-500 border-white text-white' : 'bg-white border-blue-500 text-slate-800'}`}
                      style={{ left: `${x}%`, top: `${y}%` }}>
                     {idx + 1}
                 </div>
             );
         })}

         {/* User/Bus Location */}
         <div className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse z-10 ${hasDeviation ? 'bg-red-600' : 'bg-blue-600'}`}
              style={{ 
                  left: `${busX}%`, 
                  top: `${busY}%`,
                  transition: 'all 0.5s ease-out'
              }}>
             {hasDeviation ? <AlertTriangle className="text-white w-6 h-6" /> : <Bus className="text-white w-6 h-6" />}
         </div>
      </div>
    );
  }

  // Render Manager View (All Trips)
  const activeTrips = trips?.filter(t => t.status === TripStatus.IN_PROGRESS) || [];
  
  return (
    <div className="absolute inset-0 bg-slate-200 overflow-hidden rounded-lg">
         {/* Map Texture */}
         <div className="absolute inset-0 opacity-10" 
              style={{
                  backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
              }}>
         </div>
         
         {/* Static Map Features (Rivers/Lagoon) */}
         <div className="absolute top-[60%] left-[20%] w-[60%] h-[20%] bg-blue-300 rounded-full opacity-50 blur-xl"></div>

         {/* Buses */}
         {activeTrips.map((trip) => {
             const lastPing = trip.pings[trip.pings.length - 1];
             const hasDeviation = trip.incidents.some(i => i.type === 'ROUTE_DEVIATION');
             
             // Project if ping exists, else random fallback for demo
             let bx = 30 + (parseInt(trip.id.slice(-2)) || 0);
             let by = 40 + (parseInt(trip.id.slice(-1)) || 0) * 5;

             if (lastPing) {
                const p = project(lastPing.location.latitude, lastPing.location.longitude);
                bx = p.x;
                by = p.y;
             }

             return (
                 <div key={trip.id} 
                      className="absolute group cursor-pointer"
                      style={{ left: `${bx}%`, top: `${by}%`, transition: 'all 0.5s ease-out' }}>
                     <div className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform transition hover:scale-110 ${hasDeviation ? 'bg-red-600 animate-bounce' : 'bg-indigo-600'}`}>
                        <Bus className="text-white w-5 h-5" />
                     </div>
                     <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 flex flex-col items-center">
                         <span>{trip.vehicleId} • {trip.driverId}</span>
                         {hasDeviation && <span className="text-red-300 font-bold">OFF ROUTE</span>}
                     </div>
                 </div>
             )
         })}
         
         {activeTrips.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-xl uppercase tracking-widest">
                 No Active Buses
             </div>
         )}
    </div>
  );
};

export default SimulatedMap;