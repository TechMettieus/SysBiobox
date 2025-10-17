Text file: useAuth.tsx
Latest content with line numbers:
351	  };
352	
353	  const checkPermission = (module: string, action: string): boolean => {
354	    if (!user) return false;
355	    if (user.role === "admin") return true;
356	    
357	    return user.permissions.some(
358	      permission => 
359	        permission.module === module && 
360	        permission.actions.includes(action)
361	    );
362	  };
363	
364	  return {
365	    user,
366	    login,
367	    logout,
368	    isAuthenticated: !!user,
369	    isLoading,
370	    checkPermission,
371	  };
372	}
373	
374	export function useAuth() {
375	  const context = useContext(AuthContext);