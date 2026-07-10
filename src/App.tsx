import { useState, useEffect } from 'react';
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

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    const role = String(user.role || '').toUpperCase();
    const nextPath =
      role === 'CLIENT' ? '/client' :
      role === 'WAREHOUSE_OPERATOR' || role === 'OPERATOR' || role === 'WAREHOUSE' || role === 'WAREHOUSE_MANAGER' ? '/warehouse' :
      '/admin';
    setCurrentPath(nextPath);
    window.history.pushState({}, '', nextPath);
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setCurrentPath('/');
    window.history.pushState({}, '', '/');
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  // Not logged in
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = String(currentUser.role || '').toUpperCase();
  const isInternalRole = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR', 'OPERATOR', 'WAREHOUSE'].includes(role);

  // Client role - isolated, no switching
  if (role === 'CLIENT') {
    return <ClientPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Internal roles: check currentPath to support switching between /admin and /warehouse
  if (currentPath.startsWith('/warehouse')) {
    return <WarehousePortal currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />;
  }

  // Default to AdminPanel for all internal roles (includes /admin path)
  return (
    <AdminPanel
      currentUser={currentUser}
      initialPath={currentPath}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );
}
