'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './task-card';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onToggleComplete?: (task: Task, completed: boolean) => void;
  onNewTaskColumn?: (status: TaskStatus) => void;
  onSelectTask?: (task: Task) => void;
}

const columns: { status: TaskStatus; title: string; countColor: string; headerColor: string }[] = [
  { status: 'TODO', title: 'לביצוע', countColor: 'bg-slate-200 text-slate-700', headerColor: 'border-slate-300' },
  { status: 'IN_PROGRESS', title: 'בתהליך עבודה', countColor: 'bg-indigo-100 text-indigo-700', headerColor: 'border-indigo-500' },
  { status: 'REVIEW', title: 'בבדיקה / אישור', countColor: 'bg-amber-100 text-amber-700', headerColor: 'border-amber-500' },
  { status: 'DONE', title: 'הושלם בהצלחה', countColor: 'bg-emerald-100 text-emerald-700', headerColor: 'border-emerald-500' },
];

export function KanbanBoard({
  tasks,
  onStatusChange,
  onDeleteTask,
  onEditTask,
  onToggleComplete,
  onNewTaskColumn,
  onSelectTask,
}: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 h-full items-start overflow-x-auto">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-4 flex flex-col max-h-[calc(100vh-140px)] min-w-[280px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 border-b-2 ${col.headerColor} mb-4`}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{col.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.countColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {onNewTaskColumn && (
                <button
                  onClick={() => onNewTaskColumn(col.status)}
                  className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors"
                  title="הוסף משימה לטור זה"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Task Cards Column List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
              {colTasks.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  אין משימות בסטטוס זה
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    onToggleComplete={onToggleComplete}
                    onClick={() => onSelectTask?.(task)}
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
