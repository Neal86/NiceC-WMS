import React, { useState } from 'react';
import { 
  Search, RefreshCw, FileSpreadsheet, Settings, HelpCircle, 
  X, Check, AlertCircle, Trash2, ArrowRight, UserPlus
} from 'lucide-react';

interface InboundClaim {
  id: string;
  claimNo: string; // IC...
  warehouseRemark: string;
  trackingNo: string;
  claimClient: string;
  designatedClient: string;
  associatedNo: string;
  temporaryLocation: string;
  createdAt: string;
  claimedAt: string;
  expiryDate: string;
  cancelledAt: string;
  operator: string;
  status: '待认领' | '已认领' | '已处理' | '已取消' | '已过期';
}

const INITIAL_CLAIMS: InboundClaim[] = [
  {
    id: 'cl_1',
    claimNo: 'IC2606130RX',
    warehouseRemark: '-',
    trackingNo: '9302220831605051996120',
    claimClient: '-',
    designatedClient: '具奥(1108029)',
    associatedNo: '-',
    temporaryLocation: '-',
    createdAt: '2026-06-13 05:14:59',
    claimedAt: '-',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '待认领'
  },
  {
    id: 'cl_2',
    claimNo: 'IC2606130RW',
    warehouseRemark: '-',
    trackingNo: '9300189679000782163910',
    claimClient: '具奥(1108029)',
    designatedClient: '具奥(1108029)',
    associatedNo: 'FRI0292606130RU',
    temporaryLocation: '-',
    createdAt: '2026-06-13 05:13:28',
    claimedAt: '2026-06-13 18:11:54',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '已认领'
  },
  {
    id: 'cl_3',
    claimNo: 'IC2606130RV',
    warehouseRemark: '-',
    trackingNo: '9200190261248493184612',
    claimClient: '-',
    designatedClient: '具奥(1108029)',
    associatedNo: '-',
    temporaryLocation: '-',
    createdAt: '2026-06-13 03:19:25',
    claimedAt: '-',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '待认领'
  },
  {
    id: 'cl_4',
    claimNo: 'IC2606130RU',
    warehouseRemark: '-',
    trackingNo: 'TBA331409156310',
    claimClient: '具奥(1108029)',
    designatedClient: '具奥(1108029)',
    associatedNo: 'FRI0292606130RS',
    temporaryLocation: '-',
    createdAt: '2026-06-13 03:15:50',
    claimedAt: '2026-06-13 18:10:06',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '已处理'
  },
  {
    id: 'cl_5',
    claimNo: 'IC2606130RT',
    warehouseRemark: '-',
    trackingNo: 'TBA331446946387',
    claimClient: '具奥(1108029)',
    designatedClient: '具奥(1108029)',
    associatedNo: 'FRI0292606130RT',
    temporaryLocation: '-',
    createdAt: '2026-06-13 03:09:15',
    claimedAt: '2026-06-13 18:10:55',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '已处理'
  },
  {
    id: 'cl_6',
    claimNo: 'IC2606130RS',
    warehouseRemark: '-',
    trackingNo: '1Z918E6E0314435812',
    claimClient: '-',
    designatedClient: '具奥(1108029)',
    associatedNo: '-',
    temporaryLocation: '-',
    createdAt: '2026-06-13 03:05:16',
    claimedAt: '-',
    expiryDate: '2026-07-01',
    cancelledAt: '-',
    operator: 'VICKY@NICEC.NET',
    status: '待认领'
  }
];

