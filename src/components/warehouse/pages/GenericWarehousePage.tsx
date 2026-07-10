import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../common/DataTable';
import Pagination from '../common/Pagination';
import StatusTabs from '../common/StatusTabs';
import FilterBar from '../common/FilterBar';
import ActionToolbar from '../common/ActionToolbar';
import { normalizeListResponse, formatDate, safeStr } from '../types';
import { WarehousePageProps } from '../types';

interface GenericConfig {
  title: string;
  fetchFn?: (params?: any) => Promise<any>;
  actionFn?: (id: string, action: string) => Promise<any>;
  tabs?: { key: string; label: string }[];
  columns: { key: string; label: string; width?: number; render?: (val: any, row: any) => React.ReactNode }[];
  filterFields?: any[];
  actionButtons?: any[];
  adapter?: (item: any) => any;
  statusKey?: string;
}

export function createGenericPage(config: GenericConfig) {
  return function GenericPage({ currentUser }: WarehousePageProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [statusTab, setStatusTab] = useState('all');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
      if (!config.fetchFn) {
        setLoading(false);
        setData([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const params: Record<string, any> = { page, pageSize };
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params[k] = v;
        });
        if (statusTab !== 'all') params.status = statusTab.toUpperCase();

        const response = await config.fetchFn(params);
        const items = normalizeListResponse(response);
        const totalCount = response?.total ?? response?.pagination?.total ?? response?.count ?? items.length;
        setTotal(totalCount);
        setData(config.adapter ? items.map(config.adapter) : items);
      } catch (err: any) {
        setError(err?.message || '加载失败');
        setData([]);
      } finally {
        setLoading(false);
      }
    }, [page, pageSize, filters, statusTab]);

    useEffect(() => { load(); }, [load]);

    const tabs = config.tabs || [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待处理' },
      { key: 'completed', label: '已完成' },
    ];

    const filterFields = config.filterFields || [];
    const actionButtons = config.actionButtons || [];
    const columns = config.columns;

    return (
      <div className="warehouse-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <StatusTabs
          tabs={tabs}
          activeKey={statusTab}
          onChange={tab => { setStatusTab(tab); setPage(1); }}
        />
        <FilterBar
          fields={filterFields}
          values={filters}
          onChange={(key, val) => { setFilters(prev => ({ ...prev, [key]: val })); setPage(1); }}
          onReset={() => { setFilters({}); setPage(1); }}
        />
        {actionButtons.length > 0 && (
          <ActionToolbar buttons={actionButtons} />
        )}
        <DataTable
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          error={error}
          selectedKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      </div>
    );
  };
}

// Pre-built generic pages for menus that don't need custom pages
import {
  putawayApi, pickApi, reviewApi, exceptionApi, cycleCountApi,
  locationApi, zoneApi, packagingApi, pickingWallApi, outboundApi, inboundApi, returnApi,
  relabelApi,
} from '../../../api';

const defaultAdapter = (item: any) => ({ ...item, id: item.id || item._id || Math.random().toString() });

