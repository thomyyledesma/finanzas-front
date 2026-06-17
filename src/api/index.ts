import { http } from "./http";
import type {
  RegisterRequest, LoginRequest, AuthResponse,
  UsuarioResponse, ActualizarUsuarioRequest,
  CuentaRequest, CuentaUpdateRequest, CuentaResponse, TransferenciaRequest,
  CategoriaRequest, CategoriaResponse, TipoMovimiento,
  MovimientoRequest, MovimientoResponse,
  PresupuestoRequest, PresupuestoResponse,
  MetaAhorroRequest, MetaAhorroResponse, MovimientoMetaRequest,
  ReglaRecurrenteRequest, ReglaRecurrenteResponse,
  CotizacionDTO, CriptoDTO, AnalisisResponse,
} from "../types";

// ============================================================
// Cada función mapea a un endpoint del README. La idea es que los
// componentes NUNCA armen URLs ni manejen fetch: solo llaman a esto.
// ============================================================

// --- Auth (público, auth=false) ---
export const authApi = {
  register: (data: RegisterRequest) =>
    http.post<AuthResponse>("/auth/register", data, false),
  login: (data: LoginRequest) =>
    http.post<AuthResponse>("/auth/login", data, false),
};

// --- Usuario ---
export const usuarioApi = {
  actual: () => http.get<UsuarioResponse>("/usuarios/actual"),
  actualizar: (data: ActualizarUsuarioRequest) =>
    http.put<UsuarioResponse>("/usuarios/actual", data),
};

// --- Cuentas ---
export const cuentaApi = {
  crear: (data: CuentaRequest) => http.post<CuentaResponse>("/cuentas", data),
  listar: () => http.get<CuentaResponse[]>("/cuentas"),
  obtener: (id: number) => http.get<CuentaResponse>(`/cuentas/${id}`),
  actualizar: (id: number, data: CuentaUpdateRequest) =>
    http.put<CuentaResponse>(`/cuentas/${id}`, data),
  eliminar: (id: number) => http.del<void>(`/cuentas/${id}`),
  transferir: (data: TransferenciaRequest) =>
    http.post<string>("/cuentas/transferir", data), // devuelve texto plano
};

// --- Categorías ---
export const categoriaApi = {
  crear: (data: CategoriaRequest) =>
    http.post<CategoriaResponse>("/categorias", data),
  listar: (tipo?: TipoMovimiento) =>
    http.get<CategoriaResponse[]>(
      tipo ? `/categorias?tipo=${tipo}` : "/categorias"
    ),
  obtener: (id: number) => http.get<CategoriaResponse>(`/categorias/${id}`),
  actualizar: (id: number, data: CategoriaRequest) =>
    http.put<CategoriaResponse>(`/categorias/${id}`, data),
  eliminar: (id: number) => http.del<void>(`/categorias/${id}`),
};

// --- Movimientos ---
export const movimientoApi = {
  crear: (data: MovimientoRequest) =>
    http.post<MovimientoResponse>("/movimientos", data),
  listar: () => http.get<MovimientoResponse[]>("/movimientos"),
  obtener: (id: number) => http.get<MovimientoResponse>(`/movimientos/${id}`),
  porCuenta: (cuentaId: number) =>
    http.get<MovimientoResponse[]>(`/movimientos/cuenta/${cuentaId}`),
  porCategoria: (categoriaId: number) =>
    http.get<MovimientoResponse[]>(`/movimientos/categoria/${categoriaId}`),
  editar: (id: number, data: MovimientoRequest) =>
    http.put<MovimientoResponse>(`/movimientos/${id}`, data),
  eliminar: (id: number) => http.del<void>(`/movimientos/${id}`),
};

// --- Presupuestos ---
export const presupuestoApi = {
  crear: (data: PresupuestoRequest) =>
    http.post<PresupuestoResponse>("/presupuestos", data),
  listar: () => http.get<PresupuestoResponse[]>("/presupuestos"),
  obtener: (id: number) => http.get<PresupuestoResponse>(`/presupuestos/${id}`),
  actualizar: (id: number, data: PresupuestoRequest) =>
    http.put<PresupuestoResponse>(`/presupuestos/${id}`, data),
  eliminar: (id: number) => http.del<void>(`/presupuestos/${id}`),
};

// --- Metas de ahorro ---
export const metaApi = {
  crear: (data: MetaAhorroRequest) =>
    http.post<MetaAhorroResponse>("/metas-ahorro", data),
  listar: (cumplida?: boolean) =>
    http.get<MetaAhorroResponse[]>(
      cumplida !== undefined ? `/metas-ahorro?cumplida=${cumplida}` : "/metas-ahorro"
    ),
  obtener: (id: number) => http.get<MetaAhorroResponse>(`/metas-ahorro/${id}`),
  actualizar: (id: number, data: MetaAhorroRequest) =>
    http.put<MetaAhorroResponse>(`/metas-ahorro/${id}`, data),
  eliminar: (id: number) => http.del<void>(`/metas-ahorro/${id}`),
  depositar: (id: number, data: MovimientoMetaRequest) =>
    http.post<MetaAhorroResponse>(`/metas-ahorro/${id}/depositar`, data),
  retirar: (id: number, data: MovimientoMetaRequest) =>
    http.post<MetaAhorroResponse>(`/metas-ahorro/${id}/retirar`, data),
};

// --- Reglas recurrentes ---
export const reglaApi = {
  crear: (data: ReglaRecurrenteRequest) =>
    http.post<ReglaRecurrenteResponse>("/reglas-recurrentes", data),
  listar: () => http.get<ReglaRecurrenteResponse[]>("/reglas-recurrentes"),
  desactivar: (id: number) => http.del<void>(`/reglas-recurrentes/${id}`),
  reactivar: (id: number) =>
    http.post<ReglaRecurrenteResponse>(`/reglas-recurrentes/${id}/reactivar`),
};

// --- Integraciones externas ---
export const externoApi = {
  analisis: () => http.get<AnalisisResponse>("/analisis"),
  dolares: () => http.get<CotizacionDTO[]>("/cotizaciones/dolares"),
  divisas: () => http.get<CotizacionDTO[]>("/cotizaciones/divisas"),
  criptos: () => http.get<CriptoDTO[]>("/criptos"),
};
