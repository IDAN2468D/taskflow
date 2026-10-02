'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreateTaskRequest, Task, TaskPriority, TaskStatus, UpdateTaskRequest } from '@/types';
import { X, Sparkles, Loader2, Check, Paperclip, FileText, Download } from 'lucide-react';
import { api } from '@/lib/api';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskRequest, file?: File) => Promise<void>;
  taskToEdit?: Task | null;
  onUpdate?: (taskId: string, updates: UpdateTaskRequest, file?: File) => Promise<void>;
  initialStatus?: TaskStatus;
}

function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
  onUpdate,
  initialStatus = 'TODO',
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Breakdown state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'MEDIUM');
      setStatus(taskToEdit.status || (taskToEdit.completed ? 'DONE' : 'TODO'));
      setDueDate(taskToEdit.dueDate || '');
      setTags(taskToEdit.tags || []);
      setSelectedFile(null);
      setAiSubtasks([]);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus(initialStatus);
      setDueDate('');
      setTags([]);
      setSelectedFile(null);
      setAiSubtasks([]);
    }
  }, [taskToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAiDecompose = async () => {
    if (!title.trim()) return;
    setIsAiLoading(true);
    try {
      const suggestions = await api.getGeminiSuggestions(title + (description ? `: ${description}` : ''));
      if (suggestions && suggestions.length > 0) {
        setAiSubtasks(suggestions.map((s) => s.title));
      } else {
        const result = await api.decomposeWithAI(title + (description ? `: ${description}` : ''));
        if (result.subtasks && result.subtasks.length > 0) {
          setAiSubtasks(result.subtasks.map((st) => st.title));
        }
        if (result.recommendedPriority) {
          setPriority(result.recommendedPriority);
        }
      }
    } catch (err) {
      console.warn('AI Decomposition fallback:', err);
      setAiSubtasks([
        `אפיון טכני והגדרת ארכיטקטורה עבור: ${title}`,
        'מימוש רכיבי צד לקוח ו-API Endpoint',
        'אינטגרציית בסיס נתונים ושירותי Backend',
        'כתיבת בדיקות יחידה ואינטגרציה',
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const fullDescription =
      description +
      (aiSubtasks.length > 0
        ? `\n\nתתי-משימות שנוצרו ע"י AI:\n- ${aiSubtasks.join('\n- ')}`
        : '');

    try {
      if (taskToEdit && onUpdate) {
        await onUpdate(
          taskToEdit.id,
          {
            title,
            description: fullDescription,
            priority,
            status,
            completed: status === 'DONE',
            dueDate: dueDate || undefined,
            tags,
          },
          selectedFile || undefined
        );
      } else {
        await onSubmit(
          {
            title,
            description: fullDescription,
            priority,
            status,
            dueDate: dueDate || undefined,
            tags,
          },
          selectedFile || undefined
        );
      }
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExistingAttachment = async () => {
    if (taskToEdit?.id && taskToEdit?.attachmentFileName) {
      await api.downloadAttachment(taskToEdit.id, taskToEdit.attachmentFileName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {taskToEdit ? 'עריכת משימה' : 'יצירת משימה חדשה'}
              </h2>
              <p className="text-xs text-slate-500">
                {taskToEdit ? 'עדכן את פרטי המשימה והקבצים המצורפים' : 'מלא את הפרטים וצרף קבצים לפי הצורך'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">כותרת המשימה *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: הקמת Kafka Consumer להתראות משתמשים"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
            />
          </div>

          {/* AI Decomposition button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAiDecompose}
              disabled={isAiLoading || !title.trim()}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-3.5 py-1.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-purple-600" />}
              <span>✨ פרק משימה עם gemini-3.5-flash-lite</span>
            </button>
          </div>

          {/* AI Subtasks Preview */}
          {aiSubtasks.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/70 border border-purple-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-purple-600" />
                  הצעת חלוקה לתתי-משימות (gemini-3.5-flash-lite):
                </span>
                <button
                  type="button"
                  onClick={() => setAiSubtasks([])}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  נקה
                </button>
              </div>
              <ul className="text-xs text-purple-900 space-y-1.5 list-disc list-inside pr-1">
                {aiSubtasks.map((st, i) => (
                  <li key={i} className="leading-relaxed">{st}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תיאור ופרטים נוספים</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פירוט המשימה, מטרות, דגשים טכניים או דרישות..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">רמת עדיפות</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
              >
                <option value="LOW">נמוכה (Low)</option>
                <option value="MEDIUM">בינונית (Medium)</option>
                <option value="HIGH">גבוהה (High)</option>
                <option value="URGENT">דחופה (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">סטטוס משימה</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
              >
                <option value="TODO">לביצוע (To Do)</option>
                <option value="IN_PROGRESS">בתהליך (In Progress)</option>
                <option value="REVIEW">בבדיקה (Review)</option>
                <option value="DONE">הושלם (Done)</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תאריך יעד</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* File Attachment Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-indigo-600" />
                <span>קובץ מצורף (Attachment)</span>
              </label>
              {taskToEdit?.attachmentFileName && (
                <button
                  type="button"
                  onClick={handleDownloadExistingAttachment}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>הורד קובץ קיים</span>
                </button>
              )}
            </div>

            {taskToEdit?.attachmentFileName && !selectedFile && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span className="truncate max-w-xs font-medium">
                  {taskToEdit.attachmentFileName.includes('_')
                    ? taskToEdit.attachmentFileName.split('_').slice(1).join('_')
                    : taskToEdit.attachmentFileName}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mr-auto">
                  מצורף כעת
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="task-file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white hover:bg-indigo-50/50 border border-dashed border-indigo-300 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>{selectedFile ? 'החלף קובץ' : 'בחר קובץ להעלאה'}</span>
              </button>

              {selectedFile && (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 truncate">
                  <span className="font-semibold truncate max-w-[200px]">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-emerald-600 hover:text-emerald-900 font-bold"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              ניתן להעלות קובצי PDF, תמונות, מסמכים או קובצי קוד (הקובץ יישמר בשרת תחת תיקיית uploads)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תגיות (Tags)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="הוסף תגית (הקש Enter)..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 transition-all"
              >
                הוסף
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-indigo-400 hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{taskToEdit ? 'עדכן משימה' : 'שמור משימה'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal
