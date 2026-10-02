'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { TaskModal } from '@/components/tasks/task-modal';
import { Task, CreateTaskRequest, GeminiSuggestion, UpdateTaskRequest } from '@/types';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Kanban,
  Flame,
  Paperclip,
  Download,
  Trash2,
  Pencil,
  Search,
  Plus,
  Loader2,
  FileText,
  Layers,
} from 'lucide-react';

const mockInitialTasks: Task[] = [
  {
    id: '1',
    title: 'הגדרת פייפליין CI/CD עם GitHub Actions',
    description: 'בדיקות יחידה ואינטגרציה ל-JAR ובניית Docker Image אוטומטי',
    status: 'DONE',
    completed: true,
    priority: 'HIGH',
    dueDate: '2026-10-05',
    createdAt: '2026-10-01',
    subTasks: [
      { id: 's1', title: 'הגדרת H2 profile לטסטים', completed: true },
      { id: 's2', title: 'Mock ל-Kafka Producer', completed: true },
    ],
    tags: ['DevOps', 'CI/CD'],
  },
  {
    id: '2',
    title: 'מיגרציית ממשק מ-HTML ל-Next.js 15',
    description: 'הקמת שלד האפליקציה, App Router, Tailwind CSS ואינטגרציית REST API',
    status: 'IN_PROGRESS',
    completed: false,
    priority: 'URGENT',
    dueDate: '2026-10-08',
    createdAt: '2026-10-02',
    subTasks: [
      { id: 's3', title: 'יצירת לוח Kanban אינטראקטיבי', completed: true },
      { id: 's4', title: 'חיבור WebSockets (STOMP)', completed: false },
    ],
    tags: ['Frontend', 'Nextjs'],
    aiSuggested: true,
  },
  {
    id: '3',
    title: 'הקמת Kafka Consumer Service להתראות בזמן אמת',
    description: 'האזנה ל-TASK_CREATED ופרסום עדכונים חיים ל-WebSocket Topics',
    status: 'TODO',
    completed: false,
    priority: 'HIGH',
    dueDate: '2026-10-12',
    createdAt: '2026-10-02',
    subTasks: [],
    tags: ['Backend', 'Kafka'],
  },
];

