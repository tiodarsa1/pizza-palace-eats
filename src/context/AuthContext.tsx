
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database (in a real app, this would be in a backend)
const USERS_STORAGE_KEY = 'pizza-palace-users';
const CURRENT_USER_KEY = 'pizza-palace-current-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };
    
    loadUser();
  }, []);

  const getUsers = (): Record<string, { id: string; name: string; email: string; password: string }> => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, any>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    // Simulate API call delay
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = getUsers();
      const foundUser = Object.values(users).find(
        (u: any) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        // Don't include password in the user state
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error('Email ou senha inválidos');
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = getUsers();
      
      // Check if email already exists
      if (Object.values(users).some((u: any) => u.email === email)) {
        toast.error('Este email já está em uso');
        throw new Error('Email already exists');
      }
      
      const id = `user-${Date.now()}`;
      const newUser = { id, name, email, password };
      
      // Save to "database"
      users[id] = newUser;
      saveUsers(users);
      
      // Login the user
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    toast.info('Logout realizado');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user,
        isLoading,
        login, 
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
