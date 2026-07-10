import { Outlet } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import ClientHeader from './ClientHeader';
import { LogOut, HelpCircle, Bell, Download, User, ChevronDown } from 'lucide-react';

interface ClientPortalLayoutProps {
  currentUser: any;
  onLogout: () => void;
}

export default function ClientPortalLayout({ currentUser, onLogout }: ClientPortalLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f0f2f5]">
      <ClientHeader currentUser={currentUser} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <ClientSidebar onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f2f5]">
          <div className="p-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
