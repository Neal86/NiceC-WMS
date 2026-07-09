import { useState, useEffect } from 'react';
import Login from './components/Login';
import ClientPortal from './components/ClientPortal';
import WarehousePortal from './components/WarehousePortal';
import AdminPanel from './components/AdminPanel';
import { authApi } from './api';

function getRole(currentUser: any): string {
  if (!currentUser || !currentUser.role) return '';
  const role = (currentUser.role as string).toUpperCase();
  if (['CLIENT', 'CUSTOMER'].includes(role)) return 'client';
  if (['WAREHOUSE', 'OPERATOR', 'WAREHOUSE_OPERATOR'].includes(role)) return 'warehouse';
  if (['ADMIN', 'MANAGER'].includes(role)) return 'admin';
  return '';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  // Not logged in
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const role = getRole(currentUser);

  // Client role
  if (role === 'client') {
    return <ClientPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Warehouse role
  if (role === 'warehouse') {
    return <WarehousePortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Admin / Manager role
  return <AdminPanel currentUser={currentUser} onNavigateBack={handleLogout} initialPath="/admin" />;
}
