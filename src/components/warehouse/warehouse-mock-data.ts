export interface MockRow {
  id: string;
  [key: string]: any;
}

const MOCK_PREFIX = 'DEMO';

const weighingRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-WE-001`, packageNo: 'PKG2407001', weight: 1.25, status: 'PENDING', carrier: 'UPS' },
  { id: `${MOCK_PREFIX}-WE-002`, packageNo: 'PKG2407002', weight: 2.30, status: 'COMPLETED', carrier: 'FEDEX' },
  { id: `${MOCK_PREFIX}-WE-003`, packageNo: 'PKG2407003', weight: 0.85, status: 'PENDING', carrier: 'USPS' },
  { id: `${MOCK_PREFIX}-WE-004`, packageNo: 'PKG2407004', weight: 3.10, status: 'COMPLETED', carrier: 'DHL' },
  { id: `${MOCK_PREFIX}-WE-005`, packageNo: 'PKG2407005', weight: 1.75, status: 'PENDING', carrier: 'UPS' },
];

const exchangeDocRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-ED-001`, docNo: 'ED2407001', oldTrackingNo: '1Z999AA10123456784', newTrackingNo: '1Z999AA10123456798', status: 'COMPLETED' },
  { id: `${MOCK_PREFIX}-ED-002`, docNo: 'ED2407002', oldTrackingNo: '9361287654012345678900', newTrackingNo: '9361287654012345678917', status: 'PENDING' },
  { id: `${MOCK_PREFIX}-ED-003`, docNo: 'ED2407003', oldTrackingNo: '420123459012345678901234567890', newTrackingNo: '420123459012345678901234567893', status: 'PROCESSING' },
];

const cutOrdersRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-CO-001`, orderNo: 'OBS2407001', customer: 'Yukon', status: 'PENDING', reason: '客户要求' },
  { id: `${MOCK_PREFIX}-CO-002`, orderNo: 'OBS2407002', customer: 'Tochtech', status: 'COMPLETED', reason: '库存不足' },
  { id: `${MOCK_PREFIX}-CO-003`, orderNo: 'OBS2407003', customer: 'Amazon', status: 'PENDING', reason: '重复订单' },
];

const transitRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-TR-001`, transitNo: 'TR2407001', fromWarehouse: 'LA仓库', toWarehouse: 'NY仓库', skuCode: 'SKU-A001', qty: 200, status: 'PENDING' },
  { id: `${MOCK_PREFIX}-TR-002`, transitNo: 'TR2407002', fromWarehouse: 'NY仓库', toWarehouse: 'LA仓库', skuCode: 'SKU-B002', qty: 150, status: 'IN_TRANSIT' },
  { id: `${MOCK_PREFIX}-TR-003`, transitNo: 'TR2407003', fromWarehouse: 'LA仓库', toWarehouse: 'CHI仓库', skuCode: 'SKU-C003', qty: 300, status: 'COMPLETED' },
];

const reportsRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-RP-001`, name: '2024年7月出入库报表', type: '出入库', createdAt: '2024-07-01', updatedAt: '2024-07-31' },
  { id: `${MOCK_PREFIX}-RP-002`, name: '2024年7月库存报表', type: '库存', createdAt: '2024-07-01', updatedAt: '2024-07-31' },
  { id: `${MOCK_PREFIX}-RP-003`, name: '2024年7月操作报表', type: '操作', createdAt: '2024-07-01', updatedAt: '2024-07-31' },
];

const boxInventoryRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-BI-001`, boxNo: 'BOX2407001', skuCode: 'SKU-A001', qty: 50, location: 'A-01-01', customer: 'Yukon' },
  { id: `${MOCK_PREFIX}-BI-002`, boxNo: 'BOX2407002', skuCode: 'SKU-B002', qty: 30, location: 'A-01-02', customer: 'Tochtech' },
  { id: `${MOCK_PREFIX}-BI-003`, boxNo: 'BOX2407003', skuCode: 'SKU-C003', qty: 100, location: 'B-02-01', customer: 'Amazon' },
];

const returnStockRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-RS-001`, skuCode: 'SKU-A001', qty: 15, location: 'R-01-01', customer: 'Yukon', status: '正品' },
  { id: `${MOCK_PREFIX}-RS-002`, skuCode: 'SKU-B002', qty: 8, location: 'R-01-02', customer: 'Tochtech', status: '次品' },
  { id: `${MOCK_PREFIX}-RS-003`, skuCode: 'SKU-C003', qty: 22, location: 'R-02-01', customer: 'Amazon', status: '正品' },
];

const defectiveRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-DF-001`, processNo: 'DF2407001', skuCode: 'SKU-A001', qty: 5, status: 'PENDING', type: '破损' },
  { id: `${MOCK_PREFIX}-DF-002`, processNo: 'DF2407002', skuCode: 'SKU-B002', qty: 3, status: 'PROCESSING', type: '过期' },
  { id: `${MOCK_PREFIX}-DF-003`, processNo: 'DF2407003', skuCode: 'SKU-C003', qty: 8, status: 'COMPLETED', type: '标签错误' },
];

const productMgmtRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-PM-001`, skuCode: 'SKU-A001', name: 'Wireless Mouse M1', category: '电子产品', customerName: 'Yukon', status: 'ACTIVE' },
  { id: `${MOCK_PREFIX}-PM-002`, skuCode: 'SKU-B002', name: 'USB-C Hub 7-in-1', category: '电子产品', customerName: 'Tochtech', status: 'ACTIVE' },
  { id: `${MOCK_PREFIX}-PM-003`, skuCode: 'SKU-C003', name: 'Laptop Stand Pro', category: '配件', customerName: 'Amazon', status: 'ACTIVE' },
];

const packagingRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-PK-001`, name: '标准纸箱 S', type: '纸箱', stock: 500, unit: '个' },
  { id: `${MOCK_PREFIX}-PK-002`, name: '标准纸箱 M', type: '纸箱', stock: 300, unit: '个' },
  { id: `${MOCK_PREFIX}-PK-003`, name: '气泡膜', type: '填充材料', stock: 50, unit: '卷' },
];

const pickingWallRows: MockRow[] = [
  { id: `${MOCK_PREFIX}-PW-001`, name: 'A区拣货墙', status: 'ACTIVE', location: 'A区' },
  { id: `${MOCK_PREFIX}-PW-002`, name: 'B区拣货墙', status: 'ACTIVE', location: 'B区' },
  { id: `${MOCK_PREFIX}-PW-003`, name: 'C区拣货墙', status: 'INACTIVE', location: 'C区' },
];

export const mockDataMap: Record<string, MockRow[]> = {
  weighing: weighingRows,
  exchangeDoc: exchangeDocRows,
  cutOrders: cutOrdersRows,
  transit: transitRows,
  reports: reportsRows,
  boxInventory: boxInventoryRows,
  returnStock: returnStockRows,
  defective: defectiveRows,
  productManagement: productMgmtRows,
  packaging: packagingRows,
  pickingWall: pickingWallRows,
};

export function getDeterministicKey(item: any, index: number): string {
  return item.id || item._id || item.orderNo || item.taskNo || item.waveNo || item.skuCode || item.code || item.name || `row-${index}`;
}
