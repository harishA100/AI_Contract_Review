"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User, UserCreate, UserLogin, TokenResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Validate existing local token on startup
  useEffect(() => {
    async function checkAuth() {
      if (typeof window === "undefined") return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<User>("/auth/me");
        setUser(response.data);
      } catch (err: any) {
        console.error("Auth verification failed:", err);
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (data: UserLogin) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post<TokenResponse>("/auth/login", data);
      const token = response.data.access_token;
      
      // Store in localStorage for Axios client API requests
      localStorage.setItem("token", token);
      
      // Store in cookie for server-side Next.js middleware protection
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax;`;
      
      const userResponse = await api.get<User>("/auth/me");
      setUser(userResponse.data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Incorrect email or password.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: UserCreate) => {
    setError(null);
    setLoading(true);
    try {
      await api.post<User>("/auth/register", data);
      // Auto login upon successful registration
      await login({ email: data.email, password: data.password });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Email already in use or validation failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    router.push("/login");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
