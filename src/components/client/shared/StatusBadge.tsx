interface StatusBadgeProps {
  status: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  '全部': 'bg-slate-100 text-slate-600 border-slate-200',
  '待处理': 'bg-amber-50 text-amber-700 border-amber-200',
  '待获取平台面单': 'bg-purple-50 text-purple-700 border-purple-200',
  '处理中': 'bg-blue-50 text-blue-700 border-blue-200',
  '已发货': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '已取消': 'bg-slate-100 text-slate-500 border-slate-200',
  '异常': 'bg-red-50 text-red-700 border-red-200',
  '草稿': 'bg-slate-100 text-slate-600 border-slate-200',
  '待审核': 'bg-amber-50 text-amber-700 border-amber-200',
  '待入库': 'bg-blue-50 text-blue-700 border-blue-200',
  '收货中': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '已收货': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '已上架': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '已驳回': 'bg-red-50 text-red-700 border-red-200',
  '仓库处理中': 'bg-blue-50 text-blue-700 border-blue-200',
  '已出库': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '待认领': 'bg-amber-50 text-amber-700 border-amber-200',
  '已认领': 'bg-blue-50 text-blue-700 border-blue-200',
  '已处理': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '已过期': 'bg-red-50 text-red-700 border-red-200',
  '已完成': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '审核中': 'bg-blue-50 text-blue-700 border-blue-200',
  '已审核': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '作废': 'bg-red-50 text-red-700 border-red-200',
  '运输中': 'bg-blue-50 text-blue-700 border-blue-200',
  '废弃': 'bg-red-50 text-red-700 border-red-200',
  'active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'inactive': 'bg-slate-100 text-slate-500 border-slate-200',
  '成功': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '失败': 'bg-red-50 text-red-700 border-red-200',
  '已登出': 'bg-slate-100 text-slate-500 border-slate-200',
  '已同步': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '同步中': 'bg-blue-50 text-blue-700 border-blue-200',
  '同步失败': 'bg-red-50 text-red-700 border-red-200',
  '未同步': 'bg-slate-100 text-slate-500 border-slate-200',
  'matched': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'unmatched': 'bg-amber-50 text-amber-700 border-amber-200',
  '已匹配': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '未匹配': 'bg-amber-50 text-amber-700 border-amber-200',
  '启用': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '停用': 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = colorMap[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors} ${className}`}>
      {status}
    </span>
  );
}
