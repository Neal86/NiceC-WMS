import React from 'react';
import WarehouseHeader from './warehouse/layout/WarehouseHeader';
import WarehouseSidebar from './warehouse/layout/WarehouseSidebar';
import { useWarehouseNavigation } from './warehouse/hooks/useWarehouseNavigation';

// Pages
import HomePage from './warehouse/pages/HomePage';
import OutboundFulfillmentPage from './warehouse/pages/OutboundFulfillmentPage';
import OutboundDetailPage from './warehouse/pages/OutboundDetailPage';
import StockTransferPage from './warehouse/pages/StockTransferPage';
import WaveManagementPage from './warehouse/pages/WaveManagementPage';
import InboundManagementPage from './warehouse/pages/InboundManagementPage';
import ReturnItemsPage from './warehouse/pages/ReturnItemsPage';
import WorkOrdersPage from './warehouse/pages/WorkOrdersPage';
import RelabelServicePage from './warehouse/pages/RelabelServicePage';
import ReturnInboundPage from './warehouse/pages/ReturnInboundPage';
import ReturnOutboundPage from './warehouse/pages/ReturnOutboundPage';
import ProductInventoryPage from './warehouse/pages/ProductInventoryPage';

import {
  ArrivalScanPage, PutawayPage, SecondarySortPage, ReviewVerifyPage,
  PackageReviewPage, WeighingPage, RelabelPage, ExchangeDocPage,
  ExceptionItemsPage, CutOrdersPage, TransitPage, ReportsPage,
  BoxInventoryPage, ReturnStockPage, DefectivePage, CycleCountPage,
  ProductManagementPage, LocationManagePage, ZoneManagePage,
  PackagingPage, PickingWallPage, NewProductPage, InboundClaimPage,
  InOutReportPage, InventoryReportPage, OperationReportPage,
} from './warehouse/pages/GenericWarehousePage';

interface WarehousePortalProps {
  currentUser: any;
  onLogout: () => void;
  onNavigate?: (path: string) => void;
}

const pageComponents: Record<string, React.ComponentType<any>> = {
  home: HomePage,
  outbound: OutboundFulfillmentPage,
  stockTransfer: StockTransferPage,
  waves: WaveManagementPage,
  inbound: InboundManagementPage,
  returns: ReturnItemsPage,
  workOrders: WorkOrdersPage,
  relabelService: RelabelServicePage,
  returnInbound: ReturnInboundPage,
  returnOutbound: ReturnOutboundPage,
  inventory: ProductInventoryPage,
  arrivalScan: ArrivalScanPage,
  putaway: PutawayPage,
  secondarySort: SecondarySortPage,
  reviewVerify: ReviewVerifyPage,
  packageReview: PackageReviewPage,
  weighing: WeighingPage,
  relabel: RelabelPage,
  exchangeDoc: ExchangeDocPage,
  exceptionItems: ExceptionItemsPage,
  cutOrders: CutOrdersPage,
  transit: TransitPage,
  newProduct: NewProductPage,
  inboundClaim: InboundClaimPage,
  reports: ReportsPage,
  inoutReport: InOutReportPage,
  inventoryReport: InventoryReportPage,
  operationReport: OperationReportPage,
  boxInventory: BoxInventoryPage,
  returnStock: ReturnStockPage,
  defective: DefectivePage,
  cycleCount: CycleCountPage,
  productManagement: ProductManagementPage,
  locationManage: LocationManagePage,
  zoneManage: ZoneManagePage,
  packaging: PackagingPage,
  pickingWall: PickingWallPage,
};

export default function WarehousePortal({ currentUser, onLogout }: WarehousePortalProps) {
  const { activePage, detailParams, navigate } = useWarehouseNavigation();

  const handleTopNavChange = (key: string) => navigate(key);
  const handleSidebarChange = (key: string) => navigate(key);

  const handleSwitchAdmin = () => {
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const warehouseName = currentUser?.warehouseName || currentUser?.warehouseCode || '';

  const headerProps = {
    activeTopNav: activePage,
    onTopNavChange: handleTopNavChange,
    currentUser,
    warehouseName,
    onLogout,
    onSwitchAdmin: handleSwitchAdmin,
  };

  // Detail page routing for outbound
  if (activePage === 'outbound' && detailParams?.id) {
    return (
      <div className="warehouse-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 1280, backgroundColor: '#f1f3f6' }}>
        <WarehouseHeader {...headerProps} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <WarehouseSidebar activePage={activePage} onPageChange={handleSidebarChange} />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f3f6' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <OutboundDetailPage currentUser={currentUser} onNavigate={navigate} orderId={detailParams.id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PageComponent = pageComponents[activePage];

  return (
    <div className="warehouse-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 1280, backgroundColor: '#f1f3f6' }}>
      <WarehouseHeader {...headerProps} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WarehouseSidebar activePage={activePage} onPageChange={handleSidebarChange} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f3f6' }}>
          {PageComponent ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <PageComponent currentUser={currentUser} onNavigate={navigate} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              页面加载中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
