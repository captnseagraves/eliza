import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "./api/client";
import { storage, StoredUser } from "./auth/storage";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  phoneNumber: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const user = await apiClient.get<User>('/auth/me', token);
      setUser(user);
      storage.setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      storage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string) => {
    try {
      await apiClient.post('/auth/login', { phoneNumber });
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const verify = async (code: string) => {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/verify', { code });
      storage.setToken(response.token);
      storage.setUser(response.user);
      setUser(response.user);
      toast({
        title: "Login successful",
        description: "You have been successfully logged in.",
      });
      navigate('/events');
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = storage.getToken();
      if (token) {
        await apiClient.post('/auth/logout', {}, token);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      storage.clear();
      setUser(null);
      navigate('/login');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
