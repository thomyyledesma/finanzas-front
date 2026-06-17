import { useState, type FormEvent } from "react";
import { useAsync } from "../hooks/useAsync";
import { cuentaApi } from "../api";
import { HttpError } from "../api/http";
import { Modal } from "../components/Modal";
import { formatearMoneda, formatearTipoCuenta } from "../lib/format";
import type { CuentaResponse, TipoCuenta } from "../types";

// Tipos de cuenta que se pueden elegir al crear (EFECTIVO se crea sola al registrarse).
const TIPOS: TipoCuenta[] = ["BANCO", "BILLETERA_VIRTUAL", "INVERSION", "TARJETA_CREDITO"];

export function CuentasPage() {
  const { data: cuentas, loading, error, reload } = useAsync(() => cuentaApi.listar());

  // Estado de los modales: null = cerrado.
  const [modalCrear, setModalCrear] = useState(false);
  const [cuentaEditar, setCuentaEditar] = useState<CuentaResponse | null>(null);
  const [modalTransferir, setModalTransferir] = useState(false);

  return (
    <>
      <header className="header-con-accion">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }}>
            Cuentas
          </h1>
          <p style={{ color: "var(--tinta-60)", fontSize: 15, marginTop: 4 }}>
            Tus cuentas y saldos.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {cuentas && cuentas.length >= 2 && (
            <button
              className="btn btn-secundario btn-auto"
              onClick={() => setModalTransferir(true)}
            >
              Transferir
            </button>
          )}
          <button className="btn btn-primario btn-auto" onClick={() => setModalCrear(true)}>
            + Nueva cuenta
          </button>
        </div>
      </header>

      {loading && <div className="estado">Cargando cuentas…</div>}
      {error && <div className="estado estado-error">{error}</div>}

      {cuentas && cuentas.length > 0 && (
        <div className="cuentas-grid">
          {cuentas.map((c) => (
            <div key={c.id} className={c.activa ? "cuenta-card" : "cuenta-card inactiva"}>
              <div className="cuenta-card-tipo">{formatearTipoCuenta(c.tipoCuenta)}</div>
              <div className="cuenta-card-nombre">{c.nombre}</div>
              <div className="cuenta-card-saldo">{formatearMoneda(c.saldo)}</div>

              <div className="cuenta-card-acciones">
                <button className="btn-link" onClick={() => setCuentaEditar(c)}>
                  Editar
                </button>
                {/* La cuenta de efectivo no se puede eliminar (regla del backend) */}
                {c.tipoCuenta !== "EFECTIVO" && (
                  <BotonEliminar id={c.id} nombre={c.nombre} onListo={reload} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalCrear && (
        <ModalCuenta
          onCerrar={() => setModalCrear(false)}
          onGuardado={() => {
            setModalCrear(false);
            reload();
          }}
        />
      )}

      {cuentaEditar && (
        <ModalCuenta
          cuenta={cuentaEditar}
          onCerrar={() => setCuentaEditar(null)}
          onGuardado={() => {
            setCuentaEditar(null);
            reload();
          }}
        />
      )}

      {modalTransferir && cuentas && (
        <ModalTransferir
          cuentas={cuentas.filter((c) => c.activa)}
          onCerrar={() => setModalTransferir(false)}
          onListo={() => {
            setModalTransferir(false);
            reload();
          }}
        />
      )}
    </>
  );
}

// ============================================================
// Botón eliminar con confirmación
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
    if (!confirm(`¿Eliminar la cuenta "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBorrando(true);
    try {
      await cuentaApi.eliminar(id);
      onListo();
    } catch (e) {
      alert(e instanceof HttpError ? e.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <button className="btn-link peligro" onClick={eliminar} disabled={borrando}>
      {borrando ? "Eliminando…" : "Eliminar"}
    </button>
  );
}

// ============================================================
// Modal de crear / editar cuenta (mismo form para ambos casos)
// ============================================================
function ModalCuenta({
  cuenta,
  onCerrar,
  onGuardado,
}: {
  cuenta?: CuentaResponse;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const esEdicion = !!cuenta;
  const esEfectivo = cuenta?.tipoCuenta === "EFECTIVO";

  const [nombre, setNombre] = useState(cuenta?.nombre ?? "");
  const [saldo, setSaldo] = useState(cuenta?.saldo?.toString() ?? "0");
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipoCuenta ?? "BANCO");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esEdicion) {
        // Al editar no se cambia el saldo (eso se mueve con movimientos).
        await cuentaApi.actualizar(cuenta!.id, { nombre, tipoCuenta: tipo });
      } else {
        await cuentaApi.crear({ nombre, saldo: Number(saldo), tipoCuenta: tipo });
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
      titulo={esEdicion ? "Editar cuenta" : "Nueva cuenta"}
      subtitulo={esEdicion ? "Cambiá el nombre o el tipo." : "Creá una cuenta para organizar tu plata."}
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
            placeholder="Ej: Banco Nación"
            required
          />
        </div>

        {/* El saldo inicial solo se pide al crear */}
        {!esEdicion && (
          <div className="campo">
            <label htmlFor="saldo">Saldo inicial</label>
            <input
              id="saldo"
              type="number"
              step="0.01"
              min="0"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              required
            />
          </div>
        )}

        <div className="campo">
          <label htmlFor="tipo">Tipo de cuenta</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuenta)}
            disabled={esEfectivo} /* el tipo EFECTIVO no se cambia */
          >
            {/* Si es efectivo lo mostramos como opción fija */}
            {esEfectivo && <option value="EFECTIVO">Efectivo</option>}
            {!esEfectivo &&
              TIPOS.map((t) => (
                <option key={t} value={t}>
                  {formatearTipoCuenta(t)}
                </option>
              ))}
          </select>
        </div>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear cuenta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// Modal de transferencia entre cuentas
// ============================================================
function ModalTransferir({
  cuentas,
  onCerrar,
  onListo,
}: {
  cuentas: CuentaResponse[];
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [origenId, setOrigenId] = useState(cuentas[0]?.id ?? 0);
  const [destinoId, setDestinoId] = useState(cuentas[1]?.id ?? 0);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (origenId === destinoId) {
      setError("La cuenta de origen y destino deben ser distintas");
      return;
    }

    setEnviando(true);
    try {
      await cuentaApi.transferir({
        cuentaOrigenId: origenId,
        cuentaDestinoId: destinoId,
        monto: Number(monto),
      });
      onListo();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo transferir");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Transferir entre cuentas"
      subtitulo="Mové plata de una cuenta a otra."
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="alerta-error">{error}</div>}

        <div className="campo">
          <label htmlFor="origen">Desde</label>
          <select id="origen" value={origenId} onChange={(e) => setOrigenId(Number(e.target.value))}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({formatearMoneda(c.saldo)})
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="destino">Hacia</label>
          <select id="destino" value={destinoId} onChange={(e) => setDestinoId(Number(e.target.value))}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({formatearMoneda(c.saldo)})
              </option>
            ))}
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

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Transfiriendo…" : "Transferir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
