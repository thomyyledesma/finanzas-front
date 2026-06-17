import type { ApiError } from "../types";

// Base URL del backend. En dev apunta a localhost:8080; en prod lo seteás
// con la env var VITE_API_URL en el panel de tu hosting.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const TOKEN_KEY = "finanzas_token";

// --- Manejo del token en localStorage ---
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Error tipado que lanzan las llamadas. El front lo atrapa y muestra .message.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean; // default true; ponelo en false para /auth/login y /register
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStorage.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Falla de red / backend caído
    throw new HttpError(0, "No se pudo conectar con el servidor");
  }

  // 401: token vencido o ausente. Limpiamos y dejamos que la UI redirija a login.
  if (res.status === 401) {
    tokenStorage.clear();
    throw new HttpError(401, "Sesión expirada. Iniciá sesión de nuevo.");
  }

  if (!res.ok) {
    // El backend devuelve { status, error } de forma uniforme.
    let message = `Error ${res.status}`;
    try {
      const data = (await res.json()) as ApiError;
      if (data?.error) message = data.error;
    } catch {
      /* respuesta sin cuerpo JSON; usamos el mensaje genérico */
    }
    throw new HttpError(res.status, message);
  }

  // 204 No Content (DELETE) o respuestas vacías
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;

  // Algunos endpoints devuelven texto plano (ej: POST /cuentas/transferir)
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const http = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body, auth }),
  del: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
};
