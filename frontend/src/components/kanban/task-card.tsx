'use client';

import React from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import {
  Calendar,
  CheckSquare,
  Sparkles,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Download,
  Pencil,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onToggleComplete?: (task: Task, completed: boolean) => void;
  onClick?: () => void;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  URGENT: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const statusOrder: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
  onToggleComplete,
  onClick,
}: TaskCardProps) {
  const currentStatusIndex = statusOrder.indexOf(task.status);
  const prevStatus = currentStatusIndex > 0 ? statusOrder[currentStatusIndex - 1] : null;
  const nextStatus = currentStatusIndex < statusOrder.length - 1 ? statusOrder[currentStatusIndex + 1] : null;

  const isCompleted = task.completed || task.status === 'DONE';

  const completedSubtasks = task.subTasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subTasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const priorityStyle = priorityColors[task.priority] || priorityColors.MEDIUM;

  const cleanAttachmentName = task.attachmentFileName
    ? task.attachmentFileName.includes('_')
      ? task.attachmentFileName.split('_').slice(1).join('_')
      : task.attachmentFileName
    : null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.attachmentFileName) return;
    try {
      await api.downloadAttachment(task.id, task.attachmentFileName);
    } catch (err) {
      alert('שגיאה בהורדת הקובץ המצורף');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 border transition-all duration-200 space-y-3 cursor-pointer group shadow-sm hover:shadow-md ${
        isCompleted
          ? 'bg-slate-50/90 border-slate-200/90 opacity-80'
          : 'bg-white border-slate-200/90 hover:border-indigo-400'
      }`}
    >
      {/* Top Header: Priority Badge & AI Tag & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
            {task.priority}
          </span>
          {task.aiSuggested && (
            <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <Sparkles className="h-3 w-3 text-purple-600" />
              AI
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="ערוך משימה"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
                onDelete(task.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="מחק משימה"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Checkbox + Title & Description */}
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => {
            e.stopPropagation();
            onToggleComplete?.(task, e.target.checked);
          }}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
        />
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-bold transition-colors leading-snug ${
              isCompleted
                ? 'line-through text-slate-400'
                : 'text-slate-900 group-hover:text-indigo-600'
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Attachment Pill (if present) */}
      {cleanAttachmentName && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs font-semibold transition-all group/att"
            title="הורד קובץ מצורף"
          >
            <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[170px]">{cleanAttachmentName}</span>
            <Download className="h-3 w-3 text-indigo-500 group-hover/att:translate-y-0.5 transition-transform shrink-0 mr-1" />
          </button>
        </div>
      )}

      {/* Subtasks progress */}
      {totalSubtasks > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              תתי-משימות
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due date & Fast status movers */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('he-IL') : 'ללא יעד'}
          </span>
        </div>

        {/* Quick status transition buttons */}
        <div
          className="flex items-center gap-1 opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {prevStatus && (
            <button
              onClick={() => onStatusChange(task.id, prevStatus)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title={`העבר ל-${prevStatus}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(task.id, nextStatus)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title={`העבר ל-${nextStatus}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
