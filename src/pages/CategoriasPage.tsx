import { useState, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { categoriaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import type { CategoriaResponse, TipoMovimiento } from "../types";

export function CategoriasPage() {
  const { data: categorias, loading, error, reload } = useAsync(() =>
    categoriaApi.listar()
  );

  // Filtro visual por tipo (TODOS / INGRESO / EGRESO).
  const [filtro, setFiltro] = useState<"TODOS" | TipoMovimiento>("TODOS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editar, setEditar] = useState<CategoriaResponse | null>(null);

  const lista = (categorias ?? []).filter((c) =>
    filtro === "TODOS" ? true : c.tipo === filtro
  );

  function abrirNueva() {
    setEditar(null);
    setModalAbierto(true);
  }
  function abrirEditar(c: CategoriaResponse) {
    setEditar(c);
    setModalAbierto(true);
  }
  function cerrar() {
    setModalAbierto(false);
    setEditar(null);
  }
  function recargar() {
    reload();
    cerrar();
  }

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Categorías
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Cómo clasificás tus ingresos y gastos.
          </p>
        </div>
        <button className="btn btn-primario btn-auto" onClick={abrirNueva}>
          + Nueva categoría
        </button>
      </header>

      {/* Filtro por tipo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["TODOS", "INGRESO", "EGRESO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={filtro === f ? "btn btn-primario btn-chico" : "btn btn-secundario btn-chico"}
          >
            {f === "TODOS" ? "Todas" : f === "INGRESO" ? "Ingresos" : "Egresos"}
          </button>
        ))}
      </div>

      {loading && <div className="estado">Cargando categorías…</div>}
      {error && <div className="estado estado-error">{error}</div>}

      {categorias && lista.length === 0 && (
        <div className="estado">No hay categorías para mostrar.</div>
      )}

      {lista.length > 0 && (
        <table className="movimientos-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th style={{ textAlign: "center" }}>Movimientos</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td>
                  <span
                    className="badge-cat"
                    style={{
                      background: c.tipo === "INGRESO" ? "#d6ebe3" : "#f0dcd6",
                      color: c.tipo === "INGRESO" ? "var(--verde-700)" : "var(--error)",
                    }}
                  >
                    {c.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                  </span>
                </td>
                <td style={{ textAlign: "center", color: "var(--tinta-60)" }}>
                  {c.cantidadMovimientos}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn-link" onClick={() => abrirEditar(c)}>
                    Editar
                  </button>
                  <BotonEliminar id={c.id} nombre={c.nombre} onListo={recargar} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto && (
        <ModalCategoria categoria={editar} onCerrar={cerrar} onGuardado={recargar} />
      )}
    </>
  );
}

// ============================================================
// Botón eliminar. El backend rechaza borrar categorías por defecto
// o con movimientos; mostramos ese mensaje si pasa.
// ============================================================
function BotonEliminar({
  id,
  nombre,
  onListo,
}: {
  id: number;
  nombre: string;
  onListo: () => void;
}) {
  const [borrando, setBorrando] = useState(false);

  async function eliminar() {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    setBorrando(true);
    try {
      await categoriaApi.eliminar(id);
      onListo();
    } catch (e) {
      // Ej: "No se puede eliminar una categoria por defecto del sistema"
      // o "...tiene N movimientos asociados"
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
// Modal crear / editar categoría
// ============================================================
function ModalCategoria({
  categoria,
  onCerrar,
  onGuardado,
}: {
  categoria: CategoriaResponse | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const esEdicion = !!categoria;

  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoMovimiento>(categoria?.tipo ?? "EGRESO");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validación en cliente que refleja la del backend (nombre 2-50).
    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setEnviando(true);
    try {
      const payload = { nombre: nombre.trim(), tipo };
      if (esEdicion) {
        await categoriaApi.actualizar(categoria!.id, payload);
      } else {
        await categoriaApi.crear(payload);
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
      titulo={esEdicion ? "Editar categoría" : "Nueva categoría"}
      subtitulo={
        esEdicion ? "Cambiá el nombre o el tipo." : "Creá una categoría a tu medida."
      }
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
            placeholder="Ej: Delivery"
            maxLength={50}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
          >
            <option value="EGRESO">Egreso (gasto)</option>
            <option value="INGRESO">Ingreso</option>
          </select>
          {/* Aviso: el backend no deja cambiar el tipo si ya tiene movimientos */}
          {esEdicion && categoria!.cantidadMovimientos > 0 && (
            <p style={{ fontSize: 12, color: "var(--tinta-60)", marginTop: 4 }}>
              Esta categoría tiene movimientos: quizás no puedas cambiarle el tipo.
            </p>
          )}
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
