import React, { useState } from 'react';
import { Role } from './types';
import DriverApp from './components/DriverApp';
import ManagerApp from './components/ManagerApp';

const App: React.FC = () => {
  // Simple state to toggle views for demonstration
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">SchoolTranspo<span className="text-blue-600">NG</span></h1>
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