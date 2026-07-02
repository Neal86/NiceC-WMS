import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Settings, Building2, Clipboard, DollarSign, 
  Layers, MessageSquare, ChevronLeft, Plus, Search, Trash2, 
  Edit, Check, X, HelpCircle, Save, CheckCircle, FileText,
  AlertTriangle, Play, RefreshCw, BarChart
} from 'lucide-react';
import { logApi, metadataApi, warehouseApi, customerApi } from '../api';
import { FeedbackManagementTable } from './feedback/FeedbackManagementTable';

interface AdminPanelProps {
  currentUser: any;
  onNavigateBack: () => void;
  initialPath?: string;
}

// Sub-path definitions matching standard URLs
type AdminSubPath = 'dashboard' | 'users' | 'roles' | 'warehouses' | 'customers' | 'billing-rules' | 'operation-logs' | 'feedback' | 'settings';

export default function AdminPanel({ currentUser, onNavigateBack, initialPath = '/admin' }: AdminPanelProps) {
  // Resolve active sub-path from path string
  const getSubPathFromUrl = (urlPath: string): AdminSubPath => {
    if (urlPath.includes('/admin/users')) return 'users';
    if (urlPath.includes('/admin/roles')) return 'roles';
    if (urlPath.includes('/admin/warehouses')) return 'warehouses';
    if (urlPath.includes('/admin/customers')) return 'customers';
    if (urlPath.includes('/admin/billing-rules')) return 'billing-rules';
    if (urlPath.includes('/admin/operation-logs')) return 'operation-logs';
    if (urlPath.includes('/admin/feedback')) return 'feedback';
    if (urlPath.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const [subPath, setSubPath] = useState<AdminSubPath>(getSubPathFromUrl(initialPath));

  // Sync with window.location when changed
  useEffect(() => {
    const handlePopState = () => {
      setSubPath(getSubPathFromUrl(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newSubPath: AdminSubPath) => {
    const fullPath = newSubPath === 'dashboard' ? '/admin' : `/admin/${newSubPath}`;
    window.history.pushState(null, '', fullPath);
    setSubPath(newSubPath);
  };

  // 403 Forbidden check (Role check)
  const isAuthorized = () => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'MANAGER' || currentUser.permissions?.includes('view_admin_panel');
  };

  if (!isAuthorized()) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none min-h-[500px]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 shadow-sm animate-bounce">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">403 Unauthorized / 暂无访问权限</h2>
        <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
          您当前无权访问管理员后台。请联系系统管理员为您分配 <strong>Admin</strong> 或 <strong>Manager</strong> 角色，或开通 <strong>view_admin_panel</strong> 权限后重新尝试。
        </p>
        <button
          onClick={onNavigateBack}
          className="px-5 py-2 bg-[#062B66] hover:bg-[#062B66]/90 text-white rounded font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回 WMS 工作台</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans h-screen">
      {/* Admin Top Header Navigation */}
      <div className="bg-white border-b border-slate-200 h-12 px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (subPath === 'dashboard') {
                onNavigateBack();
              } else {
                navigateTo('dashboard');
              }
            }}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="返回"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">管理员控制台 / Admin Panel</span>
            {subPath !== 'dashboard' && (
              <>
                <span className="text-slate-300 text-xs">/</span>
                <span className="text-slate-500 text-xs font-semibold uppercase">
                  {subPath === 'users' ? '用户管理' :
                   subPath === 'roles' ? '角色权限' :
                   subPath === 'warehouses' ? '仓库管理' :
                   subPath === 'customers' ? '客户管理' :
                   subPath === 'billing-rules' ? '计费规则' :
                   subPath === 'operation-logs' ? '操作日志' :
                   subPath === 'feedback' ? '反馈管理' :
                   subPath === 'settings' ? '系统设置' : ''}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">当前操作员:</span>
          <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded border border-blue-100">
            {currentUser?.username} ({currentUser?.role})
          </span>
        </div>
      </div>

      {/* Main Admin Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {subPath === 'dashboard' && (
          <AdminDashboard navigateTo={navigateTo} />
        )}
        {subPath === 'users' && <UserManagement />}
        {subPath === 'roles' && <RolesPermissions />}
        {subPath === 'warehouses' && <WarehouseManagement />}
        {subPath === 'customers' && <CustomerManagement />}
        {subPath === 'billing-rules' && <BillingRules />}
        {subPath === 'operation-logs' && <OperationLogs />}
        {subPath === 'feedback' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[500px]">
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">反馈管理模块 (集成)</h3>
                <p className="text-xs text-slate-400">已与系统中的反馈上报及 AI 回复引擎深度联通</p>
              </div>
              <button
                onClick={() => navigateTo('dashboard')}
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                返回控制台
              </button>
            </div>
            <FeedbackManagementTable />
          </div>
        )}
        {subPath === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
}

/* ============================================================================
   1. ADMIN DASHBOARD VIEW
   ============================================================================ */
interface DashboardCardProps {
  title: string;
  engTitle: string;
  desc: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  onClick: () => void;
}

function AdminDashboard({ navigateTo }: { navigateTo: (path: AdminSubPath) => void }) {
  const cards: { key: AdminSubPath; title: string; engTitle: string; desc: string; icon: any; color: string }[] = [
    {
      key: 'users',
      title: '用户管理',
      engTitle: 'User Management',
      desc: '系统操作员及仓库人员账号管理、激活/禁用及权限指派。',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300'
    },
    {
      key: 'roles',
      title: '角色权限',
      engTitle: 'Roles & Permissions',
      desc: '定义业务系统角色(Admin, Manager, Operator)及精确菜单访问权限。',
      icon: Shield,
      color: 'bg-pink-50 text-pink-600 border-pink-100 hover:border-pink-300'
    },
    {
      key: 'warehouses',
      title: '仓库管理',
      engTitle: 'Warehouse Management',
      desc: '多仓实体配置、物理地址规划、仓容利用率与库区监控。',
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300'
    },
    {
      key: 'customers',
      title: '客户管理',
      engTitle: 'Customer Management',
      desc: '入驻 WMS 的电商客户档案、合同周期、服务费模式及对接。',
      icon: Clipboard,
      color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300'
    },
    {
      key: 'billing-rules',
      title: '计费规则',
      engTitle: 'Billing Rules',
      desc: '设置各客户的日常仓储租金、出库操作费、贴标及渠道折扣。',
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300'
    },
    {
      key: 'operation-logs',
      title: '操作日志',
      engTitle: 'Operation Logs',
      desc: '对系统核心出入库、盘点、移库动作的审计及追溯日志。',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300'
    },
    {
      key: 'feedback',
      title: '反馈管理',
      engTitle: 'Feedback Management',
      desc: '统一收集、审核和指派仓库前线作业人员提交的故障与建议。',
      icon: MessageSquare,
      color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300'
    },
    {
      key: 'settings',
      title: '系统设置',
      engTitle: 'System Settings',
      desc: 'WMS系统名称、多语言默认设置、三方 API 密钥及集成参数。',
      icon: Settings,
      color: 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-blue-700 to-[#062B66] rounded-xl text-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold">欢迎进入 WMS 系统控制后台</h2>
          <p className="text-white/80 text-xs mt-1 max-w-xl">
            作为管理员，您可以在这里对本系统的核心操作员、仓储费用计费率、运行日志以及全局物理仓库实体、商户契约进行统一控制。
          </p>
        </div>
        <div className="bg-white/10 px-4 py-3 rounded-lg border border-white/10 flex items-center gap-3 self-stretch md:self-auto">
          <div className="text-left font-mono">
            <div className="text-[10px] text-white/60">SYSTEM STATUS</div>
            <div className="text-sm font-bold text-emerald-400">● Core Online</div>
          </div>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <div className="text-left font-mono">
            <div className="text-[10px] text-white/60">VERSION</div>
            <div className="text-sm font-bold">v3.5.0-Dev</div>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">系统后台模块看板</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => navigateTo(card.key)}
                className={`text-left p-5 bg-white border rounded-xl hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]`}
              >
                <div className="space-y-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${card.color} transition-all`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{card.title}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{card.engTitle}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform self-stretch">
                  <span>进入管理</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. USER MANAGEMENT MODULE
   ============================================================================ */
function UserManagement() {
  const [users, setUsers] = useState([
    { id: 'usr_admin', username: 'admin@nicec.net', name: '系统管理员', role: 'ADMIN', status: 'ACTIVE', lastActive: '2026-06-30 09:12' },
    { id: 'usr_1', username: 'neal@nicec.net', name: '项目负责人', role: 'ADMIN', status: 'ACTIVE', lastActive: '2026-06-30 09:35' },
    { id: 'usr_2', username: 'operator', name: '前线作业组长', role: 'OPERATOR', status: 'ACTIVE', lastActive: '2026-06-29 18:22' },
    { id: 'usr_3', username: 'manager_lee@nicec.net', name: '李经理', role: 'MANAGER', status: 'ACTIVE', lastActive: '2026-06-28 11:05' },
    { id: 'usr_4', username: 'test_user@nicec.net', name: '测试访客', role: 'OPERATOR', status: 'DISABLED', lastActive: '2026-06-15 14:00' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName) return;
    const newUser = {
      id: `usr_${Date.now()}`,
      username: newUsername,
      name: newName,
      role: newRole,
      status: 'ACTIVE',
      lastActive: '-'
    };
    setUsers(prev => [...prev, newUser]);
    setNewUsername('');
    setNewName('');
    setNewRole('OPERATOR');
    setIsAddOpen(false);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">系统用户列表</h3>
          <p className="text-xs text-slate-400">管理授权登录本 NiceC WMS 系统的操作账号</p>
        </div>
        <div className="flex gap-2 self-stretch sm:self-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户名或真实姓名..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增用户</span>
          </button>
        </div>
      </div>

      {isAddOpen && (
        <form onSubmit={handleAddUser} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>创建新操作账号</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">用户名 / 邮箱 (登陆账号) *</label>
              <input
                type="email"
                required
                placeholder="eg: worker@nicec.net"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">真实姓名 *</label>
              <input
                type="text"
                required
                placeholder="eg: 张操作"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">指派角色 *</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="OPERATOR">OPERATOR (操作员)</option>
                <option value="MANAGER">MANAGER (仓库经理)</option>
                <option value="ADMIN">ADMIN (超级管理员)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
            >
              保存并授权
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th className="px-4 py-2.5">用户账号 (Email)</th>
              <th className="px-4 py-2.5">真实姓名</th>
              <th className="px-4 py-2.5">角色定位</th>
              <th className="px-4 py-2.5">当前状态</th>
              <th className="px-4 py-2.5">最后活跃</th>
              <th className="px-4 py-2.5 text-right">管理操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-slate-900">{user.username}</td>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                    user.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {user.status === 'ACTIVE' ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">{user.lastActive}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors border ${
                        user.status === 'ACTIVE' 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? '禁用' : '启用'}
                    </button>
                    <button 
                      onClick={() => alert('请在完整版本中配置详细的用户编辑和重置密码选项。')}
                      className="border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] font-bold px-2 py-1 rounded"
                    >
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   3. ROLES & PERMISSIONS MODULE
   ============================================================================ */
function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER' | 'OPERATOR'>('MANAGER');
  
  const [permissions, setPermissions] = useState({
    ADMIN: ['view_admin_panel', 'manage_orders', 'view_reports', 'edit_billing', 'manage_users', 'view_all_feedbacks'],
    MANAGER: ['view_admin_panel', 'manage_orders', 'view_reports', 'view_all_feedbacks'],
    OPERATOR: ['manage_orders', 'view_all_feedbacks']
  });

  const availablePermissions = [
    { key: 'view_admin_panel', label: '访问后台控制面板', desc: '允许账号进入管理员/经理配置端' },
    { key: 'manage_users', label: '操作员账号管理', desc: '允许增加、禁用、编辑全部操作员及分配角色' },
    { key: 'manage_orders', label: '出入库核心交易管理', desc: '核心业务：允许生成波次、修改订单数据、操作打印贴标' },
    { key: 'edit_billing', label: '计费率与财务费率设定', desc: '允许编辑仓库存储、打单及商户扣费配置' },
    { key: 'view_reports', label: '财务与产能报表查看', desc: '允许导出及查看全部商户的账单日志和每日库容利用率' },
    { key: 'view_all_feedbacks', label: '反馈管理查阅与响应', desc: '允许查阅并直接使用 AI 助手回复作业端提交的问题' },
  ];

  const handleTogglePermission = (permissionKey: string) => {
    setPermissions(prev => {
      const rolePerms = prev[selectedRole];
      const nextPerms = rolePerms.includes(permissionKey)
        ? rolePerms.filter(k => k !== permissionKey)
        : [...rolePerms, permissionKey];
      return {
        ...prev,
        [selectedRole]: nextPerms
      };
    });
  };

  const handleSave = () => {
    alert(`角色 ${selectedRole} 的权限设定已经成功写入配置数据库！`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">角色与权限规划</h3>
        <p className="text-xs text-slate-400">细粒度管理不同岗位角色的 WMS 菜单与 API 访问边界</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Roles Sidebar */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">选择要配置的角色</span>
          {['ADMIN', 'MANAGER', 'OPERATOR'].map((r) => {
            const isActive = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRole(r as any)}
                className={`w-full text-left p-3.5 border rounded-xl cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm">{r}</span>
                  <Shield className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                </div>
                <p className={`text-[11px] mt-1.5 leading-relaxed ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {r === 'ADMIN' ? '系统顶级特权，对全局设置、账单规则及用户名单拥有不受限制的完全控制权。' :
                   r === 'MANAGER' ? '仓库日常生产管理，配置出入库逻辑，查看统计报告，但不能修改全局费率参数。' :
                   '负责具体的物理拣选、贴标出货、盘点更新，不暴露敏感财务和高危配置项。'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Permissions Panel */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-mono">配置 {selectedRole} 的具体权限范围</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">勾选或清除具体功能选项的开关</p>
            </div>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存配置</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {availablePermissions.map((perm) => {
              const hasPerm = permissions[selectedRole].includes(perm.key);
              return (
                <div 
                  key={perm.key}
                  onClick={() => handleTogglePermission(perm.key)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    hasPerm 
                      ? 'bg-blue-50/50 border-blue-100' 
                      : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasPerm}
                    onChange={() => {}} // handled by div onClick
                    className="mt-0.5 h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{perm.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</div>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{perm.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   4. WAREHOUSE MANAGEMENT MODULE
   ============================================================================ */
function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([
    { id: 'wh_1', name: 'NC - NO.1仓 - 92503', code: '92503', address: 'North Carolina, USA', status: 'ACTIVE', capacity: '15,000 m³', utilized: '84.5%', currentOccupied: '12,675 m³', manager: 'Neal (Neal Chang)' },
    { id: 'wh_2', name: 'NJ - NO.2仓 - 08817', code: '08817', address: 'New Jersey, USA', status: 'ACTIVE', capacity: '25,000 m³', utilized: '42.1%', currentOccupied: '10,525 m³', manager: 'John (NJ Team Lead)' },
    { id: 'wh_3', name: 'CA - NO.3仓 - 91748', code: '91748', address: 'Los Angeles, California, USA', status: 'PLANNING', capacity: '50,000 m³', utilized: '0%', currentOccupied: '0 m³', manager: 'Pending Appointment' }
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('10,000');
  const [manager, setManager] = useState('');

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !zip || !address) return;
    const newWh = {
      id: `wh_${Date.now()}`,
      name: `${name} - ${zip}`,
      code: zip,
      address,
      status: 'PLANNING',
      capacity: `${parseFloat(capacity).toLocaleString()} m³`,
      utilized: '0%',
      currentOccupied: '0 m³',
      manager: manager || '未指派'
    };
    setWarehouses(prev => [...prev, newWh]);
    setIsAddOpen(false);
    setName('');
    setZip('');
    setAddress('');
    setCapacity('10,000');
    setManager('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800">实体多仓网络规划</h3>
          <p className="text-xs text-slate-400">配置您在美东、美西以及中部的核心保税仓、海外配发仓物理属性</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>规划新仓库</span>
        </button>
      </div>

      {isAddOpen && (
        <form onSubmit={handleAddWarehouse} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>新增仓库设施规划</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">仓库设施名称 (e.g., TX - 中部1号仓) *</label>
              <input
                type="text"
                required
                placeholder="名称前缀及地区标志"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">邮编 / 识别码 *</label>
              <input
                type="text"
                required
                placeholder="ZIP Code e.g. 75001"
                value={zip}
                onChange={e => setZip(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">设计仓储体积限制 (m³) *</label>
              <input
                type="number"
                required
                placeholder="体积容量限制"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">物理详情地址 *</label>
              <input
                type="text"
                required
                placeholder="精确物理设施地址"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">设施主管 / Manager</label>
              <input
                type="text"
                placeholder="指派主管名字"
                value={manager}
                onChange={e => setManager(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
            >
              提交设施备案
            </button>
          </div>
        </form>
      )}

      {/* Grid of Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const utilPct = parseFloat(wh.utilized);
          return (
            <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="bg-blue-50 text-[#062B66] w-9 h-9 rounded-lg flex items-center justify-center border border-blue-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                    wh.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {wh.status === 'ACTIVE' ? '运营中' : '备案规划中'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{wh.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">识别编码: {wh.code}</p>
                </div>
                <div className="text-xs text-slate-500 leading-relaxed font-sans bg-slate-50 rounded p-2.5 space-y-1">
                  <div><strong className="text-slate-600">地址:</strong> {wh.address}</div>
                  <div><strong className="text-slate-600">主管:</strong> {wh.manager}</div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>仓储容积利用率</span>
                  <span className="font-mono font-bold text-slate-800">{wh.utilized}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      utilPct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                    }`} 
                    style={{ width: wh.utilized }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>占用: {wh.currentOccupied}</span>
                  <span>容量: {wh.capacity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   5. CUSTOMER MANAGEMENT MODULE
   ============================================================================ */
function CustomerManagement() {
  const [customers, setCustomers] = useState([
    { id: 'cust_1', name: 'Yukon(育康美东商户)', code: 'Yukon(1108037)', contact: 'John Yukon', email: 'john@yukon.com', status: 'ACTIVE', type: 'FBA中转+一件代发', regDate: '2025-01-10' },
    { id: 'cust_2', name: 'Tochtech(途客智能)', code: 'Tochtech(1108045)', contact: 'Terry Toch', email: 'terry@tochtech.com', status: 'ACTIVE', type: '一件代发专营', regDate: '2025-02-14' },
    { id: 'cust_3', name: 'Zonestar(中星数码)', code: 'Zonestar(1108099)', contact: 'Zara Lin', email: 'zara@zonestar.com', status: 'ACTIVE', type: '包材定制客户', regDate: '2025-03-01' },
    { id: 'cust_4', name: 'ApexLogistics(艾派斯国际)', code: 'Apex(1108210)', contact: 'Alex Apex', email: 'alex@apex.com', status: 'ACTIVE', type: '大货转运大客户', regDate: '2025-04-20' },
    { id: 'cust_5', name: 'GlobalEcom(环球跨境)', code: 'GlobalEcom(1108552)', contact: 'Gavin Glo', email: 'gavin@globalecom.com', status: 'ACTIVE', type: '全链条托管', regDate: '2025-05-11' }
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('一件代发专营');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    const newCust = {
      id: `cust_${Date.now()}`,
      name,
      code,
      contact: contact || '未填',
      email: email || '未填',
      status: 'ACTIVE',
      type,
      regDate: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [...prev, newCust]);
    setIsAddOpen(false);
    setName('');
    setCode('');
    setContact('');
    setEmail('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800">入驻商户名录</h3>
          <p className="text-xs text-slate-400">核对并备案所有共享本 WMS 物理库存并建立独立账单系统的客户</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>登记新客户</span>
        </button>
      </div>

      {isAddOpen && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Clipboard className="w-4 h-4 text-blue-600" />
            <span>登记商户合作契约</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">商户全称 *</label>
              <input
                type="text"
                required
                placeholder="客户中文或英文全名"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">商户简称 / 结算识别码 *</label>
              <input
                type="text"
                required
                placeholder="eg: Yukon(1108037)"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">合作类型 *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="一件代发专营">一件代发专营</option>
                <option value="FBA中转+一件代发">FBA中转+一件代发</option>
                <option value="包材定制客户">包材定制客户</option>
                <option value="全链条托管">全链条托管</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">首要联系人</label>
              <input
                type="text"
                placeholder="联系人中文姓名"
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">联系人通知 Email</label>
              <input
                type="email"
                placeholder="billing@customer.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
            >
              备案登记
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th className="px-4 py-2.5">商户识别码</th>
              <th className="px-4 py-2.5">商户全称</th>
              <th className="px-4 py-2.5">联系人</th>
              <th className="px-4 py-2.5">电子邮箱</th>
              <th className="px-4 py-2.5">合作模式</th>
              <th className="px-4 py-2.5">入驻时间</th>
              <th className="px-4 py-2.5">签约状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-[#062B66]">{cust.code}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{cust.name}</td>
                <td className="px-4 py-3">{cust.contact}</td>
                <td className="px-4 py-3 font-mono">{cust.email}</td>
                <td className="px-4 py-3">{cust.type}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{cust.regDate}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    合作中
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   6. BILLING RULES MODULE
   ============================================================================ */
function BillingRules() {
  const [rules, setRules] = useState({
    storageCost: 0.15, // per cubic meter per day
    outboundFeeSingle: 1.50, // basic fee for single item outbound
    outboundFeeMulti: 2.20,  // basic fee for multi-item outbound
    labelServiceFee: 0.25,   // additional label paste charge
    discountRateUsps: 15,    // USPS client standard discount percent
    discountRateFedex: 10    // FedEx client standard discount percent
  });

  const [testVolume, setTestVolume] = useState('2.5');
  const [testDays, setTestDays] = useState('30');
  const [testType, setTestType] = useState('single');
  const [testLabels, setTestLabels] = useState('1');

  const computedStorage = parseFloat(testVolume) * rules.storageCost * parseFloat(testDays);
  const computedOutbound = testType === 'single' ? rules.outboundFeeSingle : rules.outboundFeeMulti;
  const computedLabels = rules.labelServiceFee * parseFloat(testLabels);
  const computedTotal = computedStorage + computedOutbound + computedLabels;

  const handleSaveRules = () => {
    alert('全局商户计费规则与出库贴标手续费率已成功保存至财务规则数据库！');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">仓储与出库计费规则</h3>
        <p className="text-xs text-slate-400">设置对代发商户收取的日常仓储物理空间占用费、出库拣选打单手续费及耗材贴标单价</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Left Rules Editor Form */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-100 uppercase tracking-wider">全局收费单价设定</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">日常体积容积存储费 ($ / m³ / 天)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rules.storageCost}
                    onChange={e => setRules(prev => ({ ...prev, storageCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">单品单件出库作业费 ($ / 单)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rules.outboundFeeSingle}
                    onChange={e => setRules(prev => ({ ...prev, outboundFeeSingle: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">单品多件 / 多品多件基本费 ($ / 单)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rules.outboundFeeMulti}
                    onChange={e => setRules(prev => ({ ...prev, outboundFeeMulti: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">人工贴标 / 纸张增值服务费 ($ / 张)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rules.labelServiceFee}
                    onChange={e => setRules(prev => ({ ...prev, labelServiceFee: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">USPS 账面物流折扣比例 (%)</label>
                <div className="relative">
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">%</span>
                  <input
                    type="number"
                    value={rules.discountRateUsps}
                    onChange={e => setRules(prev => ({ ...prev, discountRateUsps: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-3 pr-8 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">FEDEX 账面物流折扣比例 (%)</label>
                <div className="relative">
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs">%</span>
                  <input
                    type="number"
                    value={rules.discountRateFedex}
                    onChange={e => setRules(prev => ({ ...prev, discountRateFedex: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-3 pr-8 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveRules}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-all shadow-sm cursor-pointer"
            >
              更新全部扣费费率
            </button>
          </div>
        </div>

        {/* Right Interactive Fee Calculator Simulator */}
        <div className="md:col-span-2 bg-[#062B66] text-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold">费率模拟计算沙箱</h4>
                <p className="text-[10px] text-white/60">实时验证当前设置费率在真实订单中的扣款表现</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-white/95">
              <div>
                <label className="block text-[10px] text-white/50 mb-1">测试货物体积 (m³)</label>
                <input
                  type="number"
                  value={testVolume}
                  onChange={e => setTestVolume(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">仓储天数 (Days)</label>
                  <input
                    type="number"
                    value={testDays}
                    onChange={e => setTestDays(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 mb-1">出库包裹类型</label>
                  <select
                    value={testType}
                    onChange={e => setTestType(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="single" className="text-slate-800">单品单件</option>
                    <option value="multi" className="text-slate-800">多品多件 / 单品多件</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-white/50 mb-1">贴箱标/发货标张数</label>
                <input
                  type="number"
                  value={testLabels}
                  onChange={e => setTestLabels(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/5 rounded-lg p-3.5 border border-white/5 space-y-2.5">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">计算结算清单</span>
            <div className="space-y-1.5 text-[11px] text-white/70 font-mono">
              <div className="flex justify-between">
                <span>1. 仓储空间租赁费:</span>
                <span className="text-white">${computedStorage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>2. 库内分拣装箱费:</span>
                <span className="text-white">${computedOutbound.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>3. 人工增值贴标费:</span>
                <span className="text-white">${computedLabels.toFixed(2)}</span>
              </div>
              <div className="h-[1px] bg-white/10 my-1"></div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-400">估计扣除商户账户总额:</span>
                <span className="text-amber-400 text-sm">${computedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. OPERATION LOGS MODULE (REAL INTEGRATION)
   ============================================================================ */
function OperationLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await logApi.getOperationLogs();
        if (data) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.detail || '').toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || l.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const availableModules = ['ALL', ...Array.from(new Set(logs.map(l => l.module).filter(Boolean)))];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">系统审计日志 (实时)</h3>
          <p className="text-xs text-slate-400">自动记录全部操作员在 NiceC WMS 内部执行的高危敏感交互，包括移位、生成波次和出库单删除等</p>
        </div>
        <div className="flex gap-2 self-stretch sm:self-auto text-xs">
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
          >
            {availableModules.map(m => (
              <option key={m} value={m}>{m === 'ALL' ? '全模块日志' : m}</option>
            ))}
          </select>
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索操作员, 描述, 编号..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none font-sans"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">正在从服务器审计链路拉取数据日志...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">没有找到符合当前过滤条件的审计日志。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-2.5">记录时间</th>
                  <th className="px-4 py-2.5">操作员账号</th>
                  <th className="px-4 py-2.5">所属模块</th>
                  <th className="px-4 py-2.5">执行操作</th>
                  <th className="px-4 py-2.5">详细审计描述</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{log.createdAt}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{log.username}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-blue-50 text-[#062B66] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{log.action}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-sm truncate" title={log.detail}>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   8. SYSTEM SETTINGS MODULE
   ============================================================================ */
function SystemSettings() {
  const [settings, setSettings] = useState({
    systemName: 'NiceC WMS 智能仓储大掌柜',
    defaultLang: 'zh-CN',
    enableSlack: true,
    enableEmail: true,
    alertEmail: 'alerts@nicec.net',
    slackWebhook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    syncInterval: '30'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('全局 WMS 系统设置参数已被成功锁定并应用！');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-800">全局系统参数设定</h3>
        <p className="text-xs text-slate-400 font-sans">配置 NiceC WMS 系统的对外显示名称、通知推送链路及自动轮询拉取频率</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">系统门户主标题 Name</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={e => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">系统主语言 Language</label>
            <select
              value={settings.defaultLang}
              onChange={e => setSettings(prev => ({ ...prev, defaultLang: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
            >
              <option value="zh-CN">中文简体 (zh-CN)</option>
              <option value="en-US">English (en-US)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">前置包裹拉单自动同步周期 (分钟)</label>
            <input
              type="number"
              value={settings.syncInterval}
              onChange={e => setSettings(prev => ({ ...prev, syncInterval: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">前置预警与通知推送链路</span>
          
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={settings.enableSlack}
                onChange={e => setSettings(prev => ({ ...prev, enableSlack: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
              />
              <span className="font-bold text-slate-700">推送包裹超时、出库卡面单异常警告到 Slack 频道</span>
            </label>

            {settings.enableSlack && (
              <div className="pl-5.5">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Slack Webhook URL</label>
                <input
                  type="text"
                  value={settings.slackWebhook}
                  onChange={e => setSettings(prev => ({ ...prev, slackWebhook: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-mono text-slate-400 focus:text-slate-800"
                />
              </div>
            )}

            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={settings.enableEmail}
                onChange={e => setSettings(prev => ({ ...prev, enableEmail: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
              />
              <span className="font-bold text-slate-700">每天自动打包异常清单和审计汇总发送到管理员邮箱</span>
            </label>

            {settings.enableEmail && (
              <div className="pl-5.5">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">报警接收人 Email</label>
                <input
                  type="email"
                  value={settings.alertEmail}
                  onChange={e => setSettings(prev => ({ ...prev, alertEmail: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-5 py-2 bg-[#062B66] hover:bg-[#062B66]/95 text-white font-bold rounded text-xs transition-all shadow-sm cursor-pointer"
          >
            保存全局参数设置
          </button>
        </div>
      </form>
    </div>
  );
}
