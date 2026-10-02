import {
  AuthResponse,
  CreateTaskRequest,
  LoginRequest,
  RegisterRequest,
  Task,
  TaskStatus,
  User,
  AIDecomposeResponse,
  GeminiSuggestion,
  UpdateTaskRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('taskflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
      }
      const errObj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
      const message = (errObj?.message as string) || (typeof data === 'string' ? data : null) || res.statusText;
      throw new Error(message || `Request failed with status ${res.status}`);
    }

    return data as T;
  }

  // --- Auth APIs ---
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await this.request<{ token: string; username?: string; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.usernameOrEmail,
        password: credentials.password,
      }),
    });

    const username = data.username || credentials.usernameOrEmail;
    const user: User = data.user || {
      id: username,
      username,
      email: username.includes('@') ? username : `${username}@taskflow.local`,
      fullName: username,
      role: 'MEMBER',
      skills: [],
    };

    const authResponse: AuthResponse = {
      token: data.token,
      user,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_token', authResponse.token);
      localStorage.setItem('taskflow_user', JSON.stringify(authResponse.user));
    }
    return authResponse;
  }

  async register(details: RegisterRequest): Promise<AuthResponse> {
    await this.request<unknown>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: details.username,
        password: details.password,
      }),
    });

    return this.login({
      usernameOrEmail: details.username,
      password: details.password,
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.location.href = '/login';
    }
  }

  // --- Task APIs ---
  async getTasks(params?: { status?: TaskStatus; completed?: boolean | null; search?: string }): Promise<Task[]> {
    if (params?.search && params.search.trim()) {
      return this.searchTasks(params.search.trim());
    }

    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.completed !== undefined && params?.completed !== null) {
      query.append('completed', String(params.completed));
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';

    interface RawBackendTask {
      id: number | string;
      title: string;
      description?: string;
      completed?: boolean;
      status?: TaskStatus;
      priority?: Task['priority'];
      dueDate?: string;
      createdAt?: string;
      updatedAt?: string;
      subTasks?: Task['subTasks'];
      tags?: string[];
      attachmentFileName?: string;
      aiSuggested?: boolean;
    }

    const rawList = await this.request<RawBackendTask[]>(`/tasks${queryString}`);
    if (!Array.isArray(rawList)) return [];

    return rawList.map((t) => ({
      id: String(t.id),
      title: t.title,
      description: t.description,
      status: t.status || (t.completed ? 'DONE' : 'TODO'),
      completed: t.completed ?? false,
      priority: t.priority || 'MEDIUM',
      dueDate: t.dueDate,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt,
      subTasks: t.subTasks || [],
      tags: t.tags || [],
      attachmentFileName: t.attachmentFileName,
      attachmentsCount: t.attachmentFileName ? 1 : 0,
      aiSuggested: t.aiSuggested || false,
    }));
  }

  async searchTasks(query: string): Promise<Task[]> {
    interface EsHit {
      _id: string;
      _source: {
        taskId?: number | string;
        title: string;
        description?: string;
        completed?: boolean;
        createdAt?: string;
      };
    }
    interface EsSearchResponse {
      hits?: {
        hits?: EsHit[];
      };
    }

    const res = await this.request<EsSearchResponse>(`/tasks/search?query=${encodeURIComponent(query)}`);
    const hits = res?.hits?.hits || [];

    return hits.map((h) => ({
      id: String(h._source?.taskId || h._id),
      title: h._source?.title || 'ללא כותרת',
      description: h._source?.description,
      status: h._source?.completed ? 'DONE' : 'TODO',
      completed: h._source?.completed ?? false,
      priority: 'MEDIUM',
      createdAt: h._source?.createdAt || new Date().toISOString(),
      subTasks: [],
      tags: ['Elasticsearch'],
      attachmentsCount: 0,
      aiSuggested: false,
    }));
  }

  async createTask(task: CreateTaskRequest, file?: File): Promise<Task> {
    interface RawCreatedTask {
      id: number | string;
      title: string;
      description?: string;
      completed?: boolean;
      createdAt?: string;
      attachmentFileName?: string;
    }

    const res = await this.request<RawCreatedTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        completed: task.status === 'DONE',
      }),
    });

    let attachmentFileName = res.attachmentFileName;
    if (file) {
      try {
        const withAttachment = await this.uploadAttachment(String(res.id), file);
        attachmentFileName = withAttachment.attachmentFileName;
      } catch (uploadErr) {
        console.error('Failed to upload attachment for newly created task:', uploadErr);
      }
    }

    return {
      id: String(res.id),
      title: res.title,
      description: res.description,
      status: task.status || (res.completed ? 'DONE' : 'TODO'),
      completed: res.completed ?? false,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: res.createdAt || new Date().toISOString(),
      subTasks: [],
      tags: task.tags || [],
      attachmentFileName,
      attachmentsCount: attachmentFileName ? 1 : 0,
      aiSuggested: true,
    };
  }

  async updateTask(taskId: string, updates: UpdateTaskRequest, file?: File): Promise<Task> {
    interface RawUpdatedTask {
      id: number | string;
      title: string;
      description?: string;
      completed?: boolean;
      createdAt?: string;
      attachmentFileName?: string;
    }

    const res = await this.request<RawUpdatedTask>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        completed: updates.completed !== undefined ? updates.completed : (updates.status === 'DONE'),
      }),
    });

    let attachmentFileName = res.attachmentFileName;
    if (file) {
      try {
        const withAttachment = await this.uploadAttachment(taskId, file);
        attachmentFileName = withAttachment.attachmentFileName;
      } catch (uploadErr) {
        console.error('Failed to upload attachment on task update:', uploadErr);
      }
    }

    return {
      id: String(res.id),
      title: res.title,
      description: res.description,
      status: updates.status || (res.completed ? 'DONE' : 'TODO'),
      completed: res.completed ?? false,
      priority: updates.priority || 'MEDIUM',
      dueDate: updates.dueDate,
      createdAt: res.createdAt || new Date().toISOString(),
      subTasks: [],
      tags: updates.tags || [],
      attachmentFileName,
      attachmentsCount: attachmentFileName ? 1 : 0,
    };
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(taskId, { status, completed: status === 'DONE' });
  }

  async toggleTaskCompleted(task: Task, completed: boolean): Promise<Task> {
    return this.updateTask(task.id, {
      title: task.title,
      description: task.description,
      completed,
      status: completed ? 'DONE' : 'TODO',
      priority: task.priority,
      dueDate: task.dueDate,
      tags: task.tags,
    });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    await this.request<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async uploadAttachment(taskId: string, file: File): Promise<Task> {
    const url = `${API_BASE_URL}/tasks/${taskId}/attachment`;
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {
      ...this.getAuthHeader(),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'העלאת הקובץ נכשלה');
    }

    const updatedTask = await res.json();
    return {
      id: String(updatedTask.id),
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.completed ? 'DONE' : 'TODO',
      completed: updatedTask.completed ?? false,
      priority: 'MEDIUM',
      createdAt: updatedTask.createdAt || new Date().toISOString(),
      subTasks: [],
      tags: [],
      attachmentFileName: updatedTask.attachmentFileName,
      attachmentsCount: updatedTask.attachmentFileName ? 1 : 0,
    };
  }

  async downloadAttachment(taskId: string, originalFileName: string): Promise<void> {
    const url = `${API_BASE_URL}/tasks/${taskId}/attachment`;
    const res = await fetch(url, {
      headers: this.getAuthHeader(),
    });

    if (!res.ok) {
      throw new Error('שגיאה בהורדת הקובץ המצורף');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const cleanName = originalFileName.includes('_')
      ? originalFileName.split('_').slice(1).join('_')
      : originalFileName;
    link.download = cleanName || originalFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async getGeminiSuggestions(prompt: string): Promise<GeminiSuggestion[]> {
    const suggestions = await this.request<GeminiSuggestion[]>('/tasks/ai-suggest', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return Array.isArray(suggestions) ? suggestions : [];
  }

  // --- AI Gemini Task Decomposition ---
  async decomposeWithAI(prompt: string, parentTaskId?: string): Promise<AIDecomposeResponse> {
    try {
      const suggestions = await this.request<{ title: string; description?: string }[]>('/tasks/ai-suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });

      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return {
          suggestedTitle: suggestions[0]?.title || prompt,
          subtasks: suggestions.map((s) => ({ title: s.title })),
          recommendedPriority: 'HIGH',
        };
      }
    } catch (err) {
      console.warn('Backend ai-suggest failed or not reachable, checking fallback endpoint:', err);
    }

    try {
      return await this.request<AIDecomposeResponse>('/ai/decompose', {
        method: 'POST',
        body: JSON.stringify({ prompt, parentTaskId }),
      });
    } catch {
      return {
        suggestedTitle: prompt,
        subtasks: [
          { title: `אפיון דרישות וארכיטקטורה עבור: ${prompt}` },
          { title: 'מימוש רכיבי צד שרת ואינטגרציית בסיס נתונים' },
          { title: 'בניית ממשק משתמש ורכיבי צד לקוח' },
          { title: 'כתיבת בדיקות יחידה ואינטגרציה בסביבת Docker' },
        ],
        recommendedPriority: 'HIGH',
      };
    }
  }

  // --- Users & Skills ---
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async addSkillToUser(skillId: string): Promise<User> {
    return this.request<User>(`/bridge/user/skills/${skillId}`, {
      method: 'POST',
    });
  }

  async removeSkillFromUser(skillId: string): Promise<User> {
    return this.request<User>(`/bridge/user/skills/${skillId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
