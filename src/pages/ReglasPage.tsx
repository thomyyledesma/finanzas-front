import { useState, useEffect, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { reglaApi, cuentaApi, categoriaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { formatearMoneda, formatearFecha } from "../lib/format";
import type {
  ReglaRecurrenteResponse,
  CuentaResponse,
  CategoriaResponse,
  TipoMovimiento,
} from "../types";

function hoyIso(): string {
  return new Date().toISOString().split("T")[0];
}

// Traduce la frecuencia en días a un texto legible.
function textoFrecuencia(dias: number): string {
  if (dias === 1) return "Todos los días";
  if (dias === 7) return "Cada semana";
  if (dias === 15) return "Cada 15 días";
  if (dias === 30) return "Cada mes";
  return `Cada ${dias} días`;
}

export function ReglasPage() {
  const reglas = useAsync(() => reglaApi.listar());
  const cuentas = useAsync(() => cuentaApi.listar());
  const categorias = useAsync(() => categoriaApi.listar());

  const [modalAbierto, setModalAbierto] = useState(false);

  function recargar() {
    reglas.reload();
    setModalAbierto(false);
  }

  // Las activas primero.
  const lista = (reglas.data ?? []).slice().sort((a, b) => {
    if (a.activa !== b.activa) return a.activa ? -1 : 1;
    return a.proximaEjecucion.localeCompare(b.proximaEjecucion);
  });

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Reglas recurrentes
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Movimientos automáticos, como el sueldo o el alquiler.
          </p>
        </div>
        <button className="btn btn-primario btn-auto" onClick={() => setModalAbierto(true)}>
          + Nueva regla
        </button>
      </header>

      {reglas.loading && <div className="estado">Cargando reglas…</div>}
      {reglas.error && <div className="estado estado-error">{reglas.error}</div>}

      {reglas.data && lista.length === 0 && (
        <div className="estado">
          Todavía no tenés reglas. Creá una para automatizar movimientos que se repiten.
        </div>
      )}

      {lista.length > 0 && (
        <table className="movimientos-tabla">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Frecuencia</th>
              <th>Próxima vez</th>
              <th>Cuenta</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th style={{ textAlign: "right" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} style={{ opacity: r.activa ? 1 : 0.5 }}>
                <td style={{ fontWeight: 600 }}>{r.descripcion}</td>
                <td>
                  <span
                    className="badge-cat"
                    style={{
                      background: r.tipo === "INGRESO" ? "#d6ebe3" : "#f0dcd6",
                      color: r.tipo === "INGRESO" ? "var(--verde-700)" : "var(--error)",
                    }}
                  >
                    {r.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                  </span>
                </td>
                <td>{textoFrecuencia(r.frecuenciaDias)}</td>
                <td>{r.activa ? formatearFecha(r.proximaEjecucion) : "—"}</td>
                <td>{r.cuentaNombre}</td>
                <td
                  style={{ textAlign: "right" }}
                  className={r.tipo === "INGRESO" ? "monto-ingreso" : "monto-egreso"}
                >
                  {formatearMoneda(r.monto)}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {r.activa ? (
                    <BotonDesactivar id={r.id} onListo={recargar} />
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--tinta-60)" }}>Inactiva</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto && (
        <ModalRegla
          cuentas={(cuentas.data ?? []).filter((c) => c.activa)}
          categorias={categorias.data ?? []}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={recargar}
        />
      )}
    </>
  );
}

// ============================================================
// Botón desactivar (el backend no borra, desactiva)
// ============================================================
function BotonDesactivar({ id, onListo }: { id: number; onListo: () => void }) {
  const [procesando, setProcesando] = useState(false);

  async function desactivar() {
    if (!confirm("¿Desactivar esta regla? Dejará de generar movimientos automáticos.")) {
      return;
    }
    setProcesando(true);
    try {
      await reglaApi.desactivar(id);
      onListo();
    } catch (e) {
      alert(e instanceof HttpError ? e.message : "No se pudo desactivar");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <button className="btn-link peligro" onClick={desactivar} disabled={procesando}>
      {procesando ? "…" : "Desactivar"}
    </button>
  );
}

// ============================================================
// Modal crear regla
// ============================================================
function ModalRegla({
  cuentas,
  categorias,
  onCerrar,
  onGuardado,
}: {
  cuentas: CuentaResponse[];
  categorias: CategoriaResponse[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [tipo, setTipo] = useState<TipoMovimiento>("INGRESO");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [cuentaId, setCuentaId] = useState<number>(cuentas[0]?.id ?? 0);
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [frecuenciaDias, setFrecuenciaDias] = useState<number>(30);
  const [proximaEjecucion, setProximaEjecucion] = useState(hoyIso());
  const [esFamiliar, setEsFamiliar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Categorías filtradas por tipo, igual que en movimientos.
  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  useEffect(() => {
    const sigueValida = categoriasFiltradas.some((c) => c.id === categoriaId);
    if (!sigueValida) setCategoriaId(categoriasFiltradas[0]?.id ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cuentaId) return setError("Elegí una cuenta");
    if (!categoriaId) return setError("Elegí una categoría");
    if (descripcion.trim().length === 0) return setError("Poné una descripción");

    setEnviando(true);
    try {
      await reglaApi.crear({
        cuentaId,
        categoriaId,
        tipo,
        descripcion: descripcion.trim(),
        monto: Number(monto),
        esFamiliar,
        frecuenciaDias,
        proximaEjecucion,
      });
      onGuardado();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo crear la regla");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Nueva regla recurrente"
      subtitulo="Definí un movimiento que se repite y se genera solo."
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
            <option value="INGRESO">Ingreso (ej: sueldo)</option>
            <option value="EGRESO">Egreso (ej: alquiler)</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="desc">Descripción</label>
          <input
            id="desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Sueldo mensual"
            required
          />
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
          {cuentas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--error)" }}>No tenés cuentas activas.</p>
          ) : (
            <select id="cuenta" value={cuentaId} onChange={(e) => setCuentaId(Number(e.target.value))}>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
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
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="frecuencia">Frecuencia</label>
            <select
              id="frecuencia"
              value={frecuenciaDias}
              onChange={(e) => setFrecuenciaDias(Number(e.target.value))}
            >
              <option value={1}>Todos los días</option>
              <option value={7}>Cada semana</option>
              <option value={15}>Cada 15 días</option>
              <option value={30}>Cada mes</option>
            </select>
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="proxima">Primera ejecución</label>
            <input
              id="proxima"
              type="date"
              value={proximaEjecucion}
              onChange={(e) => setProximaEjecucion(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="campo">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={esFamiliar}
              onChange={(e) => setEsFamiliar(e.target.checked)}
              style={{ width: "auto" }}
            />
            <span style={{ fontWeight: 400, textTransform: "none" }}>
              Es un gasto/ingreso familiar
            </span>
          </label>
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Creando…" : "Crear regla"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
