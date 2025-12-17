import React, { useState, useEffect } from 'react';
import { Role } from './types';
import DriverApp from './components/DriverApp';
import ManagerApp from './components/ManagerApp';

const LOGO_URL = "https://tyvufbldcucgmmlattct.supabase.co/storage/v1/object/public/Images/omaa.jpeg";

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate initial app loading (Splash Screen)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-4">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <img 
            src={LOGO_URL} 
            alt="Loading..." 
            className="w-full h-full rounded-full object-cover shadow-xl relative z-10 border-4 border-white animate-pulse"
          />
        </div>
        <h2 className="text-slate-500 font-bold tracking-widest text-sm animate-pulse">OMAA TRANSPORTATION</h2>
      </div>
    );
  }

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-24 h-24 mx-auto mb-6 relative">
                 <img 
                    src={LOGO_URL} 
                    alt="Omaa Logo" 
                    className="w-full h-full rounded-full object-cover shadow-lg border-2 border-slate-100"
                />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Omaa <span className="text-blue-600">Transportation</span></h1>
            <p className="text-slate-500 mb-8">Select your role to continue</p>
            
            <div className="space-y-4">
                <button 
                    onClick={() => setCurrentRole(Role.MANAGER)}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-transform hover:scale-[1.02] shadow-lg"
                >
                    Transport Manager
                </button>
                <button 
                    onClick={() => setCurrentRole(Role.DRIVER)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-transform hover:scale-[1.02] shadow-lg shadow-blue-200"
                >
                    Bus Driver
                </button>
            </div>
            
            <p className="mt-8 text-xs text-slate-400">
                v1.0.0 • Offline-First Build
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
        {currentRole === Role.DRIVER ? (
            <DriverApp driverId="d1" />
        ) : (
            <ManagerApp />
        )}
        
        {/* Quick Role Switcher for Demo */}
        <div className="fixed bottom-4 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
            <button 
                onClick={() => setCurrentRole(null)} 
                className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow"
            >
                Switch Role
            </button>
        </div>
    </div>
  );
};

export default App;