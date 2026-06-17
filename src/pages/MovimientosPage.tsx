import { useState, useEffect, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { movimientoApi, cuentaApi, categoriaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { formatearMoneda, formatearFecha } from "../lib/format";
import type {
  MovimientoResponse,
  CuentaResponse,
  CategoriaResponse,
  TipoMovimiento,
} from "../types";

// Fecha de hoy en formato "YYYY-MM-DD" para el input date.
function hoyIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function MovimientosPage() {
  const movimientos = useAsync(() => movimientoApi.listar());
  // Cargamos cuentas y categorías una vez para reusar en el formulario.
  const cuentas = useAsync(() => cuentaApi.listar());
  const categorias = useAsync(() => categoriaApi.listar());

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editar, setEditar] = useState<MovimientoResponse | null>(null);

  function abrirNuevo() {
    setEditar(null);
    setModalAbierto(true);
  }

  function abrirEditar(m: MovimientoResponse) {
    setEditar(m);
    setModalAbierto(true);
  }

  function cerrar() {
    setModalAbierto(false);
    setEditar(null);
  }

  function recargarTodo() {
    movimientos.reload();
    cuentas.reload(); // los saldos cambian al registrar un movimiento
    cerrar();
  }

  // Ordenados por fecha, más nuevos primero.
  const lista = (movimientos.data ?? [])
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Movimientos
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Tu bitácora de ingresos y egresos.
          </p>
        </div>
        <button className="btn btn-primario btn-auto" onClick={abrirNuevo}>
          + Registrar movimiento
        </button>
      </header>

      {movimientos.loading && <div className="estado">Cargando movimientos…</div>}
      {movimientos.error && <div className="estado estado-error">{movimientos.error}</div>}

      {movimientos.data && lista.length === 0 && (
        <div className="estado">
          Todavía no registraste movimientos. Tocá "Registrar movimiento" para empezar.
        </div>
      )}

      {lista.length > 0 && (
        <table className="movimientos-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
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
                  className={m.tipo === "INGRESO" ? "monto-ingreso" : "monto-egreso"}
                >
                  {m.tipo === "INGRESO" ? "+" : "−"}
                  {formatearMoneda(m.monto)}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn-link" onClick={() => abrirEditar(m)}>
                    Editar
                  </button>
                  <BotonEliminar id={m.id} onListo={recargarTodo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto && (
        <ModalMovimiento
          movimiento={editar}
          cuentas={cuentas.data ?? []}
          categorias={categorias.data ?? []}
          onCerrar={cerrar}
          onGuardado={recargarTodo}
        />
      )}
    </>
  );
}

// ============================================================
// Botón eliminar con confirmación
// ============================================================
function BotonEliminar({ id, onListo }: { id: number; onListo: () => void }) {
  const [borrando, setBorrando] = useState(false);

  async function eliminar() {
    if (!confirm("¿Eliminar este movimiento? El saldo de la cuenta se va a ajustar.")) {
      return;
    }
    setBorrando(true);
    try {
      await movimientoApi.eliminar(id);
      onListo();
    } catch (e) {
      alert(e instanceof HttpError ? e.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <button className="btn-link peligro" onClick={eliminar} disabled={borrando}>
      {borrando ? "…" : "Eliminar"}
    </button>
  );
}

// ============================================================
// Modal de registrar / editar movimiento
// Sigue el caso de uso del documento: tipo, monto, cuenta,
// categoría, fecha y descripción opcional.
// ============================================================
function ModalMovimiento({
  movimiento,
  cuentas,
  categorias,
  onCerrar,
  onGuardado,
}: {
  movimiento: MovimientoResponse | null;
  cuentas: CuentaResponse[];
  categorias: CategoriaResponse[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const esEdicion = !!movimiento;

  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento?.tipo ?? "EGRESO");
  const [monto, setMonto] = useState(movimiento?.monto?.toString() ?? "");
  const [cuentaId, setCuentaId] = useState<number>(
    movimiento?.cuentaId ?? cuentas.find((c) => c.activa)?.id ?? 0
  );
  const [categoriaId, setCategoriaId] = useState<number>(movimiento?.categoriaId ?? 0);
  const [fecha, setFecha] = useState(movimiento?.fecha ?? hoyIso());
  const [descripcion, setDescripcion] = useState(movimiento?.descripcion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Las categorías se filtran por el tipo elegido: si es ingreso, solo
  // categorías de ingreso (el backend valida que coincidan).
  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  // Cuando cambia el tipo, si la categoría elegida ya no aplica, la reseteamos
  // a la primera disponible del nuevo tipo.
  useEffect(() => {
    const sigueValida = categoriasFiltradas.some((c) => c.id === categoriaId);
    if (!sigueValida) {
      setCategoriaId(categoriasFiltradas[0]?.id ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cuentaId) {
      setError("Elegí una cuenta");
      return;
    }
    if (!categoriaId) {
      setError("Elegí una categoría");
      return;
    }

    const payload = {
      cuentaId,
      categoriaId,
      tipo,
      monto: Number(monto),
      fecha,
      descripcion: descripcion.trim() || undefined,
    };

    setEnviando(true);
    try {
      if (esEdicion) {
        await movimientoApi.editar(movimiento!.id, payload);
      } else {
        await movimientoApi.crear(payload);
      }
      onGuardado();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo guardar el movimiento");
    } finally {
      setEnviando(false);
    }
  }

  const cuentasActivas = cuentas.filter((c) => c.activa);

  return (
    <Modal
      titulo={esEdicion ? "Editar movimiento" : "Registrar movimiento"}
      subtitulo={
        esEdicion ? "Modificá los datos del movimiento." : "Cargá un ingreso o egreso."
      }
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
          >
            <option value="EGRESO">Egreso (sale plata)</option>
            <option value="INGRESO">Ingreso (entra plata)</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            step="0.01"
            min="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="cuenta">Cuenta</label>
          {cuentasActivas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--error)" }}>
              No tenés cuentas activas. Creá una primero.
            </p>
          ) : (
            <select
              id="cuenta"
              value={cuentaId}
              onChange={(e) => setCuentaId(Number(e.target.value))}
            >
              {cuentasActivas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({formatearMoneda(c.saldo)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="campo">
          <label htmlFor="categoria">Categoría</label>
          {categoriasFiltradas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--error)" }}>
              No tenés categorías de {tipo === "INGRESO" ? "ingreso" : "egreso"}.
            </p>
          ) : (
            <select
              id="categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(Number(e.target.value))}
            >
              {categoriasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="campo">
          <label htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Compra en el super"
            maxLength={200}
          />
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
