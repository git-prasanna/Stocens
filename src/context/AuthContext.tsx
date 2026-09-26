import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/inventory';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  signup: (userData: { name: string; email: string; phone?: string; password: string; role?: string; department?: string }) => Promise<{ message: string; requiresVerification: boolean; email: string; otpPreview?: string }>;
  verifySignupOtp: (email: string, otp: string) => Promise<void>;
  resendVerificationOtp: (email: string) => Promise<{ message: string; otpPreview?: string }>;
  forgotPassword: (email: string) => Promise<{ message: string; email?: string; otpPreview?: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ valid: boolean; message: string }>;
  resetPassword: (email: string, otp: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for persistent verified session
    const storedUser = localStorage.getItem('stocksense_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        } else {
          localStorage.removeItem('stocksense_user');
        }
      } catch (e) {
        localStorage.removeItem('stocksense_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login({ email, password: pass });
    setUser(res.user);
    localStorage.setItem('stocksense_user', JSON.stringify(res.user));
    if (res.token) {
      localStorage.setItem('stocksense_token', res.token);
    }
  };

  const demoLogin = async () => {
    await login('alex@stocksense.io', 'stocksense123');
  };

  const signup = async (userData: { name: string; email: string; phone?: string; password: string; role?: string; department?: string }) => {
    return await api.auth.signup(userData);
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await api.auth.verifySignupOtp({ email, otp });
    setUser(res.user);
    localStorage.setItem('stocksense_user', JSON.stringify(res.user));
    if (res.token) {
      localStorage.setItem('stocksense_token', res.token);
    }
  };

  const resendVerificationOtp = async (email: string) => {
    return await api.auth.resendVerificationOtp(email);
  };

  const forgotPassword = async (email: string) => {
    return await api.auth.forgotPassword(email);
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    return await api.auth.verifyResetOtp({ email, otp });
  };

  const resetPassword = async (email: string, otp: string, pass: string) => {
    await api.auth.resetPassword({ email, otp, newPassword: pass });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stocksense_user');
    localStorage.removeItem('stocksense_token');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('stocksense_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        demoLogin,
        signup,
        verifySignupOtp,
        resendVerificationOtp,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

