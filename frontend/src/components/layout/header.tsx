'use client';

import React from 'react';
import { Search, Bell, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onNewTaskClick?: () => void;
  onSearchChange?: (val: string) => void;
}

export function Header({ onNewTaskClick, onSearchChange }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="חיפוש משימות מהיר (Elasticsearch)..."
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-100/80 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span>gemini-3.5-flash-lite Active</span>
        </div>

        <button
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
          title="התראות Kafka"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {onNewTaskClick && (
          <button
            onClick={onNewTaskClick}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>משימה חדשה</span>
          </button>
        )}
      </div>
    </header>
  );
}
