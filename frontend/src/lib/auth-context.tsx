'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (details: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('taskflow_token');
    const savedUser = localStorage.getItem('taskflow_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse stored user profile', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const res = await api.login(credentials);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (details: RegisterRequest) => {
    const res = await api.register(details);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.logout();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
