'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Sparkles,
  Award,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'דשבורד', href: '/', icon: LayoutDashboard },
    { name: 'לוח משימות (Kanban)', href: '/kanban', icon: Kanban },
    { name: 'סוכן AI (gemini-3.5-flash-lite)', href: '/ai-agent', icon: Sparkles },
    { name: 'מטריצת מיומנויות (Skill Matrix)', href: '/skills', icon: Award },
    { name: 'הגדרות', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-l border-slate-800 shadow-xl h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              TaskFlow Pro
            </h1>
            <span className="text-[11px] font-medium text-indigo-400">Enterprise AI</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white uppercase shadow">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.fullName || user?.username || 'משתמש מחובר'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@taskflow.local'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="התנתק"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
