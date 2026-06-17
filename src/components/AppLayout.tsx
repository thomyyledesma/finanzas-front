import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/app.css";

// Links del menú. Por ahora solo Dashboard y Cuentas tienen página real;
// los demás los vamos sumando. Dejo la estructura lista para crecer.
const navItems = [
  { to: "/", label: "Resumen", end: true },
  { to: "/cuentas", label: "Cuentas" },
  { to: "/movimientos", label: "Movimientos" },
  { to: "/categorias", label: "Categorías" },
  { to: "/presupuestos", label: "Presupuestos" },
  { to: "/metas", label: "Metas" },
  { to: "/reglas", label: "Reglas recurrentes" },
  { to: "/cotizaciones", label: "Cotizaciones" },
  { to: "/analisis", label: "Análisis IA" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleSalir() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">Plata clara</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "sidebar-link activo" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-nombre">{usuario?.nombre}</div>
          <div className="sidebar-user-email">{usuario?.email}</div>
          <button className="btn-salir" onClick={handleSalir}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="contenido">{children}</main>
    </div>
  );
}
