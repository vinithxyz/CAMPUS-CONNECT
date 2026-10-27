import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: typeof authService.login;
  register: typeof authService.register;
  google: typeof authService.google;
  logout: () => Promise<void>;
  updateUser: (u: User) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const wrap =
    <A extends unknown[]>(fn: (...a: A) => Promise<User>) =>
    async (...a: A) => {
      const u = await fn(...a);
      setUser(u);
      return u;
    };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      logout,
      updateUser,
      login: wrap(authService.login),
      register: wrap(authService.register),
      google: wrap(authService.google),
    }),
    [user, loading, logout, updateUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};
