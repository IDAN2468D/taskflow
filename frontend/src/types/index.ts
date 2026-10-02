export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface Skill {
  id: string;
  name: string;
  category: string;
  colorHex?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  skills: Skill[];
  avatarUrl?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  assignee?: User;
  subTasks: SubTask[];
  tags: string[];
  attachmentsCount?: number;
  attachmentFileName?: string;
  completed?: boolean;
  aiSuggested?: boolean;
}

export interface GeminiSuggestion {
  title: string;
  description: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  tags?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
  tags?: string[];
}

export interface AIDecomposeResponse {
  parentTaskId?: string;
  suggestedTitle: string;
  subtasks: { title: string; estimatedMinutes?: number }[];
  recommendedPriority: TaskPriority;
  recommendedSkillCategory?: string;
}
