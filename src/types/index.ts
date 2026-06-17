// ============================================================
// Tipos del dominio — reflejan 1:1 los DTOs del backend.
// Si cambiás un DTO en Java, actualizá su par acá.
// ============================================================

// --- Enums (deben coincidir con los del backend) ---
export type TipoMovimiento = "INGRESO" | "EGRESO";

export type TipoCuenta =
  | "EFECTIVO"
  | "BANCO"
  | "BILLETERA_VIRTUAL"
  | "INVERSION"
  | "TARJETA_CREDITO"; // si la sacaste del enum en Java, borrá esta línea

// --- Auth ---
export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string; // min 6
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
}

// --- Usuario ---
export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
}

export interface ActualizarUsuarioRequest {
  nombre: string;
}

// --- Cuenta ---
export interface CuentaRequest {
  nombre: string;
  saldo: number;
  tipoCuenta: TipoCuenta;
}

export interface CuentaUpdateRequest {
  nombre: string;
  tipoCuenta: TipoCuenta;
}

export interface CuentaResponse {
  id: number;
  nombre: string;
  saldo: number;
  tipoCuenta: TipoCuenta;
  activa: boolean;
}

export interface TransferenciaRequest {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  monto: number;
}

// --- Categoría ---
export interface CategoriaRequest {
  nombre: string; // 2-50 chars
  icono?: string; // max 100
  tipo: TipoMovimiento;
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
  icono: string | null;
  tipo: TipoMovimiento;
  cantidadMovimientos: number;
}

// --- Movimiento ---
export interface MovimientoRequest {
  cuentaId: number;
  categoriaId: number;
  tipo: TipoMovimiento;
  descripcion?: string; // max 200
  monto: number; // > 0
  fecha?: string; // ISO date "YYYY-MM-DD"; si no se manda, el back usa hoy
}

export interface MovimientoResponse {
  id: number;
  tipo: TipoMovimiento;
  descripcion: string | null;
  monto: number;
  fecha: string; // "YYYY-MM-DD"
  cuentaId: number;
  cuentaNombre: string;
  categoriaId: number | null;
  categoriaNombre: string | null;
}

// --- Presupuesto ---
export interface PresupuestoRequest {
  montoLimite: number; // > 0
  mes: number; // 1-12
  anio: number; // >= 2000
  categoriaId: number;
}

export interface PresupuestoResponse {
  id: number;
  montoLimite: number;
  montoConsumido: number;
  mes: number;
  anio: number;
  categoriaId: number;
  categoriaNombre: string;
}

// --- Meta de ahorro ---
export interface MetaAhorroRequest {
  nombre: string; // 2-100
  montoObjetivo: number; // > 0
  fechaLimite?: string; // "YYYY-MM-DD"
  cuentaId?: number;
}

export interface MovimientoMetaRequest {
  monto: number; // > 0
  cuentaId?: number; // si no se manda, usa la cuenta por defecto de la meta
}

export interface MetaAhorroResponse {
  id: number;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  porcentajeProgreso: number;
  fechaLimite: string | null;
  cumplida: boolean;
  usuarioId: number;
  cuentaId: number | null;
}

// --- Regla recurrente ---
export interface ReglaRecurrenteRequest {
  cuentaId: number;
  categoriaId: number;
  tipo: TipoMovimiento;
  descripcion: string;
  monto: number; // > 0
  esFamiliar: boolean;
  frecuenciaDias: number; // >= 1
  proximaEjecucion: string; // "YYYY-MM-DD"
}

export interface ReglaRecurrenteResponse {
  id: number;
  cuentaId: number;
  cuentaNombre: string;
  categoriaId: number;
  categoriaNombre: string;
  tipo: TipoMovimiento;
  descripcion: string;
  monto: number;
  esFamiliar: boolean;
  frecuenciaDias: number;
  proximaEjecucion: string;
  activa: boolean;
}

// --- Integraciones externas ---
export interface CotizacionDTO {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface CriptoDTO {
  id: string;
  symbol: string;
  name: string;
  precioUsd: number;
  cambio24h: number;
  capitalizacion: number;
}

export interface AnalisisResponse {
  analisis: string;
}

// --- Forma de error que devuelve el backend (GlobalExceptionHandler) ---
export interface ApiError {
  timestamp?: string;
  status: number;
  error: string;
}
