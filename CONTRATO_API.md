# Contrato de la API — Finanzas Personales

Referencia para el front. Base URL: `http://localhost:8080` (dev).
Todos los endpoints requieren header `Authorization: Bearer <token>` **excepto** `/auth/*`.

## Forma de error (uniforme)

Todo error llega así:

```json
{ "timestamp": "2026-06-16T10:00:00", "status": 400, "error": "mensaje legible" }
```

Códigos: **400** validación/regla de negocio · **401** sin token o vencido ·
**404** no encontrado o no te pertenece · **409** conflicto (duplicado, concurrencia) ·
**500** error de servidor.

---

## Auth `/auth` (público)

| Método | Ruta | Request | Response 200 |
|---|---|---|---|
| POST | `/auth/register` | `{nombre, email, password}` | `{token, email}` |
| POST | `/auth/login` | `{email, password}` | `{token, email}` |

Errores: register → 409 si el email ya existe. login → 404 usuario inexistente, 401 contraseña incorrecta. Ambos → 400 si falla validación (password min 6, email mal formado).

> Al registrarse, el usuario recibe automáticamente una cuenta "Efectivo" y ~22 categorías por defecto.

---

## Usuario `/usuarios`

| Método | Ruta | Request | Response |
|---|---|---|---|
| GET | `/usuarios/actual` | — | `{id, nombre, email}` |
| PUT | `/usuarios/actual` | `{nombre}` | `{id, nombre, email}` |

---

## Cuentas `/cuentas`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/cuentas` | `{nombre, saldo, tipoCuenta}` | `CuentaResponse` (201) |
| GET | `/cuentas` | — | `CuentaResponse[]` |
| GET | `/cuentas/{id}` | — | `CuentaResponse` |
| PUT | `/cuentas/{id}` | `{nombre, tipoCuenta}` | `CuentaResponse` |
| DELETE | `/cuentas/{id}` | — | 204 |
| POST | `/cuentas/transferir` | `{cuentaOrigenId, cuentaDestinoId, monto}` | **texto plano** "Transferencia realizada correctamente" |

`CuentaResponse`: `{id, nombre, saldo, tipoCuenta, activa}`
`tipoCuenta`: EFECTIVO · BANCO · BILLETERA_VIRTUAL · INVERSION · TARJETA_CREDITO

Reglas: solo una cuenta EFECTIVO por usuario (409 si duplicás). La de EFECTIVO no se puede eliminar (400). No se elimina cuenta con movimientos (400). Al editar EFECTIVO no se cambia el tipo. Transferir: 400 si monto≤0, misma cuenta, cuenta inactiva o saldo insuficiente; 404 si alguna cuenta no es tuya.

---

## Categorías `/categorias`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/categorias` | `{nombre, icono?, tipo}` | `CategoriaResponse` (201) |
| GET | `/categorias?tipo=INGRESO\|EGRESO` | — | `CategoriaResponse[]` |
| GET | `/categorias/{id}` | — | `CategoriaResponse` |
| PUT | `/categorias/{id}` | `{nombre, icono?, tipo}` | `CategoriaResponse` |
| DELETE | `/categorias/{id}` | — | 204 |

`CategoriaResponse`: `{id, nombre, icono, tipo, cantidadMovimientos}`

Reglas: nombre 2-50, único por usuario (409 si repetís). No se puede borrar una categoría por defecto del sistema (400) ni una con movimientos (409). No se cambia el tipo si ya tiene movimientos (409).

---

## Movimientos `/movimientos`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/movimientos` | `MovimientoRequest` | `MovimientoResponse` (201) |
| GET | `/movimientos` | — | `MovimientoResponse[]` |
| GET | `/movimientos/{id}` | — | `MovimientoResponse` |
| GET | `/movimientos/cuenta/{cuentaId}` | — | `MovimientoResponse[]` |
| GET | `/movimientos/categoria/{categoriaId}` | — | `MovimientoResponse[]` |
| PUT | `/movimientos/{id}` | `MovimientoRequest` | `MovimientoResponse` |
| DELETE | `/movimientos/{id}` | — | 204 |

