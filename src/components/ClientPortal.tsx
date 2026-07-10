import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClientPortalLayout from './client/ClientPortalLayout';
import Dashboard from './client/pages/Dashboard';
import PlatformOrders from './client/pages/PlatformOrders';
import { InboundPage, DropshipPage, TransferPage, InboundClaimPage, DefectivePage, WorkOrderPage } from './client/pages/WarehousePages';
import { ReturnsPage, TransshipmentPage } from './client/pages/ReturnsTransshipment';
import { FBAReturnInboundPage, FBAReturnRelabelPage, FBAReturnOutboundPage } from './client/pages/FBAReturns';
import { ProductInventoryPage, CartonInventoryPage, ReturnInventoryPage, CombinedInventoryPage, ProductAgingPage, CartonAgingPage, ReturnAgingPage } from './client/pages/InventoryPages';
import ProductManagement from './client/pages/ProductManagement';
import Analytics from './client/pages/Analytics';
import { MyAccount, TransactionsPage } from './client/pages/AccountPages';
import { PlatformAuthPage, OrderRulesPage, ProductMappingPage } from './client/pages/SettingsPages';
import { ClientAccountsPage, ClientRolesPage, AddressBookPage, LoginLogsPage, UnitsPage } from './client/pages/SettingsPages2';

interface ClientPortalProps {
  currentUser: { id: string; username: string; email: string; role: string; customerId?: string; avatar?: string };
  onLogout: () => void;
}

export default function ClientPortal({ currentUser, onLogout }: ClientPortalProps) {
  return (
    <BrowserRouter basename="/client">
      <Routes>
        <Route element={<ClientPortalLayout currentUser={currentUser} onLogout={onLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<PlatformOrders />} />
          <Route path="inbound" element={<InboundPage />} />
          <Route path="outbound/dropship" element={<DropshipPage />} />
          <Route path="outbound/transfer" element={<TransferPage />} />
          <Route path="inbound-claim" element={<InboundClaimPage />} />
          <Route path="defective-processing" element={<DefectivePage />} />
          <Route path="work-orders" element={<WorkOrderPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="transshipment" element={<TransshipmentPage />} />
          <Route path="fba-returns/inbound" element={<FBAReturnInboundPage />} />
          <Route path="fba-returns/relabel" element={<FBAReturnRelabelPage />} />
          <Route path="fba-returns/outbound" element={<FBAReturnOutboundPage />} />
          <Route path="inventory/products" element={<ProductInventoryPage />} />
          <Route path="inventory/cartons" element={<CartonInventoryPage />} />
          <Route path="inventory/returns" element={<ReturnInventoryPage />} />
          <Route path="inventory/combined" element={<CombinedInventoryPage />} />
          <Route path="inventory/product-aging" element={<ProductAgingPage />} />
          <Route path="inventory/carton-aging" element={<CartonAgingPage />} />
          <Route path="inventory/return-aging" element={<ReturnAgingPage />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="account/transactions" element={<TransactionsPage />} />
          <Route path="settings/platform-auth" element={<PlatformAuthPage />} />
          <Route path="settings/order-rules" element={<OrderRulesPage />} />
          <Route path="settings/product-mapping" element={<ProductMappingPage />} />
          <Route path="settings/accounts" element={<ClientAccountsPage />} />
          <Route path="settings/roles" element={<ClientRolesPage />} />
          <Route path="settings/address-book" element={<AddressBookPage />} />
          <Route path="settings/login-logs" element={<LoginLogsPage />} />
          <Route path="settings/units" element={<UnitsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
