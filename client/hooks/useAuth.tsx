import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, defaultPermissions, Permission } from "@/types/user";
import { db, auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkPermission: (module: string, action: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao inicializar
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        // Primeiro, tentar carregar do localStorage
        const storedUser = localStorage.getItem("biobox_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log("✅ Usuário carregado do localStorage:", userData.name);
        }

        // Se o Firebase estiver configurado, usar autenticação do Firebase
        if (isFirebaseConfigured && auth) {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              console.log("🔥 Usuário Firebase autenticado:", firebaseUser.email);
              
              // Buscar dados completos do usuário no Firestore
              try {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const permissions = (userData.permissions || []).map((permId: string) => 
                    defaultPermissions.find(p => p.id === permId) || 
                    { id: permId, name: permId, module: "system", actions: [] }
                  );

                  const fullUser: User = {
                    id: firebaseUser.uid,
                    name: userData.name || firebaseUser.displayName || "Usuário",
                    email: firebaseUser.email || "",
                    role: userData.role || "seller",
                    permissions: permissions,
                    status: userData.status || "active",
                    createdAt: userData.created_at?.toDate() || new Date(),
                    updatedAt: userData.updated_at?.toDate() || new Date(),
                    createdBy: userData.created_by || "system",
                  };

                  setUser(fullUser);
                  localStorage.setItem("biobox_user", JSON.stringify(fullUser));
                  console.log("✅ Dados do usuário atualizados do Firestore");
                } else {
                  // Se não existir no Firestore, criar um documento básico
                  const basicUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || "Usuário",
                    email: firebaseUser.email || "",
                    role: "seller",
                    permissions: defaultPermissions.filter(p => 
                      ["orders-full", "customers-full"].includes(p.id)
                    ),
                    status: "active",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: "system",
                  };

                  await setDoc(doc(db, "users", firebaseUser.uid), {
                    name: basicUser.name,
                    email: basicUser.email,
                    role: basicUser.role,
                    permissions: basicUser.permissions.map(p => p.id),
                    status: basicUser.status,
                    created_at: basicUser.createdAt,
                    updated_at: basicUser.updatedAt,
                    created_by: basicUser.createdBy,
                  });

                  setUser(basicUser);
                  localStorage.setItem("biobox_user", JSON.stringify(basicUser));
                  console.log("✅ Novo documento de usuário criado no Firestore");
                }
              } catch (error) {
                console.error("❌ Erro ao buscar dados do usuário:", error);
                // Usar dados básicos do Firebase Auth
                const fallbackUser: User = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário",
                  email: firebaseUser.email || "",
                  role: "seller",
                  permissions: defaultPermissions.filter(p => 
                    ["orders-full", "customers-full"].includes(p.id)
                  ),
                  status: "active",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  createdBy: "system",
                };
                setUser(fallbackUser);
                localStorage.setItem("biobox_user", JSON.stringify(fallbackUser));
              }
            } else {
              // Usuário não autenticado no Firebase
              console.log("👤 Nenhum usuário Firebase autenticado");
              // Manter o usuário do localStorage se existir
              const storedUser = localStorage.getItem("biobox_user");
              if (!storedUser) {
                setUser(null);
              }
            }
            setIsLoading(false);
          });

          return () => unsubscribe();
        } else {
          // Firebase não configurado - usar apenas localStorage
          console.log("📦 Usando modo offline (localStorage apenas)");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar usuário:", error);
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Tentar login com Firebase se configurado
      if (isFirebaseConfigured && auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log("✅ Login Firebase bem-sucedido:", userCredential.user.email);
          // O onAuthStateChanged vai cuidar de carregar os dados do usuário
          return true;
        } catch (firebaseError: any) {
          console.error("❌ Erro no login Firebase:", firebaseError.message);
          
          // Se for erro de rede, tentar login offline
          if (firebaseError.code === 'auth/network-request-failed') {
            console.log("🔄 Tentando login offline...");
            return loginOffline(email, password);
          }
          
          return false;
        }
      } else {
        // Login offline
        return loginOffline(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginOffline = (email: string, password: string): boolean => {
    // Login offline para desenvolvimento/teste
    const mockUsers = [
      {
        id: "admin-1",
        name: "Administrador",
        email: "admin@bioboxsys.com",
        password: "admin123",
        role: "admin" as const,
        permissions: defaultPermissions,
        status: "active" as const,
      },
      {
        id: "seller-1", 
        name: "Vendedor",
        email: "vendedor@bioboxsys.com",
        password: "vendedor123",
        role: "seller" as const,
        permissions: defaultPermissions.filter(p => 
          ["orders-full", "customers-full", "dashboard-view"].includes(p.id)
        ),
        status: "active" as const,
      }
    ];

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        permissions: foundUser.permissions,
        status: foundUser.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      };
      
      setUser(userData);
      localStorage.setItem("biobox_user", JSON.stringify(userData));
      localStorage.setItem("biobox_auth_token", `mock_token_${Date.now()}`);
      console.log("✅ Login offline bem-sucedido:", userData.name);
      return true;
    }
    
    return false;
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      
      setUser(null);
      localStorage.removeItem("biobox_user");
      localStorage.removeItem("biobox_auth_token");
      
      // Limpar outros dados do localStorage se necessário
      localStorage.removeItem("biobox_orders");
      localStorage.removeItem("biobox_customers");
      
      console.log("👋 Logout realizado com sucesso");
    } catch (error) {
      console.error("❌ Erro no logout:", error);
    }
  };

  const checkPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    
    return user.permissions.some(
      permission => 
        permission.module === module && 
        permission.actions.includes(action)
    );
  };

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    checkPermission,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}