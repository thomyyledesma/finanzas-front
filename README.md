# Finanzas Personales — Front

SPA en React + Vite + TypeScript que consume la API de finanzas.

## Arranque

```bash
npm install
cp .env.example .env   # ajustá VITE_API_URL si tu back no está en :8080
npm run dev            # levanta en http://localhost:5173
```

> El backend ya tiene CORS habilitado para `localhost:5173`. Si lo cambiás,
> actualizá `cors.allowed-origins` en el back.

## Estructura

```
src/
├── api/
│   ├── http.ts        → cliente fetch base: inyecta JWT, maneja 401 y errores
│   └── index.ts       → un objeto de servicios por recurso (authApi, cuentaApi, ...)
├── types/
│   └── index.ts       → tipos que reflejan los DTOs del backend
├── context/
│   └── AuthContext.tsx → login/register/logout + usuario actual + token
├── hooks/
│   └── useAsync.ts    → useAsync (cargar GET) y useAction (POST/PUT/DELETE)
├── components/
│   └── ProtectedRoute.tsx → redirige a /login si no hay sesión
├── pages/             → (por construir) cada pantalla
├── App.tsx            → router con rutas públicas y protegidas
└── main.tsx           → entry point
```

## Cómo usar la capa de datos

**Cargar datos (GET) en una página:**

```tsx
import { useAsync } from "../hooks/useAsync";
import { cuentaApi } from "../api";

function CuentasPage() {
  const { data: cuentas, loading, error, reload } = useAsync(() => cuentaApi.listar());

  if (loading) return <p>Cargando…</p>;
  if (error) return <p>{error}</p>;
  return <ul>{cuentas?.map(c => <li key={c.id}>{c.nombre}: ${c.saldo}</li>)}</ul>;
}
```

**Ejecutar una acción (POST/PUT/DELETE):**

```tsx
import { useAction } from "../hooks/useAsync";
import { cuentaApi } from "../api";

const { run: crear, loading, error } = useAction(cuentaApi.crear);

await crear({ nombre: "Banco Nación", saldo: 50000, tipoCuenta: "BANCO" });
// 'error' tendrá el mensaje del backend si algo falla (ej: "Saldo insuficiente")
```

**Auth:**

```tsx
import { useAuth } from "../context/AuthContext";

const { login, logout, usuario, isAuthenticated } = useAuth();
await login({ email, password }); // guarda token y carga usuario
```

## Próximos pasos sugeridos

1. Páginas de Login y Register (formularios → `login()` / `register()`).
2. Layout con navegación lateral + Dashboard (saldos, últimos movimientos).
3. CRUD de cada recurso reutilizando los servicios de `api/index.ts`.

Ver `CONTRATO_API.md` para el detalle de cada endpoint.
