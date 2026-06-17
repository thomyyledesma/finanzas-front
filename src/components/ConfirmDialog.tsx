import { Modal } from "./Modal";

interface ConfirmDialogProps {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean; // si true, el botón confirmar es rojo (para eliminar)
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Diálogo de confirmación reutilizable. Reemplaza al confirm() del navegador.
// Se usa para eliminar cuentas, categorías, movimientos, metas, etc.
export function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = false,
  procesando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal titulo={titulo} onCerrar={onCancelar}>
      <p style={{ color: "var(--tinta-60)", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
        {mensaje}
      </p>
      <div className="modal-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={procesando}>
          {textoCancelar}
        </button>
        <button
          type="button"
          className={peligro ? "btn btn-peligro-lleno" : "btn btn-primario"}
          onClick={onConfirmar}
          disabled={procesando}
        >
          {procesando ? "Procesando…" : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
