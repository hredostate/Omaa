import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from './types';
import DriverApp from './components/DriverApp';
import ManagerApp from './components/ManagerApp';
import LoginPage from './components/LoginPage';
import { LogOut, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, role, loading, signOut } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user || !role) {
    return <LoginPage />;
  }

  // Render the appropriate app based on user role
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {role === Role.DRIVER ? (
        <DriverApp driverId={user.id} />
      ) : (
        <ManagerApp />
      )}
      
      {/* Sign Out Button */}
      <div className="fixed bottom-4 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
        <button 
          onClick={signOut} 
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;