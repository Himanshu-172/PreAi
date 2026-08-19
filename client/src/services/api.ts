import axios from 'axios';

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (import.meta.env.PROD) {
    if (!configuredBaseUrl) {
      throw new Error('VITE_API_BASE_URL must be configured for production builds');
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(configuredBaseUrl);
    } catch {
      throw new Error('VITE_API_BASE_URL must be an absolute HTTP or HTTPS URL for production builds');
    }

    const blockedProductionHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1']);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || blockedProductionHosts.has(parsedUrl.hostname)) {
      throw new Error('VITE_API_BASE_URL must be a non-local HTTP or HTTPS URL for production builds');
    }
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return 'http://localhost:5000/api';
}

export const api = axios.create({
  baseURL: getApiBaseUrl()
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

export type ResumeAnalysisStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export type MockInterviewType = 'Technical' | 'HR' | 'Mixed';
export type MockInterviewCategory = 'DSA' | 'SQL' | 'General CS' | 'HR' | 'Mixed';
export type MockInterviewDifficulty = QuestionDifficulty | 'Mixed';
export type MockInterviewStatus = 'in_progress' | 'completed' | 'abandoned';
export type MockInterviewEvaluationStatus = 'not_started' | 'processing' | 'completed' | 'failed';

export type ApiResumeStructuredAnalysis = {
  overallScore: number;
  atsScore: number;
  contentScore: number;
  formattingScore: number;
  skills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
};

export type ApiResumeAnalysis = {
  id: string;
  fileName: string;
  status: ResumeAnalysisStatus;
  analysis?: ApiResumeStructuredAnalysis | null;
  analyzedAt?: string | null;
  extractedText?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiMockInterviewQuestion = {
  index: number;
  source: 'Question' | 'Static';
  sourceKey: string;
  category: string;
  difficulty: QuestionDifficulty;
  questionText: string;
  userAnswer: string;
  answeredAt: string | null;
};

export type ApiMockInterviewQuestionFeedback = {
  questionIndex: number;
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  sampleBetterAnswer: string;
};

export type ApiMockInterviewEvaluation = {
  overallScore: number;
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  confidence: number;
  summary: string;
  recommendations: string[];
  questionFeedback: ApiMockInterviewQuestionFeedback[];
};

export type ApiMockInterview = {
  id: string;
  interviewType: MockInterviewType;
  category: MockInterviewCategory;
  difficulty: MockInterviewDifficulty;
  questionCount: 5 | 10;
  currentQuestionIndex: number;
  status: MockInterviewStatus;
  evaluationStatus: MockInterviewEvaluationStatus;
  evaluationProvider: 'openai' | 'ollama' | null;
  evaluation: ApiMockInterviewEvaluation | null;
  evaluatedAt: string | null;
  startedAt: string;
  completedAt: string | null;
  answeredCount: number;
  questions?: ApiMockInterviewQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type ApiAnalyticsActivity = {
  type: string;
  label: string;
  detail: string;
  timestamp: string | null;
};

export type ApiAnalytics = {
  practice: {
    dsaSolved: number;
    sqlSolved: number;
    aptitudeSolved: number;
    overallSolved: number;
    remaining: number;
    accuracy: number;
    totalQuestions: number;
    totalsByModule: Record<PracticeModule, number>;
    solvedByModule: Record<PracticeModule, number>;
    difficultyBreakdown: Record<PracticeModule, Record<QuestionDifficulty, number>>;
  };
  resume: {
    totalAnalyses: number;
    averageAtsScore: number;
    bestAtsScore: number;
    latestResumeAnalysis: {
      id: string;
      fileName: string;
      status: ResumeAnalysisStatus;
      atsScore: number | null;
      analyzedAt: string | null;
      createdAt: string | null;
    } | null;
  };
  mockInterview: {
    totalInterviews: number;
    completedInterviews: number;
    averageOverallScore: number;
    averageCommunication: number;
    averageTechnical: number;
    averageConfidence: number;
  };
  aiChat: {
    totalConversations: number;
    totalMessages: number;
    latestConversation: {
      id: string;
      title: string;
      messageCount: number;
      updatedAt: string | null;
    } | null;
  };
  overall: {
    totalActivity: number;
    overallProgress: number;
    favoriteCount: number;
    recentActivityTimeline: ApiAnalyticsActivity[];
  };
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

type CreateMockInterviewPayload = {
  interviewType: MockInterviewType;
  category?: MockInterviewCategory;
  difficulty: MockInterviewDifficulty;
  questionCount: 5 | 10;
};

type AnswerMockInterviewPayload = {
  questionIndex: number;
  answer: string;
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

export async function getAnalytics() {
  const response = await api.get<ApiEnvelope<{ analytics: ApiAnalytics }>>('/analytics');
  return response.data.data.analytics;
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

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await api.post<ApiEnvelope<{ analysis: ApiResumeAnalysis }>>('/resume/upload', formData);
  return response.data.data.analysis;
}

export async function getResumeHistory() {
  const response = await api.get<ApiEnvelope<{ analyses: ApiResumeAnalysis[] }>>('/resume/history');
  return response.data.data.analyses;
}

export async function getResumeAnalysis(id: string) {
  const response = await api.get<ApiEnvelope<{ analysis: ApiResumeAnalysis }>>(`/resume/${id}`);
  return response.data.data.analysis;
}

export async function analyzeResume(id: string) {
  const response = await api.post<ApiEnvelope<{ analysis: ApiResumeAnalysis }>>(`/resume/${id}/analyze`);
  return response.data.data.analysis;
}

export async function createMockInterview(payload: CreateMockInterviewPayload) {
  const response = await api.post<ApiEnvelope<{ interview: ApiMockInterview }>>('/mock-interviews', payload);
  return response.data.data.interview;
}

export async function getMockInterviewHistory() {
  const response = await api.get<ApiEnvelope<{ interviews: ApiMockInterview[] }>>('/mock-interviews');
  return response.data.data.interviews;
}

export async function getMockInterview(id: string) {
  const response = await api.get<ApiEnvelope<{ interview: ApiMockInterview }>>(`/mock-interviews/${id}`);
  return response.data.data.interview;
}

export async function answerMockInterview(id: string, payload: AnswerMockInterviewPayload) {
  const response = await api.patch<ApiEnvelope<{ interview: ApiMockInterview }>>(`/mock-interviews/${id}/answer`, payload);
  return response.data.data.interview;
}

export async function completeMockInterview(id: string) {
  const response = await api.post<ApiEnvelope<{ interview: ApiMockInterview }>>(`/mock-interviews/${id}/complete`);
  return response.data.data.interview;
}

export async function evaluateMockInterview(id: string) {
  const response = await api.post<ApiEnvelope<{ interview: ApiMockInterview }>>(`/mock-interviews/${id}/evaluate`);
  return response.data.data.interview;
}
