import React, { useState } from 'react';
import { authApi } from '../api';
import { KeyRound, User, Loader2, ShieldCheck, Box } from 'lucide-react';
import NiceCLogo from './NiceCLogo';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('neal@nicec.net');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(username, password);
      if (data.status === 'success') {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || '登录失败，请检查用户名或密码。');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络连接失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Visual background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-800/85 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 border border-slate-750 rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 mb-4 animate-pulse">
            <NiceCLogo size={42} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">NiceC WMS 仓库管理系统</h1>
          <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-widest">NiceC Warehouse Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-200 text-xs flex items-start gap-2 animate-shake">
            <span className="font-semibold">错误:</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="username">
              用户账号 (登录邮箱)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名或注册邮箱"
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="password">
              登录密码
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <KeyRound className="w-4.5 h-4.5" />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码"
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center text-slate-400 select-none cursor-pointer">
              <input type="checkbox" defaultChecked className="mr-1.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0" />
              记住我的账号
            </label>
            <a href="#" className="text-blue-400 hover:underline">忘记密码？</a>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-blue-600/15 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在安全认证中...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                立即登录
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/40 text-center">
          <p className="text-slate-500 text-[11px]">演示环境可用账号：</p>
          <div className="flex justify-center gap-4 mt-2 text-slate-400 text-xs font-mono">
            <div>
              <span className="text-slate-500">管理员:</span> neal@nicec.net
            </div>
            <div>
              <span className="text-slate-500">操作员:</span> operator
            </div>
          </div>
          <div className="text-[10px] text-slate-600 mt-2">密码随意输入即可</div>
        </div>
      </div>
    </div>
  );
}
