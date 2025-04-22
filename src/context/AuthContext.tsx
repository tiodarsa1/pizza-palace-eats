
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
      (u: any) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && u.role === 'admin'
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
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Erro ao carregar usuário do localStorage:', error);
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
    };
    
    loadUser();
  }, []);

  const getUsers = (): Record<string, { id: string; name: string; email: string; password: string; role?: 'admin' | 'user' }> => {
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : {};
    } catch (error) {
      console.error('Erro ao obter usuários do localStorage:', error);
      return {};
    }
  };

  const saveUsers = (users: Record<string, any>) => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuários no localStorage:', error);
      toast.error('Erro ao salvar dados de usuário. Verifique seu armazenamento local.');
    }
  };

  const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase();
  };

  const login = async (email: string, password: string) => {
    // Simulate API call delay
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const normalizedEmail = normalizeEmail(email);
      const users = getUsers();
      
      // Improved comparison - case insensitive for email
      const foundUser = Object.values(users).find(
        (u: any) => normalizeEmail(u.email) === normalizedEmail && u.password === password
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
        console.log('Tentativa de login falhou:', { email: normalizedEmail });
        toast.error('Email ou senha incorretos');
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const normalizedEmail = normalizeEmail(email);
      const users = getUsers();
      
      // Improved email check with case insensitivity
      const emailExists = Object.values(users).some(
        (u: any) => normalizeEmail(u.email) === normalizedEmail
      );
      
      if (emailExists) {
        toast.error('Este email já está em uso');
        throw new Error('Email já existe');
      }
      
      const id = `user-${Date.now()}`;
      const newUser = { 
        id, 
        name, 
        email: normalizedEmail, // Store email in normalized form
        password, 
        role: 'user' as 'user'  // Explicitly cast as 'user'
      };
      
      // Save to "database"
      users[id] = newUser;
      saveUsers(users);
      
      // Login the user
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword as User);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      console.error('Erro durante cadastro:', error);
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
