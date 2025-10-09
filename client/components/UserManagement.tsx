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
  CreditCard as Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { User as UserType, mockUsers, defaultPermissions } from "@/types/user";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { sanitizeForFirestore } from "@/lib/firestore";

interface UserManagementProps {
  onUserCreated?: (user: UserType) => void;
}

export default function UserManagement({ onUserCreated }: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getUsers: fetchUsers } = useSupabase();
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
      const formattedUsers: UserType[] = usersData.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as "admin" | "seller",
        status: "active",
        permissions: (u.permissions || []).map((permId) => {
          const perm = defaultPermissions.find((p) => p.id === permId);
          return (
            perm ||
            ({ id: permId, name: permId, module: "system", actions: [] } as any)
          );
        }),
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at),
        createdBy: "system",
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
    if (user?.role !== "admin") return;
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
    const userPermissions = defaultPermissions.filter((p) =>
      formData.permissions.includes(p.id),
    );

    if (selectedUser) {
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
      const newUser: UserType = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: userPermissions,
        status: formData.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "1",
      };
      setUsers((prev) => [newUser, ...prev]);
      onUserCreated?.(newUser);

      try {
        if (isFirebaseConfigured && db) {
          await addDoc(
            collection(db, "users"),
            sanitizeForFirestore({
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              permissions: newUser.permissions.map((p) => p.id),
              status: newUser.status,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            }),
          );
        }
      } catch (e) {
        console.warn("Falha ao salvar usuário no Firestore (opcional):", e);
      }
    }

    setShowForm(false);
    setSelectedUser(undefined);
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    alert("Usuário excluído com sucesso!");
  };

  const handleManagePermissions = (u: UserType) => {
    setPermissionUser(u);
    setFormData((prev) => ({
      ...prev,
      permissions: u.permissions.map((p) => p.id),
    }));
    setShowPermissions(true);
  };

  const handleSavePermissions = () => {
    if (!permissionUser) return;
    const userPermissions = defaultPermissions.filter((p) =>
      formData.permissions.includes(p.id),
    );
    setUsers((prev) =>
      prev.map((u) =>
        u.id === permissionUser.id
          ? { ...u, permissions: userPermissions, updatedAt: new Date() }
          : u,
      ),
    );
    setShowPermissions(false);
    setPermissionUser(undefined);
    alert("Permissões atualizadas com sucesso!");
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR").format(date);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biobox-green mx-auto mb-4"></div>
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
                          {u.role !== "admin" && (
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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {selectedUser
                        ? "Nova Senha (deixe vazio para manter)"
                        : "Senha"}
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
                        placeholder="••••••••"
                        required={!selectedUser}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
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
                    <Label htmlFor="role">Tipo de Usuário</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
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
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveUser}
                      className="bg-biobox-green hover:bg-biobox-green-dark"
                      disabled={
                        !formData.name ||
                        !formData.email ||
                        (!selectedUser && !formData.password)
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
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
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="truncate">
                        Permissões - {permissionUser.name}
                      </span>
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {permission.name}
                          </div>
                          <div className="text-xs text-muted-foreground break-words">
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
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPermissions(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      className="bg-biobox-green hover:bg-biobox-green-dark w-full sm:w-auto"
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
