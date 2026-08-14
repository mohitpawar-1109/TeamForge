import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('teamforge_token');
      const savedUser = localStorage.getItem('teamforge_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify with backend silently
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('teamforge_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('teamforge_token');
          localStorage.removeItem('teamforge_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('teamforge_token', userData.token);
        localStorage.setItem('teamforge_user', JSON.stringify(userData));
        success(`Welcome back, ${userData.name}! 👋`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await authAPI.register(formData);
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('teamforge_token', userData.token);
        localStorage.setItem('teamforge_user', JSON.stringify(userData));
        success(`Welcome to TeamForge, ${userData.name}! 🎉`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('teamforge_token');
    localStorage.removeItem('teamforge_user');
    setUser(null);
    success('Logged out successfully.');
  };

  const updateUserState = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('teamforge_user', JSON.stringify(newUserData));
  };

  // 1-Click Quick Demo User Switcher for hackathons!
  const quickSwitchDemoUser = async (email) => {
    return await login(email, 'Demo@123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserState,
        quickSwitchDemoUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
