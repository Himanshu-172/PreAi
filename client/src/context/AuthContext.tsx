import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken
} from '../services/api';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type AuthCredentials,
  type AuthUser,
  type RegisterPayload
} from '../services/authService';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getStoredAuthToken();

      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const restoredUser = await getCurrentUser();

        if (isMounted) {
          setToken(storedToken);
          setUser(restoredUser);
        }
      } catch {
        clearStoredAuthToken();

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: AuthCredentials) => {
    const authData = await loginUser(payload);
    setStoredAuthToken(authData.token);
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const authData = await registerUser(payload);
    setStoredAuthToken(authData.token);
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      login,
      register,
      logout
    }),
    [isInitializing, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
