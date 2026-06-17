import { useState, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { presupuestoApi, categoriaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { formatearMoneda } from "../lib/format";
import type { PresupuestoResponse, CategoriaResponse } from "../types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function PresupuestosPage() {
  const presupuestos = useAsync(() => presupuestoApi.listar());
  // Solo categorías de EGRESO: no se presupuestan ingresos.
  const categorias = useAsync(() => categoriaApi.listar("EGRESO"));

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editar, setEditar] = useState<PresupuestoResponse | null>(null);

  function abrirNuevo() {
    setEditar(null);
    setModalAbierto(true);
  }
  function abrirEditar(p: PresupuestoResponse) {
    setEditar(p);
    setModalAbierto(true);
  }
  function cerrar() {
    setModalAbierto(false);
    setEditar(null);
  }
  function recargar() {
    presupuestos.reload();
    cerrar();
  }

  // Ordenamos por año/mes descendente (los más recientes primero).
  const lista = (presupuestos.data ?? [])
    .slice()
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Presupuestos
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Límites de gasto por categoría y mes.
          </p>
        </div>
        <button className="btn btn-primario btn-auto" onClick={abrirNuevo}>
          + Nuevo presupuesto
        </button>
      </header>

      {presupuestos.loading && <div className="estado">Cargando presupuestos…</div>}
      {presupuestos.error && (
        <div className="estado estado-error">{presupuestos.error}</div>
      )}

      {presupuestos.data && lista.length === 0 && (
        <div className="estado">
          Todavía no definiste presupuestos. Creá uno para controlar tus gastos por categoría.
        </div>
      )}

      {lista.length > 0 && (
        <div className="presupuestos-grid">
          {lista.map((p) => (
            <PresupuestoCard
              key={p.id}
              presupuesto={p}
              onEditar={() => abrirEditar(p)}
              onListo={recargar}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalPresupuesto
          presupuesto={editar}
          categorias={categorias.data ?? []}
          onCerrar={cerrar}
          onGuardado={recargar}
        />
      )}
    </>
  );
}

// ============================================================
// Tarjeta individual con barra de progreso
// ============================================================
function PresupuestoCard({
  presupuesto: p,
  onEditar,
  onListo,
}: {
  presupuesto: PresupuestoResponse;
  onEditar: () => void;
  onListo: () => void;
}) {
  const [borrando, setBorrando] = useState(false);

  // Porcentaje consumido (tope visual en 100% para la barra).
  const pct = p.montoLimite > 0 ? (p.montoConsumido / p.montoLimite) * 100 : 0;
  const pctVisual = Math.min(pct, 100);
  const pctTexto = Math.round(pct);

  // Color según cuán cerca del límite: verde < 80%, ámbar 80-100%, rojo > 100%.
  const clase = pct > 100 ? "excedido" : pct >= 80 ? "alerta" : "ok";

  async function eliminar() {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    setBorrando(true);
    try {
      await presupuestoApi.eliminar(p.id);
      onListo();
    } catch (e) {
      alert(e instanceof HttpError ? e.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="presupuesto-card">
      <div className="presupuesto-card-header">
        <div className="presupuesto-card-cat">{p.categoriaNombre}</div>
      </div>
      <div className="presupuesto-card-periodo">
        {MESES[p.mes - 1]} {p.anio}
      </div>

      <div className="presupuesto-montos">
        <span className="presupuesto-consumido">{formatearMoneda(p.montoConsumido)}</span>
        <span className="presupuesto-limite">de {formatearMoneda(p.montoLimite)}</span>
      </div>

      <div className="barra">
        <div className={`barra-relleno ${clase}`} style={{ width: `${pctVisual}%` }} />
      </div>

      <div
        className="presupuesto-pct"
        style={{
          color:
            clase === "excedido"
              ? "var(--error)"
              : clase === "alerta"
              ? "var(--ambar-700)"
              : "var(--verde-500)",
        }}
      >
        {pctTexto}% usado
        {pct > 100 && " · ¡excedido!"}
      </div>

      <div className="presupuesto-card-acciones">
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
// Modal crear / editar presupuesto
// ============================================================
function ModalPresupuesto({
  presupuesto,
  categorias,
  onCerrar,
  onGuardado,
}: {
  presupuesto: PresupuestoResponse | null;
  categorias: CategoriaResponse[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const esEdicion = !!presupuesto;
  const ahora = new Date();

  const [montoLimite, setMontoLimite] = useState(
    presupuesto?.montoLimite?.toString() ?? ""
  );
  const [categoriaId, setCategoriaId] = useState<number>(
    presupuesto?.categoriaId ?? categorias[0]?.id ?? 0
  );
  const [mes, setMes] = useState<number>(presupuesto?.mes ?? ahora.getMonth() + 1);
  const [anio, setAnio] = useState<number>(presupuesto?.anio ?? ahora.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoriaId) {
      setError("Elegí una categoría");
      return;
    }

    const payload = {
      montoLimite: Number(montoLimite),
      mes,
      anio,
      categoriaId,
    };

    setEnviando(true);
    try {
      if (esEdicion) {
        await presupuestoApi.actualizar(presupuesto!.id, payload);
      } else {
        await presupuestoApi.crear(payload);
      }
      onGuardado();
    } catch (e) {
      // Ej: "Presupuesto existente para esa categoria en ese mes/año"
      setError(e instanceof HttpError ? e.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  }

  // Años para el selector: el actual y los dos siguientes.
  const anios = [ahora.getFullYear(), ahora.getFullYear() + 1, ahora.getFullYear() + 2];

  return (
    <Modal
      titulo={esEdicion ? "Editar presupuesto" : "Nuevo presupuesto"}
      subtitulo="Definí cuánto querés gastar como máximo en una categoría."
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="categoria">Categoría (de egreso)</label>
          {categorias.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--error)" }}>
              No tenés categorías de egreso.
            </p>
          ) : (
            <select
              id="categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(Number(e.target.value))}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="campo">
          <label htmlFor="monto">Monto límite</label>
          <input
            id="monto"
            type="number"
            step="0.01"
            min="0.01"
            value={montoLimite}
            onChange={(e) => setMontoLimite(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="mes">Mes</label>
            <select id="mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((nombre, i) => (
                <option key={i} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="anio">Año</label>
            <select id="anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
