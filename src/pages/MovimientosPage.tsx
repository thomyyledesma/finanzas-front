import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { movimientoApi, cuentaApi, categoriaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatearMoneda, formatearFecha } from "../lib/format";
import type {
  MovimientoResponse,
  CuentaResponse,
  CategoriaResponse,
  TipoMovimiento,
} from "../types";

function hoyIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function MovimientosPage() {
  const movimientos = useAsync(() => movimientoApi.listar());
  const cuentas = useAsync(() => cuentaApi.listar());
  const categorias = useAsync(() => categoriaApi.listar());

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editar, setEditar] = useState<MovimientoResponse | null>(null);
  const [aEliminar, setAEliminar] = useState<MovimientoResponse | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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
    cuentas.reload();
    cerrar();
  }

  const lista = useMemo(() => {
    return (movimientos.data ?? [])
      .filter((m) => {
        if (desde && m.fecha < desde) return false;
        if (hasta && m.fecha > hasta) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        // Primero por fecha (día) descendente. Dentro del mismo día, como los
        // movimientos no guardan hora, desempatamos por id: un id más alto se
        // creó después, así el más reciente del día queda arriba.
        const porFecha = b.fecha.localeCompare(a.fecha);
        if (porFecha !== 0) return porFecha;
        return b.id - a.id;
      });
  }, [movimientos.data, desde, hasta]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, MovimientoResponse[]>();
    for (const m of lista) {
      if (!mapa.has(m.fecha)) mapa.set(m.fecha, []);
      mapa.get(m.fecha)!.push(m);
    }
    return Array.from(mapa.entries());
  }, [lista]);

  const hayFiltro = desde !== "" || hasta !== "";

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

      <div className="filtro-fechas">
        <div className="filtro-campo">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" value={desde} max={hoyIso()} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="filtro-campo">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={hasta} max={hoyIso()} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {hayFiltro && (
          <button
            className="btn btn-secundario btn-chico"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {movimientos.loading && <div className="estado">Cargando movimientos…</div>}
      {movimientos.error && <div className="estado estado-error">{movimientos.error}</div>}

      {movimientos.data && lista.length === 0 && (
        <div className="estado">
          {hayFiltro
            ? "No hay movimientos en ese rango de fechas."
            : 'Todavía no registraste movimientos. Tocá "Registrar movimiento" para empezar.'}
        </div>
      )}

      {grupos.length > 0 && (
        <div className="mov-grupos">
          {grupos.map(([fecha, items]) => (
            <div key={fecha} className="mov-grupo">
              <div className="mov-grupo-fecha">{formatearFecha(fecha)}</div>
              <table className="movimientos-tabla">
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
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
                        <button className="btn-link peligro" onClick={() => setAEliminar(m)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
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

      {aEliminar && (
        <DialogoEliminar
          movimiento={aEliminar}
          onCerrar={() => setAEliminar(null)}
          onListo={() => {
            setAEliminar(null);
            recargarTodo();
          }}
        />
      )}
    </>
  );
}

function DialogoEliminar({
  movimiento,
  onCerrar,
  onListo,
}: {
  movimiento: MovimientoResponse;
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    setBorrando(true);
    setError(null);
    try {
      await movimientoApi.eliminar(movimiento.id);
      onListo();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo eliminar");
      setBorrando(false);
    }
  }

  if (error) {
    return (
      <ConfirmDialog
        titulo="No se pudo eliminar"
        mensaje={error}
        textoConfirmar="Entendido"
        textoCancelar="Cerrar"
        onConfirmar={onCerrar}
        onCancelar={onCerrar}
      />
    );
  }

  return (
    <ConfirmDialog
      titulo="Eliminar movimiento"
      mensaje={`¿Seguro que querés eliminar este movimiento de ${formatearMoneda(
        movimiento.monto
      )}? El saldo de la cuenta se va a ajustar. Esta acción no se puede deshacer.`}
      textoConfirmar="Eliminar"
      peligro
      procesando={borrando}
      onConfirmar={eliminar}
      onCancelar={onCerrar}
    />
  );
}

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

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

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

    const hoy = hoyIso();
    if (fecha > hoy) {
      setError("La fecha no puede ser futura.");
      return;
    }
    const anio = Number(fecha.split("-")[0]);
    if (anio < 2000 || anio > new Date().getFullYear()) {
      setError(`El año debe estar entre 2000 y ${new Date().getFullYear()}.`);
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
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
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
            <select id="cuenta" value={cuentaId} onChange={(e) => setCuentaId(Number(e.target.value))}>
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
            max={hoyIso()}
            min="2000-01-01"
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
