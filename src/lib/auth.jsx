import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth as authApi, token, DEMO, demoUserFor } from "./api";
import { PLANS } from "./mock";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token.get()) {
        setReady(true);
        return;
      }
      try {
        const r = await authApi.me();
        if (!cancelled) setUser(r?.user ?? null);
      } catch {
        token.set(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (creds) => {
    const r = await authApi.login(creds);
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback(async (data) => {
    const r = await authApi.register(data);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  /* Demo convenience: jump straight into either side of the product without
     a backend. Wired to the "Explore the demo" buttons. */
  const demoSignIn = useCallback((as = "user") => {
    token.set(`demo:${as}`);
    setUser(demoUserFor(as));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, ready, login, register, logout, demoSignIn, isDemo: DEMO }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* Workers ("member") and read-only seats ("viewer") get the worker
   workspace. Owners get everything. */
export const isWorker = (user) => user?.role === "member" || user?.role === "viewer";

export const planFor = (user) => PLANS.find((p) => p.id === user?.plan) || null;

/* Team chat and extra seats come with Growth and Agency. */
export const hasTeamChat = (user) => !!planFor(user)?.limits.teamChat;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