export const ArrivalScanPage = createGenericPage({
  title: '到仓扫描',
  fetchFn: inboundApi.getOrders,
  columns: [
    { key: 'id', label: '入库单号', width: 140 },
    { key: 'customerName', label: '客户', width: 120, render: v => safeStr(v) },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdTime', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
});

export const PutawayPage = createGenericPage({
  title: '上架管理',
  fetchFn: putawayApi.getTasks,
  columns: [
    { key: 'id', label: '任务号', width: 140 },
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'location', label: '库位', width: 100 },
    { key: 'qty', label: '数量', width: 80 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const SecondarySortPage = createGenericPage({
  title: '二次分拣',
  fetchFn: pickApi.getTasks,
  columns: [
    { key: 'id', label: '任务号', width: 140 },
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'qty', label: '数量', width: 80 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const ReviewVerifyPage = createGenericPage({
  title: '复核/验货',
  fetchFn: reviewApi.getTasks,
  columns: [
    { key: 'id', label: '任务号', width: 140 },
    { key: 'orderNo', label: '出库单号', width: 140 },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
  adapter: defaultAdapter,
});

export const PackageReviewPage = createGenericPage({
  title: '包裹复核',
  fetchFn: reviewApi.getTasks,
  columns: [
    { key: 'id', label: '任务号', width: 140 },
    { key: 'orderNo', label: '出库单号', width: 140 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const WeighingPage = createGenericPage({
  title: '称重',
  columns: [
    { key: 'id', label: '包裹号', width: 140 },
    { key: 'weight', label: '重量', width: 80 },
    { key: 'status', label: '状态', width: 80 },
  ],
});

export const RelabelPage = createGenericPage({
  title: '换标',
  fetchFn: relabelApi?.getOrders || (async () => []),
  columns: [
    { key: 'id', label: '换标单号', width: 140 },
    { key: 'customerName', label: '客户', width: 120, render: v => safeStr(v) },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
  adapter: defaultAdapter,
});

// Re-export with consistent naming


export const ExchangeDocPage = createGenericPage({
  title: '换单',
  columns: [
    { key: 'id', label: '换单单号', width: 140 },
    { key: 'status', label: '状态', width: 80 },
  ],
});

export const ExceptionItemsPage = createGenericPage({
  title: '异常件',
  fetchFn: exceptionApi.getCases,
  columns: [
    { key: 'id', label: '异常编号', width: 140 },
    { key: 'orderNo', label: '关联单号', width: 140 },
    { key: 'type', label: '异常类型', width: 120 },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
  adapter: defaultAdapter,
});

export const CutOrdersPage = createGenericPage({
  title: '截单',
  columns: [
    { key: 'id', label: '单号', width: 140 },
    { key: 'status', label: '状态', width: 80 },
  ],
});

export const TransitPage = createGenericPage({
  title: '转运',
  columns: [
    { key: 'id', label: '转运单号', width: 140 },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
});

export const ReportsPage = createGenericPage({
  title: '报表',
  columns: [
    { key: 'name', label: '报表名称', width: 200 },
    { key: 'type', label: '类型', width: 100 },
    { key: 'updatedAt', label: '更新时间', width: 140, render: v => formatDate(v) },
  ],
});

export const BoxInventoryPage = createGenericPage({
  title: '箱库存',
  columns: [
    { key: 'boxNo', label: '箱号', width: 140 },
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'qty', label: '数量', width: 80 },
    { key: 'location', label: '库位', width: 100 },
  ],
});

export const ReturnStockPage = createGenericPage({
  title: '退货库存',
  columns: [
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'qty', label: '数量', width: 80 },
    { key: 'location', label: '库位', width: 100 },
  ],
});

export const DefectivePage = createGenericPage({
  title: '次品处理',
  columns: [
    { key: 'id', label: '处理单号', width: 140 },
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'qty', label: '数量', width: 80 },
    { key: 'status', label: '状态', width: 80 },
  ],
});

export const CycleCountPage = createGenericPage({
  title: '盘点',
  fetchFn: cycleCountApi.getTasks,
  columns: [
    { key: 'id', label: '盘点单号', width: 140 },
    { key: 'location', label: '库位', width: 100 },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
  adapter: defaultAdapter,
});

export const ProductManagementPage = createGenericPage({
  title: '产品管理',
  columns: [
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'name', label: '产品名称', width: 200 },
    { key: 'category', label: '分类', width: 100 },
    { key: 'customerName', label: '客户', width: 120 },
  ],
});

export const LocationManagePage = createGenericPage({
  title: '库位管理',
  fetchFn: locationApi.getLocations,
  columns: [
    { key: 'code', label: '库位编码', width: 120 },
    { key: 'zone', label: '分区', width: 100 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const ZoneManagePage = createGenericPage({
  title: '分区管理',
  fetchFn: zoneApi.getZones,
  columns: [
    { key: 'name', label: '分区名称', width: 140 },
    { key: 'code', label: '分区编码', width: 120 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const PackagingPage = createGenericPage({
  title: '包装材料',
  fetchFn: packagingApi.getMaterials,
  columns: [
    { key: 'name', label: '材料名称', width: 140 },
    { key: 'type', label: '类型', width: 100 },
    { key: 'stock', label: '库存', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const PickingWallPage = createGenericPage({
  title: '拣货墙',
  fetchFn: pickingWallApi.getWalls,
  columns: [
    { key: 'name', label: '拣货墙名称', width: 140 },
    { key: 'status', label: '状态', width: 80 },
  ],
  adapter: defaultAdapter,
});

export const NewProductPage = createGenericPage({
  title: '新品维护',
  columns: [
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'name', label: '产品名称', width: 200 },
    { key: 'customerName', label: '客户', width: 120 },
    { key: 'status', label: '状态', width: 80 },
  ],
});

export const InboundClaimPage = createGenericPage({
  title: '入库认领',
  columns: [
    { key: 'id', label: '认领单号', width: 140 },
    { key: 'customerName', label: '客户', width: 120, render: v => safeStr(v) },
    { key: 'status', label: '状态', width: 80 },
    { key: 'createdAt', label: '创建时间', width: 140, render: v => formatDate(v) },
  ],
});

export const InOutReportPage = createGenericPage({
  title: '出入库报表',
  columns: [
    { key: 'date', label: '日期', width: 100 },
    { key: 'inboundQty', label: '入库数量', width: 80 },
    { key: 'outboundQty', label: '出库数量', width: 80 },
  ],
});

export const InventoryReportPage = createGenericPage({
  title: '库存报表',
  columns: [
    { key: 'skuCode', label: 'SKU', width: 120 },
    { key: 'qty', label: '库存数量', width: 80 },
    { key: 'location', label: '库位', width: 100 },
  ],
});

export const OperationReportPage = createGenericPage({
  title: '操作报表',
  columns: [
    { key: 'userName', label: '操作人', width: 100 },
    { key: 'action', label: '操作', width: 100 },
    { key: 'target', label: '对象', width: 140 },
    { key: 'time', label: '时间', width: 140, render: v => formatDate(v) },
  ],
});
