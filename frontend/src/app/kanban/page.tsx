'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskModal } from '@/components/tasks/task-modal';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '@/types';
import { api } from '@/lib/api';

const defaultTasks: Task[] = [
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
  {
    id: '4',
    title: 'בדיקות עומסים ואבטחת JWT',
    description: 'בדיקת תוקף טוקנים, מניעת CSRF וסריקת נקודות תורפה עם Qodana',
    status: 'REVIEW',
    completed: false,
    priority: 'MEDIUM',
    dueDate: '2026-10-14',
    createdAt: '2026-10-02',
    subTasks: [],
    tags: ['Security'],
  },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('TODO');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      if (data && data.length > 0) setTasks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('Using local fallback state while backend is warming up:', message);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setIsSearching(false);
      loadTasks();
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchTasks(query.trim());
        if (results && results.length > 0) {
          setTasks(results);
        }
      } catch (err) {
        console.warn('Elasticsearch search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const isDone = newStatus === 'DONE';
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completed: isDone } : t))
    );

    try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.warn('Backend sync error (persisting locally):', err);
    }
  };

  const handleToggleComplete = async (task: Task, completed: boolean) => {
    const newStatus: TaskStatus = completed ? 'DONE' : 'TODO';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed, status: newStatus } : t))
    );

    try {
      await api.toggleTaskCompleted(task, completed);
    } catch (err) {
      console.warn('Backend complete toggle error:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.warn('Backend delete sync error:', err);
    }
  };

  const handleCreateTask = async (newTaskData: CreateTaskRequest, file?: File) => {
    try {
      const created = await api.createTask(newTaskData, file);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      const localTask: Task = {
        id: String(Date.now()),
        title: newTaskData.title,
        description: newTaskData.description,
        status: newTaskData.status || targetColumnStatus,
        completed: (newTaskData.status || targetColumnStatus) === 'DONE',
        priority: newTaskData.priority,
        dueDate: newTaskData.dueDate,
        createdAt: new Date().toISOString(),
        subTasks: [],
        tags: newTaskData.tags || [],
        attachmentFileName: file ? file.name : undefined,
        attachmentsCount: file ? 1 : 0,
        aiSuggested: true,
      };
      setTasks((prev) => [localTask, ...prev]);
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (taskId: string, updates: UpdateTaskRequest, file?: File) => {
    try {
      const updated = await api.updateTask(taskId, updates, file);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...updates,
                attachmentFileName: file ? file.name : t.attachmentFileName,
                attachmentsCount: file ? 1 : t.attachmentsCount,
              }
            : t
        )
      );
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onNewTaskClick={() => {
            setTaskToEdit(null);
            setTargetColumnStatus('TODO');
            setIsModalOpen(true);
          }}
          onSearchChange={handleSearchChange}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top Board Meta Bar */}
          <div className="px-8 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>לוח משימות (Kanban Board)</span>
                {isSearching && (
                  <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">
                    מחפש ב-Elasticsearch...
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                סנכרון מלא עם Spring Boot REST API, העלאת קבצים ואירועי Kafka
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                מציג {filteredTasks.length} מתוך {tasks.length} משימות
              </span>
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="flex-1 overflow-hidden">
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onToggleComplete={handleToggleComplete}
              onNewTaskColumn={(status) => {
                setTaskToEdit(null);
                setTargetColumnStatus(status);
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleCreateTask}
        taskToEdit={taskToEdit}
        onUpdate={handleUpdateTask}
        initialStatus={targetColumnStatus}
      />
    </div>
  );
}
