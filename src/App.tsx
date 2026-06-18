import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CuentasPage } from "./pages/CuentasPage";
import { MovimientosPage } from "./pages/MovimientosPage";
import { CategoriasPage } from "./pages/CategoriasPage";
import { PresupuestosPage } from "./pages/PresupuestosPage";
import { MetasPage } from "./pages/MetasPage";
import { ReglasPage } from "./pages/ReglasPage";
import { CotizacionesPage } from "./pages/CotizacionesPage";
import { AnalisisPage } from "./pages/AnalisisPage";
import { PerfilPage } from "./pages/PerfilPage";

// Envuelve una página con el layout + la protección de ruta.
function Privada({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Privadas */}
          <Route path="/" element={<Privada><DashboardPage /></Privada>} />
          <Route path="/cuentas" element={<Privada><CuentasPage /></Privada>} />
          <Route path="/movimientos" element={<Privada><MovimientosPage /></Privada>} />
          <Route path="/categorias" element={<Privada><CategoriasPage /></Privada>} />
          <Route path="/presupuestos" element={<Privada><PresupuestosPage /></Privada>} />
          <Route path="/metas" element={<Privada><MetasPage /></Privada>} />
          <Route path="/reglas" element={<Privada><ReglasPage /></Privada>} />
          <Route path="/cotizaciones" element={<Privada><CotizacionesPage /></Privada>} />
          <Route path="/analisis" element={<Privada><AnalisisPage /></Privada>} />
          <Route path="/perfil" element={<Privada><PerfilPage /></Privada>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
