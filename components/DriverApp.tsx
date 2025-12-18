import React, { useState, useEffect, useRef } from 'react';
import { store } from '../services/mockStore';
import { syncService } from '../services/syncService';
import { Trip, TripType, PingType, TripStatus, GeoLocation, Expense, PreTripCheck, Stop, PingTrigger, SyncStatus, TripApprovalStatus, LateReason, ExpenseCategory, Student } from '../types';
import { MapPin, AlertTriangle, Fuel, DollarSign, Camera, CheckCircle, Navigation, ShieldAlert, FileText, Bus, Play, CheckSquare, XCircle, Menu, Wifi, WifiOff, ScanLine, Smartphone, UserCheck, Lock, Sun, Moon, Briefcase, PlusCircle, Clock, Wrench, RefreshCw, TriangleAlert, Shield, UserX, Users } from 'lucide-react';
import SimulatedMap from './SimulatedMap';

interface DriverAppProps {
  driverId: string;
}

type ViewState = 'SHIFT_START' | 'DASHBOARD' | 'PRE_TRIP' | 'DRIVING' | 'EXPENSE' | 'INCIDENT' | 'SUMMARY' | 'ADHOC_REQUEST';

const DriverApp: React.FC<DriverAppProps> = ({ driverId }) => {
  const [driver, setDriver] = useState(store.getDriver(driverId));
  const [activeTrip, setActiveTrip] = useState<Trip | undefined>(store.getActiveTrip(driverId));
  const [view, setView] = useState<ViewState>(!driver?.shiftStarted ? 'SHIFT_START' : (activeTrip ? 'DRIVING' : 'DASHBOARD'));
  
  const [checklist, setChecklist] = useState<PreTripCheck>({ tires: false, oil: false, lights: false, brakes: false, horn: false, timestamp: 0, odometerReading: 0 });
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(ExpenseCategory.FUEL);
  const [endOdometer, setEndOdometer] = useState<string>('');
  
  const [showManifest, setShowManifest] = useState(false);
  const [currentStopForManifest, setCurrentStopForManifest] = useState<Stop | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Identity Verification Interruption
  const [showIdentityCheck, setShowIdentityCheck] = useState(false);
  const [identityCheckStatus, setIdentityCheckStatus] = useState<'IDLE' | 'SCANNING' | 'DONE'>('IDLE');

  useEffect(() => {
    syncService.setListener(count => setPendingSyncCount(count));
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate Random Identity Check
    const timer = setInterval(() => {
        if (view === 'DRIVING' && Math.random() < 0.05 && !showIdentityCheck) {
            setShowIdentityCheck(true);
        }
    }, 60000);
    return () => { clearInterval(timer); window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [view, showIdentityCheck]);

  const refresh = () => {
    setDriver(store.getDriver(driverId));
    setActiveTrip(store.getActiveTrip(driverId));
  };

  const handleSOS = () => {
    if (!activeTrip) return;
    const confirm = window.confirm("PRESS SOS? This will alert all school managers immediately.");
    if (confirm) {
        store.sendSOS(activeTrip.id, { latitude: 6.5, longitude: 3.3, timestamp: Date.now(), speed: 0 });
        alert("SOS SENT. Stay safe. Assistance is being dispatched.");
    }
  };

  const handleIdentityVerify = () => {
      setIdentityCheckStatus('SCANNING');
      setTimeout(() => {
          setIdentityCheckStatus('DONE');
          setTimeout(() => {
              setShowIdentityCheck(false);
              setIdentityCheckStatus('IDLE');
          }, 1000);
      }, 2000);
  };

  // --- Views ---

  const renderIdentityCheck = () => (
      <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 text-center">
          <Shield size={64} className="text-blue-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Random Security Audit</h2>
          <p className="text-slate-400 mb-8">Please verify your identity to continue the trip. The map is disabled until verification.</p>
          
          <div className="w-64 h-64 bg-slate-800 rounded-full border-4 border-blue-500 overflow-hidden relative mb-8 flex items-center justify-center">
              {identityCheckStatus === 'SCANNING' ? (
                  <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                      <div className="w-full h-1 bg-blue-400 animate-bounce"></div>
                      <p className="text-blue-400 font-bold mt-2">ANALYZING...</p>
                  </div>
              ) : identityCheckStatus === 'DONE' ? (
                  <CheckCircle size={80} className="text-green-500" />
              ) : (
                  <UserCheck size={80} className="text-slate-600" />
              )}
          </div>
          
          {identityCheckStatus === 'IDLE' && (
              <button onClick={handleIdentityVerify} className="w-full max-w-xs bg-blue-600 py-4 rounded-xl font-bold text-white shadow-xl">
                  TAKE VERIFICATION SELFIE
              </button>
          )}
      </div>
  );

  const renderManifestOverlay = () => (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                  <h2 className="text-xl font-bold">Stop: {currentStopForManifest?.name}</h2>
                  <p className="text-sm text-slate-400">Student Accountability List</p>
              </div>
              <button onClick={() => setShowManifest(false)} className="text-slate-400"><XCircle size={32}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentStopForManifest?.manifest.map(student => (
                  <div key={student.id} className="bg-slate-50 border p-4 rounded-xl flex items-center justify-between shadow-sm">
                      <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.grade}</p>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => store.updateStudentStatus(activeTrip!.id, currentStopForManifest.id, student.id, 'ONBOARD')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold ${student.status === 'ONBOARD' ? 'bg-green-600 text-white' : 'bg-white border text-slate-600'}`}>ONBOARD</button>
                          <button 
                            onClick={() => store.updateStudentStatus(activeTrip!.id, currentStopForManifest.id, student.id, 'DROPPED')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold ${student.status === 'DROPPED' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>DROPPED</button>
                      </div>
                  </div>
              ))}
              {currentStopForManifest?.manifest.length === 0 && <p className="text-center text-slate-400 italic py-10">No students registered for this stop.</p>}
          </div>
          <div className="p-6 border-t">
              <button onClick={() => {
                   if (currentStopForManifest && activeTrip) {
                       store.addPing(activeTrip.id, { id: crypto.randomUUID(), type: PingType.STOP_CHECKIN, trigger: PingTrigger.MANUAL, location: { latitude: 0, longitude: 0, timestamp: Date.now() }, timestamp: Date.now(), note: currentStopForManifest.id, syncStatus: SyncStatus.PENDING });
                   }
                   setShowManifest(false);
                   refresh();
              }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">CHECK-IN & DEPART</button>
          </div>
      </div>
  );

  const renderDriving = () => {
    const nextStop = activeTrip?.stops.find(s => !s.completed);
    return (
        <div className="relative h-full w-full bg-slate-200">
             <SimulatedMap activeTrip={activeTrip} />
             
             {/* SOS Panic Button - Floating */}
             <button 
                onClick={handleSOS}
                className="absolute top-4 right-4 z-40 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white animate-pulse"
             >
                 <TriangleAlert size={32} />
             </button>

             {/* Speedometer Simulation */}
             <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                    <Navigation size={20} className="text-blue-400" />
                    <span className="text-2xl font-mono font-bold">45 <span className="text-xs">km/h</span></span>
                </div>
                <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold shadow-md ${isOnline ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
                    {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>} {isOnline ? 'LIVE' : `QUEUED (${pendingSyncCount})`}
                </div>
             </div>

             {/* Main Controls */}
             <div className="absolute bottom-0 left-0 right-0 bg-slate-900 p-6 rounded-t-3xl shadow-2xl z-30">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={() => setView('EXPENSE')} className="flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-xl font-bold text-sm">
                        <DollarSign size={18}/> EXPENSE
                    </button>
                    <button onClick={() => { setCurrentStopForManifest(nextStop || null); setShowManifest(true); }} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-900">
                        <Users size={18}/> {nextStop ? 'MANIFEST' : 'COMPLETE'}
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                     <Clock size={18} className="text-slate-500" />
                     <input type="number" className="flex-1 bg-transparent text-white font-mono text-xl outline-none" placeholder="End Odometer..." value={endOdometer} onChange={e => setEndOdometer(e.target.value)} />
                     <button onClick={() => { if(!endOdometer) return alert("Enter odometer"); store.endTrip(activeTrip!.id, { id: crypto.randomUUID(), type: PingType.STOP, trigger: PingTrigger.MANUAL, location: { latitude: 0, longitude: 0, timestamp: Date.now() }, timestamp: Date.now(), syncStatus: SyncStatus.PENDING }, parseInt(endOdometer)); setView('SUMMARY'); }} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">FINISH</button>
                 </div>
             </div>

             {showManifest && renderManifestOverlay()}
             {showIdentityCheck && renderIdentityCheck()}
        </div>
    );
  };

  if (view === 'SHIFT_START') return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-8 justify-center items-center text-center">
        <ShieldAlert size={80} className="text-blue-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Driver Shield</h1>
        <p className="text-slate-400 mb-10">Securing student transport across Nigeria.</p>
        <button onClick={() => { store.startShift(driverId); refresh(); setView('DASHBOARD'); }} className="w-full bg-blue-600 py-5 rounded-2xl text-xl font-bold shadow-2xl">
            INITIALIZE SHIFT
        </button>
    </div>
  );

  if (view === 'DASHBOARD') return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-2xl font-bold">{driver?.name}</h1>
                <p className="text-blue-400 font-bold uppercase text-xs tracking-widest">{driver?.vehicleId}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-right">
                <p className="text-[10px] text-emerald-500 font-bold uppercase">Balance</p>
                <p className="text-2xl font-mono font-bold text-white">₦{driver?.floatBalance.toLocaleString()}</p>
            </div>
        </div>

        <div className="space-y-4 flex-1">
            <h2 className="text-sm font-bold text-slate-500 uppercase">Today's Dispatch</h2>
            {store.getScheduledTrips(driverId).map(trip => (
                <div key={trip.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Sun className="text-yellow-500" />
                            <span className="font-bold text-lg">{trip.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-slate-400 font-mono">06:30 AM</span>
                    </div>
                    <button onClick={() => { setView('PRE_TRIP'); setActiveTrip(trip); }} className="w-full bg-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Play size={20} fill="white" /> START TRIP
                    </button>
                </div>
            ))}
        </div>
    </div>
  );

  if (view === 'PRE_TRIP') return (
    <div className="flex flex-col h-full bg-white text-slate-800">
        <div className="p-6 bg-slate-900 text-white">
            <h1 className="text-2xl font-bold">Bus-01 Readiness</h1>
            <p className="text-slate-400">Complete safety checklist to start.</p>
        </div>
        <div className="flex-1 p-6 space-y-3 overflow-y-auto">
             {(['tires', 'oil', 'lights', 'brakes', 'horn'] as const).map(item => (
                  <div key={item} onClick={() => setChecklist(p => ({...p, [item]: !p[item]}))} className={`p-5 rounded-2xl border-2 flex items-center justify-between ${checklist[item] ? 'border-green-600 bg-green-50' : 'border-slate-100'}`}>
                      <span className="font-bold capitalize text-lg">{item}</span>
                      {checklist[item] && <CheckCircle className="text-green-600" />}
                  </div>
             ))}
             <div className="bg-slate-50 p-5 rounded-2xl border">
                 <p className="text-xs font-bold text-slate-500 uppercase mb-2">Odometer Reading</p>
                 <input type="number" value={checklist.odometerReading || ''} onChange={e => setChecklist({...checklist, odometerReading: parseInt(e.target.value)})} className="w-full text-3xl font-mono border-b-2 bg-transparent outline-none focus:border-blue-500" placeholder="000000" />
             </div>
        </div>
        <div className="p-6">
            <button onClick={() => { store.startTrip(activeTrip!, { id: crypto.randomUUID(), type: PingType.START, trigger: PingTrigger.MANUAL, location: { latitude: 0, longitude: 0, timestamp: Date.now() }, timestamp: Date.now(), syncStatus: SyncStatus.PENDING }, checklist); refresh(); setView('DRIVING'); }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">READY TO DRIVE</button>
        </div>
    </div>
  );

  if (view === 'DRIVING') return renderDriving();
  if (view === 'EXPENSE') return (
      <div className="flex flex-col h-full bg-slate-50 p-6">
          <h1 className="text-2xl font-bold mb-6">Log Trip Expense</h1>
          <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                  <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as any)} className="w-full bg-slate-100 p-4 rounded-xl font-bold">
                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Amount (₦)</label>
                  <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full text-4xl font-mono font-bold border-b-4 outline-none pb-2 focus:border-blue-600" placeholder="0.00" />
              </div>
              <button className="w-full bg-slate-900 text-white py-10 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2">
                  <Camera size={40} />
                  <span className="font-bold">CAPTURE RECEIPT</span>
              </button>
          </div>
          <div className="mt-auto flex gap-4">
              <button onClick={() => setView('DRIVING')} className="flex-1 py-4 font-bold text-slate-500">CANCEL</button>
              <button onClick={() => { store.addExpense({ id: crypto.randomUUID(), tripId: activeTrip!.id, driverId, type: expenseCategory, amount: parseInt(expenseAmount), description: 'Log', timestamp: Date.now(), verified: false, status: 'PENDING', captureMethod: 'CAMERA' }); setView('DRIVING'); }} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-xl">SUBMIT</button>
          </div>
      </div>
  );

  return <div className="p-10 text-center">Summary Screen (Redirecting...)</div>;
};

export default DriverApp;