`MovimientoRequest`: `{cuentaId, categoriaId, tipo, descripcion?, monto, fecha?}` (fecha ISO "YYYY-MM-DD"; si falta usa hoy)
`MovimientoResponse`: `{id, tipo, descripcion, monto, fecha, cuentaId, cuentaNombre, categoriaId, categoriaNombre}`

Reglas: la categoría debe coincidir con el `tipo` (404 si no). EGRESO con saldo insuficiente → 400. EGRESO descuenta presupuesto de la categoría/mes; si lo supera → 400 (PresupuestoExcedido). Eliminar un INGRESO ya gastado → 400. Cuenta inactiva → 400.

---

## Presupuestos `/presupuestos`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/presupuestos` | `{montoLimite, mes, anio, categoriaId}` | `PresupuestoResponse` |
| GET | `/presupuestos` | — | `PresupuestoResponse[]` |
| GET | `/presupuestos/{id}` | — | `PresupuestoResponse` |
| PUT | `/presupuestos/{id}` | `{montoLimite, mes, anio, categoriaId}` | `PresupuestoResponse` |
| DELETE | `/presupuestos/{id}` | — | 204 |

`PresupuestoResponse`: `{id, montoLimite, montoConsumido, mes, anio, categoriaId, categoriaNombre}`
Reglas: mes 1-12, anio≥2000, monto>0. Uno por categoría/mes/año (409 si duplicás).

---

## Metas de ahorro `/metas-ahorro`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/metas-ahorro` | `{nombre, montoObjetivo, fechaLimite?, cuentaId?}` | `MetaAhorroResponse` (201) |
| GET | `/metas-ahorro?cumplida=true\|false` | — | `MetaAhorroResponse[]` |
| GET | `/metas-ahorro/{id}` | — | `MetaAhorroResponse` |
| PUT | `/metas-ahorro/{id}` | `{nombre, montoObjetivo, fechaLimite?, cuentaId?}` | `MetaAhorroResponse` |
| DELETE | `/metas-ahorro/{id}` | — | 204 |
| POST | `/metas-ahorro/{id}/depositar` | `{monto, cuentaId?}` | `MetaAhorroResponse` |
| POST | `/metas-ahorro/{id}/retirar` | `{monto, cuentaId?}` | `MetaAhorroResponse` |

`MetaAhorroResponse`: `{id, nombre, montoObjetivo, montoActual, porcentajeProgreso, fechaLimite, cumplida, usuarioId, cuentaId}`
Reglas: depositar mueve plata real de la cuenta (400 si saldo insuficiente). Retirar (400 si pedís más de lo que tiene la meta). Si no mandás `cuentaId` usa la cuenta por defecto de la meta; si no tiene → 404.

---

## Reglas recurrentes `/reglas-recurrentes`

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/reglas-recurrentes` | `ReglaRecurrenteRequest` | `ReglaRecurrenteResponse` |
| GET | `/reglas-recurrentes` | — | `ReglaRecurrenteResponse[]` |
| DELETE | `/reglas-recurrentes/{id}` | — | 204 (desactiva, no borra) |

`ReglaRecurrenteRequest`: `{cuentaId, categoriaId, tipo, descripcion, monto, esFamiliar, frecuenciaDias, proximaEjecucion}`
El scheduler corre todos los días a las 06:00 y crea los movimientos vencidos.

---

## Integraciones externas

| Método | Ruta | Response |
|---|---|---|
| GET | `/analisis` | `{analisis: string}` (requiere GEMINI_API_KEY en el back) |
| GET | `/cotizaciones/dolares` | `CotizacionDTO[]` |
| GET | `/cotizaciones/divisas` | `CotizacionDTO[]` |
| GET | `/criptos` | `CriptoDTO[]` |

`CotizacionDTO`: `{moneda, casa, nombre, compra, venta, fechaActualizacion}`
`CriptoDTO`: `{id, symbol, name, precioUsd, cambio24h, capitalizacion}`
