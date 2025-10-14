import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { User as UserType, mockUsers, defaultPermissions } from "@/types/user";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { db, isFirebaseConfigured, auth, app } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { sanitizeForFirestore } from "@/lib/firestore";
import { useToast } from "@/components/ui/use-toast";

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { getUsers: fetchUsers } = useSupabase();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | undefined>();
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionUser, setPermissionUser] = useState<UserType | undefined>();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await fetchUsers();
      const parseDate = (val: any) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        if (typeof val === "string") {
          const d = new Date(val);
          return Number.isNaN(d.getTime()) ? undefined : d;
        }
        if (typeof val?.toDate === "function") {
          try {
            return val.toDate();
          } catch {
            return undefined;
          }
        }
        try {
          const d = new Date(val);
          return Number.isNaN(d.getTime()) ? undefined : d;
        } catch {
          return undefined;
        }
      };

      const formattedUsers: UserType[] = usersData.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role || "seller") as "admin" | "seller",
        status: u.status || "active",
        permissions: (u.permissions || []).map((permId: any) => {
          const perm = defaultPermissions.find((p) => p.id === permId);
          return (
            perm ||
            ({ id: permId, name: permId, module: "system", actions: [] } as any)
          );
        }),
        createdAt:
          parseDate(u.created_at) || parseDate(u.createdAt) || new Date(),
        updatedAt:
          parseDate(u.updated_at) ||
          parseDate(u.updatedAt) ||
          parseDate(u.created_at) ||
          new Date(),
        createdBy: u.createdBy || "system",
      }));
      setUsers(formattedUsers.length > 0 ? formattedUsers : mockUsers);
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "seller" as "admin" | "seller",
    status: "active" as "active" | "inactive",
    permissions: [] as string[],
  });

  const handleCreateUser = () => {
    if (user?.role !== "admin") {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem criar usuários",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(undefined);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "seller",
      status: "active",
      permissions: ["orders-full", "customers-full"],
    });
    setShowForm(true);
  };

  const handleEditUser = (u: UserType) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      status: u.status,
      permissions: u.permissions.map((p) => p.id),
    });
    setShowForm(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);

      // Validações
      if (!formData.name.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe o nome do usuário",
          variant: "destructive",
        });
        return;
      }

      if (!formData.email.trim() || !formData.email.includes("@")) {
        toast({
          title: "Email inválido",
          description: "Por favor, informe um email válido",
          variant: "destructive",
        });
        return;
      }

      if (!selectedUser && !formData.password) {
        toast({
          title: "Senha obrigatória",
          description: "Por favor, informe uma senha para o novo usuário",
          variant: "destructive",
        });
        return;
      }

      if (!selectedUser && formData.password.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter no mínimo 6 caracteres",
          variant: "destructive",
        });
        return;
      }

      const userPermissions = defaultPermissions.filter((p) =>
        formData.permissions.includes(p.id),
      );

      if (selectedUser) {
        // **EDITAR USUÁRIO EXISTENTE**
        const updatedData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          status: formData.status,
          permissions: userPermissions.map((p) => p.id),
          updated_at: serverTimestamp(),
        };

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(
              doc(db, "users", selectedUser.id),
              sanitizeForFirestore(updatedData),
            );

            toast({
              title: "Usuário atualizado",
              description: `${formData.name} foi atualizado com sucesso`,
            });
          } catch (error: any) {
            console.error("Erro ao atualizar no Firebase:", error);
            toast({
              title: "Erro ao atualizar",
              description:
                error.message || "Não foi possível atualizar o usuário",
              variant: "destructive",
            });
            return;
          }
        }

        // Atualizar estado local
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  name: formData.name,
                  email: formData.email,
                  role: formData.role,
                  status: formData.status,
                  permissions: userPermissions,
                  updatedAt: new Date(),
                }
              : u,
          ),
        );
      } else {
        // **CRIAR NOVO USUÁRIO**
        let userId: string;
        let createdInAuth = false;

        // Criar no Firebase Auth em um app secundário para não afetar a sessão atual
        if (isFirebaseConfigured) {
          // If offline, skip Firebase Auth to avoid network errors
          if (typeof window !== "undefined" && !navigator.onLine) {
            console.warn("Offline: skipping Firebase Auth user creation");
            userId = `user-${Date.now()}`;
            toast({
              title: "Sem conexão",
              description:
                "Sem conexão com a internet. Usuário criado sem autenticação Firebase",
              variant: "destructive",
            });
          } else {
            let secondary: any = null;
            let secondaryAuth: any = null;
            let deleteAppFn: any = null;
            try {
              const mod = await import("firebase/app");
              const initializeFirebaseApp = mod.initializeApp;
              deleteAppFn = mod.deleteApp;

              secondary = initializeFirebaseApp(
                (app as any).options,
                `auth-create-${Date.now()}`,
              );
              secondaryAuth = getAuth(secondary);

              const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                formData.email.trim().toLowerCase(),
                formData.password,
              );
              userId = userCredential.user.uid;
              createdInAuth = true;

              try {
                await updateProfile(userCredential.user, {
                  displayName: formData.name.trim(),
                });
              } catch {}

              toast({
                title: "Conta criada no Firebase Auth",
                description: "Usuário autenticado criado com sucesso",
              });
            } catch (error: any) {
              // Log non-sensitive info, but avoid noisy stack for network errors
              if (error?.code === "auth/network-request-failed") {
                console.warn(
                  "Firebase network error while creating user (fallback):",
                  error.message,
                );
                userId = `user-${Date.now()}`;
                toast({
                  title: "Erro de rede no Firebase",
                  description:
                    "Não foi possível conectar ao Firebase. Usuário criado sem autenticação Firebase",
                  variant: "destructive",
                });
              } else if (error?.code === "auth/email-already-in-use") {
                toast({
                  title: "Email já cadastrado",
                  description:
                    "Este email já está sendo usado por outro usuário",
                  variant: "destructive",
                });
                // ensure cleanup of secondary app below
                // and exit to prevent creating duplicate local user
                try {
                  if (secondaryAuth) await signOut(secondaryAuth);
                } catch {}
                try {
                  if (secondary && deleteAppFn) await deleteAppFn(secondary);
                } catch {}
                return;
              } else {
                console.warn(
                  "Firebase Auth error, falling back:",
                  error?.message || error,
                );
                userId = `user-${Date.now()}`;
                toast({
                  title: "Aviso",
                  description: "Usuário criado sem autenticação Firebase",
                  variant: "destructive",
                });
              }
            } finally {
              try {
                if (secondaryAuth) await signOut(secondaryAuth);
              } catch {}
              try {
                if (secondary && deleteAppFn) await deleteAppFn(secondary);
              } catch (e) {}
            }
          }
        } else {
          userId = `user-${Date.now()}`;
        }

        const newUserData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          permissions: userPermissions.map((p) => p.id),
          status: formData.status,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        // Salvar no Firestore com o mesmo UID do Auth
        if (isFirebaseConfigured && db) {
          try {
            await setDoc(
              doc(db, "users", userId),
              sanitizeForFirestore({
                ...newUserData,
                uid: userId,
              }),
            );
          } catch (error: any) {
            console.error("Erro ao salvar no Firestore:", error);
            toast({
              title: "Erro ao salvar",
              description: "Usuário criado mas não salvo no banco",
              variant: "destructive",
            });
          }
        }

        const newUser: UserType = {
          id: userId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: userPermissions,
          status: formData.status,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user?.id || "system",
        };

        setUsers((prev) => [newUser, ...prev]);

        toast({
          title: "Usuário criado",
          description: `${formData.name} foi adicionado ao sistema${createdInAuth ? " com autenticação" : ""}`,
        });
      }

      setShowForm(false);
      setSelectedUser(undefined);

      // Recarregar usuários para garantir sincronia
      await loadUsers();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Não foi possível salvar o usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive",
      });
      return;
    }

    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    if (
      !confirm(
        `Tem certeza que deseja excluir ${userToDelete.name}?\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    toast({
      title: "Usuário excluído",
      description: `${userToDelete.name} foi removido do sistema`,
    });
  };

  const handleManagePermissions = (u: UserType) => {
    setPermissionUser(u);
    setFormData((prev) => ({
      ...prev,
      permissions: u.permissions.map((p) => p.id),
    }));
    setShowPermissions(true);
  };

  const handleSavePermissions = async () => {
    if (!permissionUser) return;

    try {
      const userPermissions = defaultPermissions.filter((p) =>
        formData.permissions.includes(p.id),
      );

      if (isFirebaseConfigured && db) {
        await updateDoc(
          doc(db, "users", permissionUser.id),
          sanitizeForFirestore({
            permissions: userPermissions.map((p) => p.id),
            updated_at: serverTimestamp(),
          }),
        );
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === permissionUser.id
            ? { ...u, permissions: userPermissions, updatedAt: new Date() }
            : u,
        ),
      );

      setShowPermissions(false);
      setPermissionUser(undefined);

      toast({
        title: "Permissões atualizadas",
        description: `Permissões de ${permissionUser.name} foram atualizadas`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar permissões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const formatDate = (date?: Date | string | number | null) => {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-biobox-green" />
            <p>Carregando usuários...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Gerenciamento de Usuários
              </h2>
              <p className="text-muted-foreground">
                Crie e gerencie usuários do sistema
              </p>
            </div>
            <Button
              onClick={handleCreateUser}
              className="bg-biobox-green hover:bg-biobox-green-dark"
              disabled={user?.role !== "admin"}
              title={
                user?.role !== "admin"
                  ? "Apenas administradores podem criar usuários"
                  : undefined
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuários do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-biobox-green/10 text-biobox-green">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            u.role === "admin"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          )}
                        >
                          {u.role === "admin" ? "Administrador" : "Vendedor"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            u.status === "active"
                              ? "bg-biobox-green/10 text-biobox-green border-biobox-green/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20",
                          )}
                        >
                          {u.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {u.lastLogin ? formatDate(u.lastLogin) : "Nunca"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(u.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleManagePermissions(u)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          {u.role !== "admin" && u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {showForm && user?.role === "admin" && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5" />
                      <span>
                        {selectedUser ? "Editar Usuário" : "Novo Usuário"}
                      </span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nome do usuário"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="usuario@bioboxsys.com"
                      required
                      disabled={saving || !!selectedUser}
                    />
                    {selectedUser && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Email não pode ser alterado
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {selectedUser
                        ? "Nova Senha (deixe vazio para manter)"
                        : "Senha *"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Mínimo 6 caracteres"
                        required={!selectedUser}
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={saving}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Tipo de Usuário *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, role: value }))
                      }
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveUser}
                      className="bg-biobox-green hover:bg-biobox-green-dark"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showPermissions && permissionUser && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <Card className="w-full max-w-2xl bg-card border-border my-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Permissões - {permissionUser.name}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPermissions(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-3">
                    {defaultPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={() =>
                            togglePermission(permission.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {permission.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">Módulo:</span>{" "}
                            {permission.module}
                            <br />
                            <span className="font-semibold">Ações:</span>{" "}
                            {permission.actions.join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPermissions(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      className="bg-biobox-green hover:bg-biobox-green-dark"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Permissões
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
