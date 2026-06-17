import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HttpError } from "../api/http";
import "../styles/auth.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login({ email, password });
      navigate("/"); // al dashboard
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-marca">
        <div className="auth-marca-logo">Plata clara</div>
        <h2 className="auth-marca-titular">
          Tu dinero,<br />
          <em>sin sorpresas.</em>
        </h2>
        <p className="auth-marca-pie">Cuentas, gastos y metas en un solo lugar.</p>
      </aside>

      <main className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Iniciar sesión</h1>
          <p className="auth-form-sub">Bienvenido de vuelta.</p>

          {error && <div className="alerta-error" role="alert">{error}</div>}

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
              autoComplete="current-password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>

          <p className="auth-form-link">
            ¿No tenés cuenta? <Link to="/register">Crear una</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
