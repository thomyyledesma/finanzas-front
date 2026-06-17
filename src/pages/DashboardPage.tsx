import { useAsync } from "../hooks/useAsync";
import { cuentaApi, movimientoApi } from "../api";
import { formatearMoneda, formatearFecha, formatearTipoCuenta } from "../lib/format";
import type { MovimientoResponse } from "../types";

export function DashboardPage() {
  // Cargamos cuentas y movimientos en paralelo. Cada uno con su propio estado.
  const cuentas = useAsync(() => cuentaApi.listar());
  const movimientos = useAsync(() => movimientoApi.listar());

  // Patrimonio total = suma de saldos de las cuentas activas.
  const patrimonio =
    cuentas.data
      ?.filter((c) => c.activa)
      .reduce((acc, c) => acc + c.saldo, 0) ?? 0;

  // Últimos 8 movimientos, ordenados por fecha descendente.
  const ultimos: MovimientoResponse[] = (movimientos.data ?? [])
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8);

  return (
    <>
      <header className="contenido-header">
        <h1>Resumen</h1>
        <p>Tu situación financiera de un vistazo.</p>
      </header>

      {/* Patrimonio total */}
      <section className="patrimonio">
        <div className="patrimonio-label">Patrimonio total</div>
        <div className="patrimonio-monto">
          {cuentas.loading ? "…" : formatearMoneda(patrimonio)}
        </div>
      </section>

      {/* Cuentas */}
      <h2 className="seccion-titulo">Mis cuentas</h2>
      {cuentas.loading && <div className="estado">Cargando cuentas…</div>}
      {cuentas.error && (
        <div className="estado estado-error">{cuentas.error}</div>
      )}
      {cuentas.data && cuentas.data.length === 0 && (
        <div className="estado">Todavía no tenés cuentas.</div>
      )}
      {cuentas.data && cuentas.data.length > 0 && (
        <div className="cuentas-grid">
          {cuentas.data.map((c) => (
            <div
              key={c.id}
              className={c.activa ? "cuenta-card" : "cuenta-card inactiva"}
            >
              <div className="cuenta-card-tipo">
                {formatearTipoCuenta(c.tipoCuenta)}
              </div>
              <div className="cuenta-card-nombre">{c.nombre}</div>
              <div className="cuenta-card-saldo">{formatearMoneda(c.saldo)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Últimos movimientos */}
      <h2 className="seccion-titulo">Últimos movimientos</h2>
      {movimientos.loading && <div className="estado">Cargando movimientos…</div>}
      {movimientos.error && (
        <div className="estado estado-error">{movimientos.error}</div>
      )}
      {movimientos.data && ultimos.length === 0 && (
        <div className="estado">
          Todavía no registraste movimientos. Cuando cargues uno, aparece acá.
        </div>
      )}
      {ultimos.length > 0 && (
        <table className="movimientos-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th style={{ textAlign: "right" }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map((m) => (
              <tr key={m.id}>
                <td>{formatearFecha(m.fecha)}</td>
                <td>{m.descripcion || "—"}</td>
                <td>
                  {m.categoriaNombre ? (
                    <span className="badge-cat">{m.categoriaNombre}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{m.cuentaNombre}</td>
                <td
                  style={{ textAlign: "right" }}
                  className={
                    m.tipo === "INGRESO" ? "monto-ingreso" : "monto-egreso"
                  }
                >
                  {m.tipo === "INGRESO" ? "+" : "−"}
                  {formatearMoneda(m.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
