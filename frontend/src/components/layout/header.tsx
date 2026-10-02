'use client';

import React from 'react';
import { Search, Bell, Plus, Sparkles, Command } from 'lucide-react';

interface HeaderProps {
  onNewTaskClick?: () => void;
  onSearchChange?: (val: string) => void;
}

export function Header({ onNewTaskClick, onSearchChange }: HeaderProps) {
  return (
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
        {/* חיפוש בסגנון Command Palette */}
        <div className="relative w-96">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
              type="text"
              placeholder="חיפוש משימות מהיר (Elasticsearch)..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-12 pr-10 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          <Command className="h-2.5 w-2.5" /> K
        </span>
        </div>

        {/* בקרי צד שמאל */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Gemini 1.5 Active</span>
          </div>

          <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition-colors"
              title="התראות מערכת"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          </button>

          {onNewTaskClick && (
              <button
                  type="button"
                  onClick={onNewTaskClick}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>משימה חדשה</span>
              </button>
          )}
        </div>
      </header>
  );
}