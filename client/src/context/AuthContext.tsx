import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../lib/apiClient";

export interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("momentum_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem("momentum_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiRequest<{ user: User }>("/auth/me");
        setUser(res.user);
      } catch (err) {
        console.warn("Session verification failed, logging out:", err);
        localStorage.removeItem("momentum_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("momentum_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const data = await apiRequest<{ user: User; access_token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    });

    localStorage.setItem("momentum_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("momentum_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (displayName: string) => {
    const data = await apiRequest<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName }),
    });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
