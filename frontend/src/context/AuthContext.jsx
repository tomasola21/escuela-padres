import { createContext, useContext, useState, useEffect } from 'react';
import { verificarToken } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verificarToken()
        .then((data) => {
          setUsuario(data.usuario);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUsuario = (usuarioData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    setUsuario(usuarioData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, loginUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
