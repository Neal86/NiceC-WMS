import { useState, useEffect } from 'react';
import { Download, Plus, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '../shared/DataTable';
import FormModal from '../shared/FormModal';
import StatusBadge from '../shared/StatusBadge';
import { clientService } from '../../../services/client/clientService';
import type { AccountInfo, Transaction, TopUpRecord } from '../../../types/client';
import { ActionButton } from '../shared/PageLayout';

const transactionColumns: Column<Transaction>[] = [
  { key: 'type', title: '类型', width: '90px' },
  { key: 'amount', title: '金额', width: '100px', render: item => <span className={`font-semibold font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}</span> },
  { key: 'balance', title: '余额', width: '100px', render: item => <span className="font-mono">{item.balance.toFixed(2)}</span> },
  { key: 'description', title: '描述', width: '150px' },
  { key: 'createdTime', title: '时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
];

const topUpColumns: Column<TopUpRecord>[] = [
  { key: 'amount', title: '金额', width: '100px', render: item => <span className="font-mono font-semibold">${item.amount.toFixed(2)}</span> },
  { key: 'method', title: '方式', width: '100px' },
  { key: 'status', title: '状态', width: '80px', render: item => <StatusBadge status={item.status} /> },
  { key: 'createdTime', title: '时间', width: '150px', render: item => <span className="text-slate-500">{item.createdTime}</span> },
  { key: 'remark', title: '备注', width: '100px' },
];

export function MyAccount() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    clientService.getAccount().then(setAccount);
  }, []);

  if (!account) return <div className="text-xs text-slate-400 p-8 text-center">加载中...</div>;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-slate-800">我的账户</h2>

      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <div className="text-[10px] text-slate-500 mb-1">账户余额 (USD)</div>
          <div className="text-xl font-bold text-red-500">{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <div className="text-[10px] text-slate-500 mb-1">信用额度</div>
          <div className="text-xl font-bold text-slate-800">{account.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <div className="text-[10px] text-slate-500 mb-1">预警余额</div>
          <div className="text-xl font-bold text-amber-600">{account.warningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <div className="text-[10px] text-slate-500 mb-1">限制下单金额</div>
          <div className="text-xl font-bold text-slate-800">{account.restrictedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <div className="text-[10px] text-slate-500 mb-1">可下单金额</div>
          <div className="text-xl font-bold text-emerald-600">{account.orderableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <button onClick={() => setTopUpOpen(true)}
            className="mt-2 h-7 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium cursor-pointer">
            充值
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">资金流水</h3>
        <div className="text-xs text-slate-400 text-center py-4">
          最近交易流水 - 详情请查看"业务流水"页面
        </div>
      </div>

      <FormModal open={topUpOpen} title="充值" onClose={() => setTopUpOpen(false)} width="400px">
        <div className="space-y-3">
          <div><label className="text-slate-400">充值金额 (USD)</label>
            <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
              className="w-full mt-1 h-8 px-2 border border-slate-300 rounded text-sm" placeholder="请输入金额" /></div>
          <div className="text-[10px] text-slate-400">充值将提交审核，到账后可使用</div>
        </div>
      </FormModal>
    </div>
  );
}

export function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [data2, setData2] = useState<TopUpRecord[]>([]);
  const [total2, setTotal2] = useState(0);
  const [tab, setTab] = useState<'transactions' | 'topup'>('transactions');

  useEffect(() => {
    clientService.transactions.list({ page, pageSize: 20 }).then(r => {
      setData(r.data as Transaction[]);
      setTotal(r.total);
    });
    clientService.topUpRecords.list({ page: 1, pageSize: 20 }).then(r => {
      setData2(r.data as TopUpRecord[]);
      setTotal2(r.total);
    });
  }, [page]);

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">业务流水</h2>
        <div className="flex items-center gap-2">
          <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="导出" variant="default" />
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setTab('transactions')} className={`px-4 py-2 text-[11px] font-medium border-b-2 cursor-pointer ${tab === 'transactions' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent'}`}>资金流水</button>
        <button onClick={() => setTab('topup')} className={`px-4 py-2 text-[11px] font-medium border-b-2 cursor-pointer ${tab === 'topup' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent'}`}>充值记录</button>
      </div>

      {tab === 'transactions' ? (
        <DataTable columns={transactionColumns} data={data} total={total} page={page} pageSize={20}
          onPageChange={setPage} getId={d => d.id} emptyMessage="暂无流水数据" />
      ) : (
        <DataTable columns={topUpColumns} data={data2} total={total2} page={1} pageSize={20}
          onPageChange={() => {}} getId={d => d.id} emptyMessage="暂无充值记录" />
      )}
    </div>
  );
}
