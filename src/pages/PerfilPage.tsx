import { useState, type FormEvent } from "react";
import { usuarioApi } from "../api";
import { HttpError } from "../api/http";
import { useAuth } from "../context/AuthContext";

export function PerfilPage() {
  const { usuario, setUsuarioActual } = useAuth();

  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setEnviando(true);
    try {
      const actualizado = await usuarioApi.actualizar({ nombre: nombre.trim() });
      setUsuarioActual(actualizado); // refresca el nombre en la barra lateral
      setExito("Perfil actualizado correctamente.");
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo actualizar el perfil");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="contenido-header">
        <h1>Mi perfil</h1>
        <p>Editá los datos de tu cuenta.</p>
      </header>

      <div className="perfil-panel">
        <form onSubmit={handleSubmit}>
          {error && <div className="alerta-error">{error}</div>}
          {exito && <div className="alerta-exito">{exito}</div>}

          <div className="campo">
            <label htmlFor="email">Email</label>
            {/* El email no se puede cambiar; lo mostramos solo informativo. */}
            <input id="email" value={usuario?.email ?? ""} disabled />
          </div>

          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <button type="submit" className="btn btn-primario btn-auto" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </>
  );
}
