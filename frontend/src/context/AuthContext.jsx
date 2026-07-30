import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8080/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ id: '1', name: 'Dr. Admin', role: 'admin', username: 'admin' });
  const [token, setToken] = useState('mock-token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('aarogya_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('aarogya_token');
    }
  }, [token]);

  // Verify token on mount (bypassed for frontend-only mode)
  useEffect(() => {
    async function verifyToken() {
      setLoading(false);
    }
    verifyToken();
  }, []);

  const login = async (username, password) => {
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      return false;
    }
  };

  const logout = () => {
    try { axios.post(`${API_BASE}/auth/logout`); } catch(e) {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
