import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
});

export const AUTH_TOKEN_KEY = 'prepai.authToken';

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export type PracticeModule = 'DSA' | 'SQL' | 'Aptitude';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type ApiQuestion = {
  _id: string;
  questionId: number;
  module: PracticeModule;
  title: string;
  difficulty: QuestionDifficulty;
  category: string;
  companies: string[];
  estimatedTime: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiProgress = {
  _id: string;
  userId: string;
  module: PracticeModule;
  questionId: number;
  solved: boolean;
  favorite: boolean;
  notes: string;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type QuestionQuery = {
  module?: PracticeModule;
  search?: string;
  difficulty?: QuestionDifficulty;
  category?: string;
  company?: string;
};

type ModuleQuery = {
  module?: PracticeModule;
};

type ProgressPayload = {
  module: PracticeModule;
  questionId: number;
  solved?: boolean;
  favorite?: boolean;
  notes?: string;
};

type FavoritePayload = {
  module: PracticeModule;
  questionId: number;
  favorite?: boolean;
};

type NotesPayload = {
  module: PracticeModule;
  questionId: number;
  notes: string;
};

function compactParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
}

export async function getQuestions(query: QuestionQuery = {}) {
  const response = await api.get<ApiEnvelope<{ questions: ApiQuestion[] }>>('/questions', {
    params: compactParams(query)
  });
  return response.data.data.questions;
}

export async function getQuestion(id: number) {
  const response = await api.get<ApiEnvelope<{ question: ApiQuestion }>>(`/questions/${id}`);
  return response.data.data.question;
}

export async function getProgress(query: ModuleQuery = {}) {
  const response = await api.get<ApiEnvelope<{ progress: ApiProgress[] }>>('/progress', {
    params: compactParams(query)
  });
  return response.data.data.progress;
}

export async function saveProgress(payload: ProgressPayload) {
  const response = await api.post<ApiEnvelope<{ progress: ApiProgress }>>('/progress', payload);
  return response.data.data.progress;
}

export async function updateProgress(questionId: number, payload: Omit<ProgressPayload, 'questionId'>) {
  const response = await api.patch<ApiEnvelope<{ progress: ApiProgress }>>(`/progress/${questionId}`, payload);
  return response.data.data.progress;
}

export async function getFavorites(query: ModuleQuery = {}) {
  const response = await api.get<ApiEnvelope<{ favorites: ApiProgress[] }>>('/favorites', {
    params: compactParams(query)
  });
  return response.data.data.favorites;
}

export async function saveFavorite(payload: FavoritePayload) {
  const response = await api.post<ApiEnvelope<{ progress: ApiProgress }>>('/favorites', payload);
  return response.data.data.progress;
}

export async function removeFavorite(module: PracticeModule, questionId: number) {
  const response = await api.delete<ApiEnvelope<{ progress: ApiProgress | null }>>(`/favorites/${questionId}`, {
    data: { module }
  });
  return response.data.data.progress;
}

export async function getNotes(query: ModuleQuery = {}) {
  const response = await api.get<ApiEnvelope<{ notes: ApiProgress[] }>>('/notes', {
    params: compactParams(query)
  });
  return response.data.data.notes;
}

export async function saveNotes(payload: NotesPayload) {
  const response = await api.post<ApiEnvelope<{ progress: ApiProgress }>>('/notes', payload);
  return response.data.data.progress;
}

export async function updateNotes(questionId: number, payload: Omit<NotesPayload, 'questionId'>) {
  const response = await api.patch<ApiEnvelope<{ progress: ApiProgress }>>(`/notes/${questionId}`, payload);
  return response.data.data.progress;
}
