'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from './task-card';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onNewTaskColumn?: (status: TaskStatus) => void;
  onToggleComplete?: ((task: Task, completed: boolean) => void) | ((taskId: string, currentStatus: boolean) => void);
  onEditTask?: (task: Task) => void;
  onSelectTask?: (task: Task) => void;
}

const columns: { status: TaskStatus; title: string; glow: string; countBadge: string }[] = [
  { status: 'TODO', title: 'לביצוע', glow: 'from-slate-500 to-slate-700', countBadge: 'bg-slate-800 text-slate-300 border-slate-700' },
  { status: 'IN_PROGRESS', title: 'בתהליך עבודה', glow: 'from-indigo-500 to-cyan-500', countBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { status: 'REVIEW', title: 'בבדיקה / אישור', glow: 'from-amber-500 to-orange-500', countBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { status: 'DONE', title: 'הושלם', glow: 'from-emerald-500 to-teal-500', countBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
];

function KanbanBoard({
  tasks,
  onStatusChange,
  onDeleteTask,
  onNewTaskColumn,
  onToggleComplete,
  onEditTask,
  onSelectTask,
}: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 h-full items-start overflow-x-auto">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-3xl p-4 flex flex-col max-h-[calc(100vh-160px)] min-w-[290px] shadow-lg relative overflow-hidden"
          >
            {/* קו תאורה בראש הטור */}
            <div className={`absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r ${col.glow}`} />

            {/* כותרת הטור */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-slate-200">{col.title}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.countBadge}`}>
                  {colTasks.length}
                </span>
              </div>

              {onNewTaskColumn && (
                <button
                  type="button"
                  onClick={() => onNewTaskColumn(col.status)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="הוסף משימה"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* רשימת המשימות בטור */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
              {colTasks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
                  אין משימות בעמודה זו
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onDelete={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                    onClick={() => {
                      if (onEditTask) {
                        onEditTask(task);
                      } else if (onSelectTask) {
                        onSelectTask(task);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KanbanBoard
