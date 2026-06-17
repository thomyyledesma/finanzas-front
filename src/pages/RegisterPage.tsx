import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HttpError } from "../api/http";
import "../styles/auth.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validación en cliente que refleja la del backend (password min 6).
    // Así el usuario ve el error al instante sin esperar el round-trip.
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setEnviando(true);
    try {
      await register({ nombre, email, password });
      navigate("/"); // al registrarse queda logueado y va al dashboard
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo crear la cuenta");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-marca">
        <div className="auth-marca-logo">Plata clara</div>
        <h2 className="auth-marca-titular">
          Empezá a ordenar<br />
          <em>tus finanzas hoy.</em>
        </h2>
        <p className="auth-marca-pie">Gratis. Tus datos son solo tuyos.</p>
      </aside>

      <main className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Crear cuenta</h1>
          <p className="auth-form-sub">Un par de datos y listo.</p>

          {error && <div className="alerta-error" role="alert">{error}</div>}

          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Creando…" : "Crear cuenta"}
          </button>

          <p className="auth-form-link">
            ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
