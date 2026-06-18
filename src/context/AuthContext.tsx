import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, usuarioApi } from "../api";
import { tokenStorage } from "../api/http";
import type { LoginRequest, RegisterRequest, UsuarioResponse } from "../types";

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  isAuthenticated: boolean;
  loading: boolean; // true mientras verifica el token al cargar la app
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  // Refresca el usuario en memoria (ej: tras editar el perfil) para que la UI
  // muestre el nombre nuevo sin recargar la página.
  setUsuarioActual: (u: UsuarioResponse) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, intentamos traer el usuario.
  // Si el token está vencido, /usuarios/actual da 401, el http lo limpia
  // y caemos en el catch -> no autenticado.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    usuarioApi
      .actual()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    tokenStorage.set(res.token);
    const u = await usuarioApi.actual();
    setUsuario(u);
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    tokenStorage.set(res.token);
    const u = await usuarioApi.actual();
    setUsuario(u);
  };

  const logout = () => {
    tokenStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, isAuthenticated: !!usuario, loading, login, register, logout, setUsuarioActual: setUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
