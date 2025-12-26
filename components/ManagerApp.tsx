
import React, { useState, useEffect } from 'react';
import { store } from '../services/mockStore';
import { Trip, TripStatus, Expense, FloatRequest, TripApprovalStatus, FraudSeverity, ExpenseCategory, Incident } from '../types';
// Added TriangleAlert to the lucide-react import list
import { Map, Activity, FileText, CheckCircle, XCircle, AlertCircle, WifiOff, Clock, Calendar, ChevronRight, AlertTriangle, TriangleAlert, Info, TrendingUp, DollarSign, Download, Printer, LayoutDashboard, Bus, MapPin, StopCircle, Navigation, ShieldAlert, Users, Settings } from 'lucide-react';
import Documentation from './Documentation';
import SimulatedMap from './SimulatedMap';
import AdminPanel from './AdminPanel';

const LOGO_URL = "https://tyvufbldcucgmmlattct.supabase.co/storage/v1/object/public/Images/omaa.jpeg";

const ManagerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MAP' | 'APPROVALS' | 'ADMIN' | 'DOCS'>('DASHBOARD');
  const [trips, setTrips] = useState<Trip[]>(store.getAllTrips());
  const [expenses, setExpenses] = useState<Expense[]>(store.getPendingExpenses());
  
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setTrips([...store.getAllTrips()]);
        setExpenses(store.getPendingExpenses());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sosIncidents = trips.flatMap(t => t.incidents).filter(i => i.type === 'SOS' && !i.resolved);

  const renderDashboard = () => (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
        {/* HIGH PRIORITY ALERTS */}
        {sosIncidents.length > 0 && (
            <div className="mb-8 bg-red-600 text-white p-6 rounded-3xl shadow-2xl animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <TriangleAlert size={48} />
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Emergency SOS Alert</h2>
                        <p className="text-red-100 font-bold">Driver has activated panic button. Immediate action required.</p>
                    </div>
                </div>
                <button onClick={() => setActiveTab('MAP')} className="bg-white text-red-600 px-8 py-4 rounded-2xl font-bold shadow-xl">LOCATE BUS NOW</button>
            </div>
        )}

        <header className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Fleet Command</h2>
                <p className="text-slate-500">School Transport Ops Hub • Nigeria</p>
            </div>
            <button onClick={() => setShowReportModal(true)} className="bg-white border p-3 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-sm">
                <Download size={16} /> WEEKLY AUDIT
            </button>
        </header>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">On-Time Performance</p>
                <p className="text-3xl font-bold text-slate-800">92%</p>
                <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[92%]"></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fuel Efficiency</p>
                <p className="text-3xl font-bold text-slate-800">₦142 <span className="text-sm text-slate-400">/km</span></p>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ 4% Better than avg</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Accountability</p>
                <p className="text-3xl font-bold text-blue-600">100%</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">All children accounted for</p>
            </div>
             <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Active Anomalies</p>
                <p className="text-3xl font-bold text-red-600">{expenses.length}</p>
                <p className="text-[10px] text-red-400 font-bold mt-1">Requires manual audit</p>
            </div>
        </div>

        <section className="mb-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active Fleet Details</h3>
            <div className="grid lg:grid-cols-2 gap-4">
                {trips.filter(t => t.status === TripStatus.IN_PROGRESS).map(trip => {
                    const studentCount = trip.stops.reduce((acc, s) => acc + s.manifest.length, 0);
                    const onboardCount = trip.stops.reduce((acc, s) => acc + s.manifest.filter(st => st.status === 'ONBOARD').length, 0);
                    return (
                        <div key={trip.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                    <Bus size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{store.getDriver(trip.driverId)?.name}</h4>
                                    <p className="text-xs text-slate-500 font-mono mb-2">{trip.vehicleId} • {trip.type}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                            <Users size={12}/> {onboardCount} / {studentCount} Onboard
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                            <Navigation size={12}/> {trip.pings.length} Pings
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('MAP')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
             <img src={LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
             <h1 className="text-xl font-bold text-white tracking-tighter">Omaa <span className="text-blue-500">Ops</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('MAP')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'MAP' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                <Map size={20} /> Operational Map
            </button>
            <button onClick={() => setActiveTab('ADMIN')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'ADMIN' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                <Settings size={20} /> Admin Panel
            </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-hidden">
            {activeTab === 'DASHBOARD' && renderDashboard()}
            {activeTab === 'MAP' && <SimulatedMap trips={trips} />}
            {activeTab === 'ADMIN' && <AdminPanel />}
        </main>
      </div>
    </div>
  );
};

export default ManagerApp;
