import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import ClientPortal from './components/ClientPortal';
import WarehousePortal from './components/WarehousePortal';
import AdminPanel from './components/AdminPanel';
import { authApi } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => authApi.getCurrentUser());
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    const role = String(user.role || '').toUpperCase();
    const nextPath =
      role === 'CLIENT' ? '/client' :
      role === 'WAREHOUSE_OPERATOR' || role === 'OPERATOR' ? '/warehouse' :
      '/';
    setCurrentPath(nextPath);
    window.history.pushState({}, '', nextPath);
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setCurrentPath('/');
    window.history.pushState({}, '', '/');
  };

  // Not logged in
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = String(currentUser.role || '').toUpperCase();

  // Client role
  if (role === 'CLIENT') {
    return <ClientPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Warehouse role
  if (role === 'WAREHOUSE_OPERATOR' || role === 'OPERATOR') {
    return <WarehousePortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Admin / Manager role
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminPanel
        currentUser={currentUser}
        initialPath={currentPath}
        onNavigateBack={() => navigate('/')}
        onLogout={handleLogout}
      />
    );
  }

  // Default Admin workspace
  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome, {currentUser.email || currentUser.username}</h2>
          <p className="text-sm text-slate-500 mb-4">Role: {role}</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Admin Panel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
