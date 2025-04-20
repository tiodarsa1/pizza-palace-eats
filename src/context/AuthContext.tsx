
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database (in a real app, this would be in a backend)
const USERS_STORAGE_KEY = 'pizza-palace-users';
const CURRENT_USER_KEY = 'pizza-palace-current-user';

// Admin credentials
const ADMIN_EMAIL = 'tiodarsa27@gmail.com';
const ADMIN_PASSWORD = 'Trubisco1@';
const ADMIN_NAME = 'Administrador';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize admin user if not exists
  useEffect(() => {
    const users = getUsers();
    const adminExists = Object.values(users).some(
      (u: any) => u.email === ADMIN_EMAIL && u.role === 'admin'
    );
    
    if (!adminExists) {
      const adminId = `user-admin-${Date.now()}`;
      users[adminId] = {
        id: adminId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin' as 'admin'  // Explicitly cast to the literal type 'admin'
      };
      saveUsers(users);
      console.log('Admin user created');
    }
  }, []);

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

  const getUsers = (): Record<string, { id: string; name: string; email: string; password: string; role?: 'admin' | 'user' }> => {
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
        
        // Ensure the role is correctly typed
        const typedUser: User = {
          ...userWithoutPassword,
          role: userWithoutPassword.role as 'admin' | 'user'
        };
        
        setUser(typedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(typedUser));
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
      
      // Improved email check with case insensitivity
      const emailExists = Object.values(users).some(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExists) {
        toast.error('Este email já está em uso');
        throw new Error('Email already exists');
      }
      
      const id = `user-${Date.now()}`;
      const newUser = { id, name, email, password, role: 'user' as 'user' };  // Explicitly cast as 'user'
      
      // Save to "database"
      users[id] = newUser;
      saveUsers(users);
      
      // Login the user
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword as User);
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

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user,
        isLoading,
        login, 
        signup,
        logout,
        isAdmin
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
