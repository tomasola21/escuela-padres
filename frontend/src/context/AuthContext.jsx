import { createContext, useContext, useState, useEffect } from 'react';
import { verificarToken } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      verificarToken()
        .then((data) => {
          setUsuario(data.usuario);
        })
        .catch(() => {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('usuario');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUsuario = (usuarioData, token) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('usuario', JSON.stringify(usuarioData));
    setUsuario(usuarioData);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, loginUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
