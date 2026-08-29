import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/types";
import { api, getAuthToken, setAuthToken } from "@/services/api";

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  department: string;
}

const DEFAULT_USER: SessionUser = {
  name: "Dr. Nimal Perera",
  email: "nimal.perera@university.edu",
  role: "admin",
  department: "Computer Science",
};

interface AuthValue {
  user: SessionUser;
  setRole: (role: Role) => void;
  signOut: () => void;
  isLoading: boolean;
  login: (email: string, password: str) => Promise<void>;
  register: (name: string, email: string, role: string, dept: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: DEFAULT_USER,
  setRole: () => {},
  signOut: () => {},
  isLoading: false,
  login: async () => {},
  register: async () => {},
});

const PROFILES: Record<Role, SessionUser> = {
  admin: DEFAULT_USER,
  organizer: {
    name: "Kasun Fernando",
    email: "kasun.fernando@university.edu",
    role: "organizer",
    department: "Events Office",
  },
  participant: {
    name: "Meera Nair",
    email: "meera.nair@university.edu",
    role: "participant",
    department: "Design",
  },
};

// Maps for quick login
const DUMMY_CREDENTIALS: Record<Role, string> = {
  admin: "nimal.perera@university.edu",
  organizer: "kasun.fernando@university.edu",
  participant: "meera.nair@university.edu",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: load user from /auth/me or local switcher
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      const token = getAuthToken();
      if (token) {
        try {
          const response = await fetch("http://localhost:8000/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error(`Auth failed with status: ${response.status}`);
          }
          
          const fetchedUser = await response.json();
          
          if (fetchedUser && fetchedUser.role) {
            setUser({
              name: fetchedUser.name,
              email: fetchedUser.email,
              role: fetchedUser.role,
              department: fetchedUser.department || "",
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Token expired or server offline
          setAuthToken(null);
        }
      }
      
      // Fallback to role switcher state
      const storedRole = window.localStorage.getItem("sems-role") as Role | null;
      if (storedRole && storedRole in PROFILES) {
        setUser(PROFILES[storedRole]);
      }
      setIsLoading(false);
    }
    
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.user) {
      setUser({
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        department: res.user.department || "",
      });
      window.localStorage.setItem("sems-role", res.user.role);
    }
  };

  const register = async (name: string, email: string, role: string, dept: string) => {
    // Basic password for registrations created this way
    const res = await api.register({
      name,
      email,
      role,
      department: dept,
      password: "demo1234"
    });
    if (res.user) {
      setUser({
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        department: res.user.department || "",
      });
      window.localStorage.setItem("sems-role", res.user.role);
    }
  };

  const setRole = async (next: Role) => {
    window.localStorage.setItem("sems-role", next);
    setUser(PROFILES[next]);
    
    // Attempt login to sync token
    try {
      const email = DUMMY_CREDENTIALS[next];
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "demo1234" })
      }).then(r => r.json());
      
      if (res.accessToken) {
        setAuthToken(res.accessToken);
      }
    } catch (e) {
      // Backend not running — proceed in mock fallback mode
    }
  };

  const signOut = () => {
    api.logout();
    window.localStorage.removeItem("sems-role");
    setUser(PROFILES.participant);
  };

  const value = useMemo<AuthValue>(
    () => ({
      user,
      setRole,
      signOut,
      isLoading,
      login,
      register,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
