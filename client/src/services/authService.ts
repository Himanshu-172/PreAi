import { AxiosError } from 'axios';
import { api } from './api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  name: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type AuthResponse = ApiEnvelope<{
  user: AuthUser;
  token: string;
}>;

type MeResponse = ApiEnvelope<{
  user: AuthUser;
}>;

type ErrorResponse = {
  message?: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data.data;
}

export async function loginUser(payload: AuthCredentials) {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get<MeResponse>('/auth/me');
  return response.data.data.user;
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return error.response?.data && typeof error.response.data === 'object'
      ? ((error.response.data as ErrorResponse).message ?? fallback)
      : fallback;
  }

  return fallback;
}
