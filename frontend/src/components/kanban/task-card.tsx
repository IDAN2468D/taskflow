'use client';

import React from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Calendar, CheckCircle2, Circle, Paperclip, Sparkles, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

interface TaskCardProps {
  task: Task & { attachmentFileName?: string };
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onClick?: () => void;
  onToggleComplete?: ((task: Task, completed: boolean) => void) | ((taskId: string, currentStatus: boolean) => void);
}

const priorityBadges: Record<TaskPriority, { border: string; dot: string; label: string }> = {
  URGENT: { border: 'border-red-500/30 bg-red-500/10 text-red-400', dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]', label: 'דחוף' },
  HIGH: { border: 'border-amber-500/30 bg-amber-500/10 text-amber-400', dot: 'bg-amber-500', label: 'גבוה' },
  MEDIUM: { border: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300', dot: 'bg-indigo-400', label: 'בינוני' },
  LOW: { border: 'border-slate-500/30 bg-slate-500/10 text-slate-400', dot: 'bg-slate-400', label: 'נמוך' },
};

const statusOrder: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

function TaskCard({ task, onStatusChange, onDelete, onClick, onToggleComplete }: TaskCardProps) {
  const currentIdx = statusOrder.indexOf(task.status);
  const prevStatus = currentIdx > 0 ? statusOrder[currentIdx - 1] : null;
  const nextStatus = currentIdx < statusOrder.length - 1 ? statusOrder[currentIdx + 1] : null;
  const isCompleted = task.status === 'DONE' || task.completed;
  const pStyle = priorityBadges[task.priority] || priorityBadges.MEDIUM;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleComplete) {
      (onToggleComplete as any)(task, !isCompleted);
    } else {
      onStatusChange(task.id, isCompleted ? 'IN_PROGRESS' : 'DONE');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel glass-panel-hover rounded-2xl p-4 transition-all duration-300 cursor-pointer group relative ${
        isCompleted ? 'opacity-65' : ''
      }`}
    >
      {/* סרגל עליון */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* טוגל השלמה מהיר */}
          <button
            type="button"
            onClick={handleToggle}
            className="text-slate-500 hover:text-emerald-400 transition-colors"
          >
            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4" />}
          </button>

          {/* תג עדיפות מעוצב */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pStyle.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pStyle.dot}`} />
            {pStyle.label}
          </span>

          {task.aiSuggested && (
            <span className="inline-flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" /> AI
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
          title="מחק משימה"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* כותרת ותיאור */}
      <h4 className={`text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors ${isCompleted ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* קובץ מצורף */}
      {task.attachmentFileName && (
        <div className="mt-3 flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl px-2.5 py-1 text-[11px] text-slate-300">
          <Paperclip className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="truncate">{task.attachmentFileName}</span>
        </div>
      )}

      {/* סרגל תחתון */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('he-IL') : 'ללא יעד'}</span>
        </div>

        {/* חיצי העברת סטטוס */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {prevStatus && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, prevStatus)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title={`החזר ל-${prevStatus}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {nextStatus && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, nextStatus)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title={`קדם ל-${nextStatus}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard
