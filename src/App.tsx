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
  if (role === 'WAREHOUSE_OPERATOR' || role === 'OPERATOR' || role === 'WAREHOUSE' || role === 'WAREHOUSE_MANAGER') {
    return <WarehousePortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Admin / Manager role
  return (
    <AdminPanel
      currentUser={currentUser}
      initialPath={currentPath}
      onLogout={handleLogout}
    />
  );
}
