import { useEffect, type ReactNode } from "react";
import "../styles/componentes.css";

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: ReactNode;
}

// Ventana emergente reutilizable. Se cierra clickeando el fondo o con Escape.
export function Modal({ titulo, subtitulo, onCerrar, children }: ModalProps) {
  // Cerrar con la tecla Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      {/* stopPropagation evita que un click DENTRO del modal lo cierre */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        {subtitulo && <p className="modal-sub">{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}
