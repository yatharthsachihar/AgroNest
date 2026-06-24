import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('axiomcropsciences_token');
    if (token) {
      API.get('/auth/me')
        .then(res => setAdmin(res.data))
        .catch(() => localStorage.removeItem('axiomcropsciences_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('axiomcropsciences_token', res.data.token);
    setAdmin(res.data.admin);
  };

  const logout = () => {
    localStorage.removeItem('axiomcropsciences_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
