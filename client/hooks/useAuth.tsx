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