export default function InboundClaimManager() {
  const [claims, setClaims] = useState<InboundClaim[]>(INITIAL_CLAIMS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CLAIMED' | 'PROCESSED' | 'CANCELLED' | 'EXPIRED'>('ALL');
  
  // Search state
  const [claimClientSearch, setClaimClientSearch] = useState('全部');
  const [designatedClientSearch, setDesignatedClientSearch] = useState('全部');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-03-30');
  const [dateEnd, setDateEnd] = useState('2026-07-01');

  // Interactive claiming dialog
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InboundClaim | null>(null);
  const [claimClientForm, setClaimClientForm] = useState('具奥(1108029)');
  const [assocNoForm, setAssocNoForm] = useState('');
  const [tempLocForm, setTempLocForm] = useState('TEMP-A-01');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = () => {
    setClaimClientSearch('全部');
    setDesignatedClientSearch('全部');
    setTrackingSearch('');
    setBarcodeSearch('');
    setDateStart('2026-03-30');
    setDateEnd('2026-07-01');
    showToast('已重置认领过滤条件', 'info');
  };

  // Filter logic
  const filteredClaims = claims.filter(c => {
    // Tab Filter
    if (activeTab === 'PENDING' && c.status !== '待认领') return false;
    if (activeTab === 'CLAIMED' && c.status !== '已认领') return false;
    if (activeTab === 'PROCESSED' && c.status !== '已处理') return false;
    if (activeTab === 'CANCELLED' && c.status !== '已取消') return false;
    if (activeTab === 'EXPIRED' && c.status !== '已过期') return false;

    // Filter selectors
    if (claimClientSearch !== '全部' && c.claimClient !== claimClientSearch && (claimClientSearch === '-' ? c.claimClient !== '-' : !c.claimClient.includes(claimClientSearch))) return false;
    if (designatedClientSearch !== '全部' && !c.designatedClient.includes(designatedClientSearch)) return false;

    if (trackingSearch && !c.trackingNo.toLowerCase().includes(trackingSearch.toLowerCase())) return false;
    
    // Date ranges
    const cDate = c.createdAt.split(' ')[0];
    if (dateStart && cDate < dateStart) return false;
    if (dateEnd && cDate > dateEnd) return false;

    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredClaims.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCancelClaim = (id: string, claimNo: string) => {
    if (confirm(`注意：确定要取消此认领单 [${claimNo}] 吗？`)) {
      setClaims(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: '已取消',
            cancelledAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
        }
        return c;
      }));
      showToast(`已成功取消认领任务 ${claimNo}`, 'info');
    }
  };

  const handleOpenClaimModal = (claim: InboundClaim) => {
    setSelectedClaim(claim);
    setClaimClientForm(claim.designatedClient !== '-' ? claim.designatedClient : '具奥(1108029)');
    setAssocNoForm(claim.claimNo.replace('IC', 'FRI') + 'RU');
    setTempLocForm('TEMP-B-04');
    setIsClaimModalOpen(true);
  };

  const handleSaveClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setClaims(prev => prev.map(c => {
      if (c.id === selectedClaim.id) {
        return {
          ...c,
          claimClient: claimClientForm,
          associatedNo: assocNoForm || '-',
          temporaryLocation: tempLocForm || '-',
          claimedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: '已认领'
        };
      }
      return c;
    }));

    showToast(`认领成功：单号 ${selectedClaim.claimNo} 已指派给客户 [${claimClientForm}]`, 'success');
    setIsClaimModalOpen(false);
    setSelectedClaim(null);
  };

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden font-sans text-[12px] text-slate-700 select-none">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className={`px-4.5 py-2.5 rounded shadow-lg border text-xs flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header Status Tabs */}
      <div className="h-9.5 bg-[#f5f7fa] border-b border-slate-200 px-3.5 flex items-center shrink-0">
        <div className="flex gap-4">
          {[
            { key: 'ALL', label: '全部' },
            { key: 'PENDING', label: `待认领 (${claims.filter(c => c.status === '待认领').length})` },
            { key: 'CLAIMED', label: '已认领' },
            { key: 'PROCESSED', label: '已处理' },
            { key: 'CANCELLED', label: '已取消' },
            { key: 'EXPIRED', label: '已过期' }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`h-9.5 px-1 hover:text-blue-600 border-b-2 font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  isActive ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Advanced Search Filters Row */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        
        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">认领客户名称/代码:</span>
          <select 
            value={claimClientSearch} 
            onChange={(e) => setClaimClientSearch(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="-">未认领(-)</option>
            <option value="具奥(1108029)">具奥(1108029)</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 cursor-pointer text-[11px]">
          <span className="text-slate-400">指定客户名称/代码:</span>
          <select 
            value={designatedClientSearch} 
            onChange={(e) => setDesignatedClientSearch(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="全部">全部</option>
            <option value="具奥(1108029)">具奥(1108029)</option>
          </select>
        </div>

        <div className="flex items-center border border-slate-300 rounded overflow-hidden h-7 bg-white text-[11px]">
          <span className="bg-slate-100 px-2 h-full flex items-center text-slate-500 border-r border-slate-300 font-medium">物流跟踪号</span>
          <input
            type="text"
            placeholder="搜物流追踪单号"
            value={trackingSearch}
            onChange={(e) => setTrackingSearch(e.target.value)}
            className="h-full px-2 w-44 outline-none font-mono"
          />
        </div>

        <div className="flex items-center border border-slate-300 rounded overflow-hidden h-7 bg-white text-[11px]">
          <span className="bg-slate-100 px-2 h-full flex items-center text-slate-500 border-r border-slate-300 font-medium">Barcode</span>
          <input
            type="text"
            placeholder="模糊搜索Barcode"
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            className="h-full px-2 w-32 outline-none font-mono"
          />
        </div>

        {/* Date pickers */}
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px] font-semibold">创建时间:</span>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="h-7 px-2 border border-slate-300 rounded text-slate-700 text-[11px]"
          />
          <span>至</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="h-7 px-2 border border-slate-300 rounded text-slate-700 text-[11px]"
          />
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="h-7 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 rounded font-bold transition-all cursor-pointer"
        >
          重置
        </button>

      </div>

      {/* 3. Toolbar Row */}
      <div className="h-9 bg-[#f9fafb] border-b border-slate-200 px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                showToast('请至少勾选一条认领记录进行导出！', 'error');
                return;
              }
              alert(`正在导出选中的 ${selectedIds.length} 条认领单数据包。`);
            }}
            className="h-6 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>导出</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>共找到 {filteredClaims.length} 条认领货件</span>
          <RefreshCw
            onClick={() => {
              setClaims(INITIAL_CLAIMS);
              showToast('已同步领星 WMS 认领池', 'success');
            }}
            className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Table view */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full border-collapse bg-white select-none text-left table-fixed">
          <thead>
            <tr className="bg-[#f5f7fa] text-slate-500 font-semibold border-b border-slate-200 text-[10.5px] h-8 sticky top-0 z-10">
              <th className="w-9 text-center border-r border-slate-200/60">
                <input
                  type="checkbox"
                  checked={filteredClaims.length > 0 && selectedIds.length === filteredClaims.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600"
                />
              </th>
              <th className="w-36 px-2 border-r border-slate-200/60">认领单号</th>
              <th className="w-24 px-2 border-r border-slate-200/60">仓库备注</th>
              <th className="w-52 px-2 border-r border-slate-200/60">物流跟踪号</th>
              <th className="w-32 px-2 border-r border-slate-200/60">认领客户</th>
              <th className="w-32 px-2 border-r border-slate-200/60">指定客户</th>
              <th className="w-36 px-2 border-r border-slate-200/60">关联单号</th>
              <th className="w-24 px-2 border-r border-slate-200/60">暂存库位</th>
              <th className="w-36 px-2 border-r border-slate-200/60">创建时间</th>
              <th className="w-36 px-2 border-r border-slate-200/60">认领时间</th>
              <th className="w-28 px-2 border-r border-slate-200/60 text-center">失效日期</th>
              <th className="w-36 px-2 border-r border-slate-200/60">取消时间</th>
              <th className="w-36 px-2 border-r border-slate-200/60">操作人</th>
              <th className="w-24 px-2 border-r border-slate-200/60 text-center">状态</th>
              <th className="w-28 text-center sticky right-0 bg-[#f5f7fa] border-l border-slate-200">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={15} className="h-40 text-center text-slate-400 font-medium">
                  认领单池暂无该状态下的物流包裹数据
                </td>
              </tr>
            ) : (
              filteredClaims.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 h-10 transition-colors ${
                      isSelected ? 'bg-blue-500/[0.03]' : ''
                    }`}
                  >
                    <td className="text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(c.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono font-bold text-blue-600">
                      {c.claimNo}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-slate-400">
                      {c.warehouseRemark}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono font-medium text-slate-700 truncate" title={c.trackingNo}>
                      {c.trackingNo}
                    </td>
                    <td className={`px-2 border-r border-slate-100 font-medium ${c.claimClient === '-' ? 'text-slate-400' : 'text-emerald-700'}`}>
                      {c.claimClient}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-slate-600 font-medium">
                      {c.designatedClient}
                    </td>
                    <td className={`px-2 border-r border-slate-100 font-mono ${c.associatedNo === '-' ? 'text-slate-400' : 'text-blue-600'}`}>
                      {c.associatedNo}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-600">
                      {c.temporaryLocation}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400">
                      {c.createdAt}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400">
                      {c.claimedAt}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400 text-center">
                      {c.expiryDate}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-400">
                      {c.cancelledAt}
                    </td>
                    <td className="px-2 border-r border-slate-100 font-mono text-slate-500">
                      {c.operator}
                    </td>
                    <td className="px-2 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.status === '待认领' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        c.status === '已认领' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.status === '已处理' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        c.status === '已取消' ? 'bg-red-50 text-red-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-center sticky right-0 bg-white border-l border-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-center gap-2">
                        {c.status === '待认领' ? (
                          <>
                            <button
                              onClick={() => handleOpenClaimModal(c)}
                              className="text-emerald-600 hover:text-emerald-800 font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                            >
                              认领
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleCancelClaim(c.id, c.claimNo)}
                              className="text-red-500 hover:text-red-700 font-semibold transition-all cursor-pointer"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Dialog Modal */}
      {isClaimModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <form 
            onSubmit={handleSaveClaim}
            className="w-[440px] bg-white rounded-xl shadow-2xl p-5 border border-slate-200 space-y-4 text-xs text-slate-700"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>处理包裹认领：{selectedClaim.claimNo}</span>
              </span>
              <button 
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>跟踪追踪单号:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedClaim.trackingNo}</span>
              </div>
              <div className="flex justify-between">
                <span>包裹创建时间:</span>
                <span className="font-mono">{selectedClaim.createdAt}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">认领入库货主 <span className="text-red-500">*</span></label>
                <select
                  value={claimClientForm}
                  onChange={(e) => setClaimClientForm(e.target.value)}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="具奥(1108029)">具奥(1108029)</option>
                  <option value="之道 - 悠悠(1108026)">之道 - 悠悠 (1108026)</option>
                  <option value="YANGZHOU(1108014)">YANGZHOU (1108014)</option>
                  <option value="JIDONG(1108034)">JIDONG (1108034)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">关联客户入库预报单</label>
                <input
                  type="text"
                  placeholder="如: FRI0292606130RS"
                  value={assocNoForm}
                  onChange={(e) => setAssocNoForm(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">暂存上架分配库位 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="如: TEMP-A-01"
                  required
                  value={tempLocForm}
                  onChange={(e) => setTempLocForm(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow transition-all cursor-pointer"
              >
                确认认领货件
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
