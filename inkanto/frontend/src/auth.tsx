import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import { setLocale } from "./i18n";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; display_name: string; family_code: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then((u) => {
        setUser(u);
        setLocale(u.locale);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const onAuth = (data: { token: string; user: User }) => {
    setToken(data.token);
    setUser(data.user);
    setLocale(data.user.locale);
  };

  const login = async (username: string, password: string) => {
    onAuth(await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }));
  };

  const register = async (data: { username: string; password: string; display_name: string; family_code: string }) => {
    onAuth(await api("/auth/register", { method: "POST", body: JSON.stringify(data) }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