function DashboardContent() {
  const [tasks, setTasks] = useState<Task[]>(mockInitialTasks);
  const [currentFilter, setCurrentFilter] = useState<boolean | null>(null); // null = all, false = active, true = completed
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Quick Create Form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // AI Breakdown state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<GeminiSuggestion[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTasks = async (filter: boolean | null = currentFilter, search: string = searchQuery) => {
    try {
      if (search.trim()) {
        setIsSearching(true);
        const searchResults = await api.searchTasks(search.trim());
        setTasks(searchResults);
        setIsSearching(false);
      } else {
        const data = await api.getTasks({ completed: filter });
        if (data && data.length > 0) {
          setTasks(data);
        } else if (data && data.length === 0 && filter !== null) {
          setTasks([]);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('Using fallback tasks:', message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .getTasks({ completed: currentFilter })
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setTasks(data);
        } else if (data && data.length === 0 && currentFilter !== null) {
          setTasks([]);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.log('Using fallback tasks:', message);
      });

    return () => {
      isMounted = false;
    };
  }, [currentFilter]);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setIsSearching(false);
      fetchTasks(currentFilter, '');
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      fetchTasks(currentFilter, val.trim());
    }, 300);
  };

  const handleFilterChange = (filter: boolean | null) => {
    setCurrentFilter(filter);
    setSearchQuery('');
  };

  // AI Gemini Actions
  const handleAskAi = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);

    try {
      const suggestions = await api.getGeminiSuggestions(aiPrompt.trim());
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      } else {
        const decomposed = await api.decomposeWithAI(aiPrompt.trim());
        if (decomposed.subtasks && decomposed.subtasks.length > 0) {
          setAiSuggestions(decomposed.subtasks.map((st) => ({ title: st.title, description: '' })));
        }
      }
    } catch (err) {
      console.warn('AI suggestions error:', err);
      setAiSuggestions([
        { title: `אפיון דרישות וארכיטקטורה עבור: ${aiPrompt}`, description: 'שלב תכנון ראשוני' },
        { title: 'מימוש רכיבי צד שרת ואינטגרציית DB', description: 'פיתוח שירותים ו-Entities' },
        { title: 'בניית רכיבי צד לקוח ב-Next.js 15', description: 'ממשק משתמש ו-State Management' },
        { title: 'בדיקות יחידה ואינטגרציה בסביבת Docker', description: 'בדיקות אימות ואיכות קוד' },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSingleAiTask = async (suggestion: GeminiSuggestion) => {
    try {
      const created = await api.createTask({
        title: suggestion.title,
        description: suggestion.description || undefined,
        priority: 'MEDIUM',
        status: 'TODO',
        tags: ['AI-Suggested'],
      });
      setTasks((prev) => [created, ...prev]);
      setAiSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title));
    } catch (err) {
      console.error('Error adding single AI task:', err);
    }
  };

  const handleAddAllAiTasks = async () => {
    for (const suggestion of aiSuggestions) {
      try {
        const created = await api.createTask({
          title: suggestion.title,
          description: suggestion.description || undefined,
          priority: 'MEDIUM',
          status: 'TODO',
          tags: ['AI-Suggested'],
        });
        setTasks((prev) => [created, ...prev]);
      } catch (err) {
        console.error('Error adding AI task in batch:', err);
      }
    }
    setAiSuggestions([]);
    setAiPrompt('');
  };

  // Quick Task Creation
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsQuickSubmitting(true);
    try {
      const created = await api.createTask(
        {
          title: quickTitle.trim(),
          description: quickDesc.trim() || undefined,
          priority: 'MEDIUM',
          status: 'TODO',
        },
        quickFile || undefined
      );
      setTasks((prev) => [created, ...prev]);
      setQuickTitle('');
      setQuickDesc('');
      setQuickFile(null);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    } catch (err) {
      console.error('Error creating quick task:', err);
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  // Toggle Completion
  const handleToggleTask = async (task: Task, completed: boolean) => {
    const newStatus = completed ? 'DONE' : 'TODO';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed, status: newStatus } : t))
    );

    try {
      await api.toggleTaskCompleted(task, completed);
    } catch (err) {
      console.warn('Error toggling task completion:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.warn('Error deleting task:', err);
    }
  };

  // Download Attachment
  const handleDownloadAttachment = async (taskId: string, fileName: string) => {
    try {
      await api.downloadAttachment(taskId, fileName);
    } catch (err) {
      alert('שגיאה בהורדת הקובץ המצורף');
    }
  };

  // Modal Submit & Update
  const handleModalCreate = async (data: CreateTaskRequest, file?: File) => {
    try {
      const created = await api.createTask(data, file);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalUpdate = async (taskId: string, updates: UpdateTaskRequest, file?: File) => {
    try {
      const updated = await api.updateTask(taskId, updates, file);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const totalTasks = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS' || (!t.completed && t.status !== 'DONE')).length;
  const completed = tasks.filter((t) => t.completed || t.status === 'DONE').length;
  const urgentCount = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          onNewTaskClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          onSearchChange={handleSearchInput}
        />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                פלטפורמת TaskFlow Pro Enterprise
              </span>
              <h2 className="text-3xl font-black tracking-tight">
                ניהול משימות חכם, מבוזר ומבוסס בינה מלאכותית
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                ארכיטקטורה מלאה: צד לקוח מתקדם ב-Next.js 15, צד שרת ב-Spring Boot 3 (Headless REST API),
                תקשורת אירועים ב-Apache Kafka, חיפוש מהיר ב-Elasticsearch וסוכן gemini-3.5-flash-lite.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/kanban"
                  className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold px-5 py-2.5 rounded-xl text-sm shadow hover:bg-slate-100 transition-all"
                >
                  <Kanban className="h-4 w-4" />
                  <span>מעבר ללוח ה-Kanban</span>
                </Link>
                <Link
                  href="/ai-agent"
                  className="inline-flex items-center gap-2 bg-indigo-700/60 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-indigo-500/30 transition-all backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span>סוכן gemini-3.5-flash-lite</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">סה״כ משימות</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Kanban className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">פעילות / בתהליך</p>
                <h3 className="text-2xl font-black text-indigo-900 mt-1">{inProgress}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">הושלמו</p>
                <h3 className="text-2xl font-black text-emerald-900 mt-1">{completed}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">עדיפות גבוהה / דחופה</p>
                <h3 className="text-2xl font-black text-amber-900 mt-1">{urgentCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* AI Smart Task Breakdown Widget (Glassmorphism & Gemini) */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-pink-50/70 p-5 rounded-3xl border border-purple-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-purple-950">
                  AI Smart Task Breakdown (gemini-3.5-flash-lite)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                GenAI Automation
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                placeholder="הקלד יעד כללי (למשל: הכנה לראיון ב-Java, תכנון מעבר דירה, הקמת שירות Kafka)..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-purple-200 bg-white/90 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs md:text-sm shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={handleAskAi}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all text-xs md:text-sm shadow-md shadow-purple-600/20 whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isAiLoading ? 'חושב...' : '✨ פרק עם AI'}</span>
              </button>
            </div>

            {/* AI Results Preview */}
            {aiSuggestions.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-purple-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    תתי-משימות שהופקו על ידי ה-AI ({aiSuggestions.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAllAiTasks}
                    className="text-xs text-purple-600 hover:text-purple-800 font-bold underline transition-colors"
                  >
                    + הוסף את כל המשימות לרשימה
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {aiSuggestions.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50/50 hover:bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-purple-950">{item.title}</span>
                        {item.description && (
                          <p className="text-slate-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddSingleAiTask(item)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1 bg-white rounded-lg border border-purple-200 shadow-sm shrink-0 mr-3 transition-colors"
                      >
                        + הוסף
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Task Form (With File Attachment) */}
          <form
            onSubmit={handleQuickCreate}
            className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                <span>הוספת משימה מהירה (עם קובץ מצורף)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="כותרת המשימה..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
              />
              <input
                type="text"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                placeholder="תיאור המשימה (אופציונלי)..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-dashed border-slate-300">
                <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="file"
                  ref={quickFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setQuickFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full"
                />
                {quickFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFile(null);
                      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-red-500 text-xs font-bold"
                  >
                    נקה
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isQuickSubmitting || !quickTitle.trim()}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                {isQuickSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>+ שמור משימה</span>
              </button>
            </div>
          </form>

          {/* Elasticsearch Live Search Bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="🔍 חפש ב-Elasticsearch (כותרת, תיאור, תוכן)..."
              className="w-full pl-24 pr-10 py-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all shadow-inner"
            />
            {isSearching && (
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                מחפש...
              </span>
            )}
          </div>

          {/* Filtering Tabs & Counters */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange(null)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentFilter === null
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  הכל
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange(false)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentFilter === false
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  פעילות
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange(true)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentFilter === true
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  הושלמו
                </button>
              </div>

              {/* Counter Badge */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-200">
                  {searchQuery
                    ? `${tasks.length} תוצאות חיפוש ב-Elasticsearch`
                    : `${tasks.length} משימות`}
                </span>
                <Link
                  href="/kanban"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>לוח Kanban</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                אין משימות להצגה בסינון הנוכחי.
              </div>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => {
                  const isDone = task.completed || task.status === 'DONE';
                  const cleanAttachment = task.attachmentFileName
                    ? task.attachmentFileName.includes('_')
                      ? task.attachmentFileName.split('_').slice(1).join('_')
                      : task.attachmentFileName
                    : null;

                  return (
                    <li
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                        isDone
                          ? 'bg-slate-50/80 border-slate-200/70 opacity-75'
                          : 'bg-white border-slate-200/90 shadow-sm hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Checkbox and Text */}
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={(e) => handleToggleTask(task, e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-indigo-600 rounded cursor-pointer transition-all"
                          />
                          <div className="min-w-0">
                            <h4
                              className={`font-bold text-sm ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed whitespace-pre-line">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setTaskToEdit(task);
                              setIsModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                            title="ערוך משימה"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors text-xs font-bold"
                            title="מחק משימה"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Attachment Bar */}
                      {cleanAttachment && (
                        <div className="mr-8 pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(task.id, task.attachmentFileName!)}
                            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="truncate max-w-[220px] font-medium">{cleanAttachment}</span>
                            <span className="text-[10px] text-indigo-600 font-bold mr-1 flex items-center gap-0.5">
                              <Download className="h-3 w-3" />
                              הורד
                            </span>
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* Modal for Creating / Editing Task */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleModalCreate}
        taskToEdit={taskToEdit}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
}

export default function HomePage() {
  return <DashboardContent />;
}
