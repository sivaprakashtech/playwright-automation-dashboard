import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

let currentUser: User | null = authService.getStoredUser();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const listener = () => setUser(currentUser);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      currentUser = response.user;
      notifyListeners();
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    currentUser = null;
    notifyListeners();
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && authService.isAuthenticated();

  return { user, isLoading, login, logout, isAdmin, isAuthenticated };
}
