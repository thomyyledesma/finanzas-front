import { useState, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { metaApi, cuentaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { formatearMoneda, formatearFecha } from "../lib/format";
import type { MetaAhorroResponse, CuentaResponse } from "../types";

export function MetasPage() {
  const metas = useAsync(() => metaApi.listar());
  const cuentas = useAsync(() => cuentaApi.listar());

  // Modales: crear/editar meta, y depositar/retirar.
  const [modalMeta, setModalMeta] = useState(false);
  const [editar, setEditar] = useState<MetaAhorroResponse | null>(null);
  const [movimiento, setMovimiento] = useState<{
    meta: MetaAhorroResponse;
    tipo: "depositar" | "retirar";
  } | null>(null);

  function recargar() {
    metas.reload();
    cuentas.reload(); // depositar/retirar cambia saldos
    setModalMeta(false);
    setEditar(null);
    setMovimiento(null);
  }

  const lista = (metas.data ?? []).slice().sort((a, b) => {
    // No cumplidas primero, después por nombre.
    if (a.cumplida !== b.cumplida) return a.cumplida ? 1 : -1;
    return a.nombre.localeCompare(b.nombre);
  });

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Metas de ahorro
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Tus objetivos y cuánto llevás ahorrado.
          </p>
        </div>
        <button
          className="btn btn-primario btn-auto"
          onClick={() => {
            setEditar(null);
            setModalMeta(true);
          }}
        >
          + Nueva meta
        </button>
      </header>

      {metas.loading && <div className="estado">Cargando metas…</div>}
      {metas.error && <div className="estado estado-error">{metas.error}</div>}

      {metas.data && lista.length === 0 && (
        <div className="estado">
          Todavía no tenés metas. Creá una para empezar a ahorrar con un objetivo.
        </div>
      )}

      {lista.length > 0 && (
        <div className="metas-grid">
          {lista.map((m) => (
            <MetaCard
              key={m.id}
              meta={m}
              onEditar={() => {
                setEditar(m);
                setModalMeta(true);
              }}
              onDepositar={() => setMovimiento({ meta: m, tipo: "depositar" })}
              onRetirar={() => setMovimiento({ meta: m, tipo: "retirar" })}
              onListo={recargar}
            />
          ))}
        </div>
      )}

      {modalMeta && (
        <ModalMeta
          meta={editar}
          cuentas={(cuentas.data ?? []).filter((c) => c.activa)}
          onCerrar={() => {
            setModalMeta(false);
            setEditar(null);
          }}
          onGuardado={recargar}
        />
      )}

      {movimiento && (
        <ModalMovimientoMeta
          meta={movimiento.meta}
          tipo={movimiento.tipo}
          cuentas={(cuentas.data ?? []).filter((c) => c.activa)}
          onCerrar={() => setMovimiento(null)}
          onListo={recargar}
        />
      )}
    </>
  );
}

// ============================================================
// Tarjeta de meta con barra de progreso
// ============================================================
function MetaCard({
  meta: m,
  onEditar,
  onDepositar,
  onRetirar,
  onListo,
}: {
  meta: MetaAhorroResponse;
  onEditar: () => void;
  onDepositar: () => void;
  onRetirar: () => void;
  onListo: () => void;
}) {
  const [borrando, setBorrando] = useState(false);
  const pct = Math.min(m.porcentajeProgreso, 100);

  async function eliminar() {
    if (!confirm(`¿Eliminar la meta "${m.nombre}"?`)) return;
    setBorrando(true);
    try {
      await metaApi.eliminar(m.id);
      onListo();
    } catch (e) {
      alert(e instanceof HttpError ? e.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className={m.cumplida ? "meta-card cumplida" : "meta-card"}>
      {m.cumplida && <span className="meta-cumplida-badge">✓ CUMPLIDA</span>}

      <div className="meta-card-nombre">{m.nombre}</div>
      <div className="meta-card-fecha">
        {m.fechaLimite ? `Objetivo para ${formatearFecha(m.fechaLimite)}` : "Sin fecha límite"}
      </div>

      <div className="meta-montos">
        <span className="meta-actual">{formatearMoneda(m.montoActual)}</span>
        <span className="meta-objetivo">de {formatearMoneda(m.montoObjetivo)}</span>
      </div>

      <div className="barra">
        <div
          className={`barra-relleno meta ${m.cumplida ? "completa" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="meta-pct">{Math.round(m.porcentajeProgreso)}% del objetivo</div>

      <div className="meta-card-acciones">
        <button className="btn-link" onClick={onDepositar} disabled={m.cumplida}>
          Depositar
        </button>
        <button className="btn-link" onClick={onRetirar} disabled={m.montoActual <= 0}>
          Retirar
        </button>
        <button className="btn-link" onClick={onEditar}>
          Editar
        </button>
        <button className="btn-link peligro" onClick={eliminar} disabled={borrando}>
          {borrando ? "…" : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Modal crear / editar meta
// ============================================================
function ModalMeta({
  meta,
  cuentas,
  onCerrar,
  onGuardado,
}: {
  meta: MetaAhorroResponse | null;
  cuentas: CuentaResponse[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const esEdicion = !!meta;

  const [nombre, setNombre] = useState(meta?.nombre ?? "");
  const [montoObjetivo, setMontoObjetivo] = useState(meta?.montoObjetivo?.toString() ?? "");
  const [fechaLimite, setFechaLimite] = useState(meta?.fechaLimite ?? "");
  // cuentaId es opcional: la cuenta "por defecto" de la meta para depositar/retirar.
  const [cuentaId, setCuentaId] = useState<number>(meta?.cuentaId ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      montoObjetivo: Number(montoObjetivo),
      fechaLimite: fechaLimite || undefined,
      cuentaId: cuentaId || undefined,
    };

    setEnviando(true);
    try {
      if (esEdicion) {
        await metaApi.actualizar(meta!.id, payload);
      } else {
        await metaApi.crear(payload);
      }
      onGuardado();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={esEdicion ? "Editar meta" : "Nueva meta de ahorro"}
      subtitulo="Definí un objetivo y, si querés, una fecha y cuenta por defecto."
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Viaje a Brasil"
            maxLength={100}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="objetivo">Monto objetivo</label>
          <input
            id="objetivo"
            type="number"
            step="0.01"
            min="0.01"
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="fecha">Fecha límite (opcional)</label>
          <input
            id="fecha"
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="cuenta">Cuenta por defecto (opcional)</label>
          <select
            id="cuenta"
            value={cuentaId}
            onChange={(e) => setCuentaId(Number(e.target.value))}
          >
            <option value={0}>Ninguna (la elijo al depositar)</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear meta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// Modal depositar / retirar plata de una meta
// ============================================================
function ModalMovimientoMeta({
  meta,
  tipo,
  cuentas,
  onCerrar,
  onListo,
}: {
  meta: MetaAhorroResponse;
  tipo: "depositar" | "retirar";
  cuentas: CuentaResponse[];
  onCerrar: () => void;
  onListo: () => void;
}) {
  const esDeposito = tipo === "depositar";
  // Si la meta tiene cuenta por defecto, la preseleccionamos.
  const [cuentaId, setCuentaId] = useState<number>(meta.cuentaId ?? cuentas[0]?.id ?? 0);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cuentaId) {
      setError("Elegí una cuenta");
      return;
    }

    const payload = { monto: Number(monto), cuentaId };

    setEnviando(true);
    try {
      if (esDeposito) {
        await metaApi.depositar(meta.id, payload);
      } else {
        await metaApi.retirar(meta.id, payload);
      }
      onListo();
    } catch (e) {
      // Ej depósito: "Saldo insuficiente en la cuenta"
      // Ej retiro: "No hay suficiente saldo en la meta para retirar ese monto"
      setError(e instanceof HttpError ? e.message : "No se pudo completar la operación");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={esDeposito ? "Depositar en la meta" : "Retirar de la meta"}
      subtitulo={
        esDeposito
          ? `Sale plata de tu cuenta y se guarda en "${meta.nombre}".`
          : `Vuelve plata de "${meta.nombre}" a tu cuenta.`
      }
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="monto">Monto a {esDeposito ? "depositar" : "retirar"}</label>
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
          {!esDeposito && (
            <p style={{ fontSize: 12, color: "var(--tinta-60)", marginTop: 4 }}>
              Disponible en la meta: {formatearMoneda(meta.montoActual)}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor="cuenta">{esDeposito ? "Desde la cuenta" : "Hacia la cuenta"}</label>
          {cuentas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--error)" }}>No tenés cuentas activas.</p>
          ) : (
            <select
              id="cuenta"
              value={cuentaId}
              onChange={(e) => setCuentaId(Number(e.target.value))}
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({formatearMoneda(c.saldo)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Procesando…" : esDeposito ? "Depositar" : "Retirar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
