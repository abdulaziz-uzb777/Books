import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, getCurrentUser } from '../../utils/api';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  updateUser: (userData: UserProfile) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('accessToken');
    if (token) {
      getCurrentUser(token)
        .then(({ user }) => {
          setUser(user);
          setAccessToken(token);
        })
        .catch((error) => {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('accessToken');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: UserProfile) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  const updateUser = (userData: UserProfile) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}