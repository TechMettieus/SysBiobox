import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@/types/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { sanitizeForFirestore } from "@/lib/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
  checkPermission: (module: string, action: string) => boolean;
  hasPermission?: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export function useAuthProvider() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    const stored = localStorage.getItem("bioboxsys_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setAuthState({ user: parsed, isAuthenticated: true, isLoading: false });
        return;
      } catch {
        localStorage.removeItem("bioboxsys_user");
      }
    }

    if (isFirebaseConfigured && auth) {
      const current = auth.currentUser;
      if (current) {
        const profileRef = doc(db!, "users", current.uid);
        const snap = await getDoc(profileRef);
        const profile = snap.exists() ? (snap.data() as any) : null;
        const authUser: AuthUser = {
          id: current.uid,
          name: profile?.name || current.email?.split("@")[0] || "Usuário",
          email: current.email || "",
          role: (profile?.role as any) || "seller",
          permissions: (profile?.permissions as any) || [
            "orders:read",
            "customers:read",
            "production:view",
            "products:view",
            "settings:view",
          ],
        };
        localStorage.setItem("bioboxsys_user", JSON.stringify(authUser));
        setAuthState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    }

    setAuthState((p) => ({ ...p, isLoading: false }));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (isFirebaseConfigured && auth && db) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        let profile = snap.exists() ? snap.data() : null;
        if (!profile) {
          profile = {
            id: uid,
            email,
            name: email.split("@")[0],
            role: "seller",
            permissions: [
              "orders:create",
              "orders:read",
              "customers:read",
              "production:view",
              "products:view",
            ],
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          };
          await setDoc(ref, sanitizeForFirestore(profile));
        }
        const authUser: AuthUser = {
          id: uid,
          name: (profile as any).name,
          email,
          role: (profile as any).role,
          permissions: (profile as any).permissions,
        };
        localStorage.setItem("bioboxsys_user", JSON.stringify(authUser));
        setAuthState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      // Fallback: read users from localStorage or default mock
      const storedUsers = localStorage.getItem("biobox_users");
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const found = users.find((u: any) => u.email === email);
      if (found && password === "password") {
        const authUser: AuthUser = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role as any,
          permissions: found.permissions || [],
        };
        localStorage.setItem("bioboxsys_user", JSON.stringify(authUser));
        setAuthState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      return false;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) await signOut(auth);
    } catch (e) {
      console.warn("Logout warning:", e);
    }
    localStorage.removeItem("bioboxsys_user");
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const checkPermission = (module: string, action: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === "admin") return true;
    const specific = `${module}:${action}`;
    if (authState.user.permissions.includes(specific)) return true;
    const full = `${module}-full`;
    if (authState.user.permissions.includes(full)) return true;
    if (authState.user.permissions.includes("all")) return true;

    const map: Record<string, string[]> = {
      "orders:view": ["orders-full", "orders:read", "orders:view"],
      "orders:create": ["orders-full", "orders:create"],
      "orders:edit": ["orders-full", "orders:edit"],
      "orders:delete": ["orders-full", "orders:delete"],
      "orders:approve": ["orders-full", "orders:approve", "orders:edit"],
      "orders:cancel": ["orders-full", "orders:cancel", "orders:delete"],
      "orders:advance": ["orders-full", "orders:advance", "orders:edit"],
      "orders:deliver": ["orders-full", "orders:deliver", "orders:edit"],
      "customers:view": ["customers-full", "customers:read", "customers:view"],
      "customers:create": ["customers-full", "customers:create"],
      "customers:edit": ["customers-full", "customers:edit"],
      "customers:delete": ["customers-full", "customers:delete"],
      "dashboard:view": ["dashboard:view", "all"],
      "production:view": ["production:view", "production-manage", "all"],
      "products:view": ["products:view", "products-manage", "all"],
      "settings:view": ["settings:view", "all"],
    };
    const key = `${module}:${action}`;
    return (map[key] || []).some((p) =>
      authState.user!.permissions.includes(p),
    );
  };

  return {
    ...authState,
    login,
    logout,
    checkAuthState,
    checkPermission,
    hasPermission: checkPermission,
  };
}

export { AuthContext };