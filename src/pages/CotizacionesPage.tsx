import { useAsync } from "../hooks/useAsync";
import { externoApi } from "../api";
import { formatearMoneda } from "../lib/format";
import type { CotizacionDTO, CriptoDTO } from "../types";

// Formatea un valor en USD (las cripto vienen en dólares).
function formatearUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function CotizacionesPage() {
  const dolares = useAsync(() => externoApi.dolares());
  const divisas = useAsync(() => externoApi.divisas());
  const criptos = useAsync(() => externoApi.criptos());

  return (
    <>
      <header className="contenido-header">
        <h1>Cotizaciones</h1>
        <p>Valores del dólar, divisas y criptomonedas en tiempo real.</p>
      </header>

      {/* DÓLAR */}
      <h2 className="seccion-titulo">Dólar</h2>
      <BloqueCotizaciones estado={dolares} />

      {/* DIVISAS */}
      <h2 className="seccion-titulo">Otras divisas</h2>
      <BloqueCotizaciones estado={divisas} />

      {/* CRIPTO */}
      <h2 className="seccion-titulo">Criptomonedas</h2>
      {criptos.loading && <div className="estado">Cargando criptomonedas…</div>}
      {criptos.error && <div className="estado estado-error">{criptos.error}</div>}
      {criptos.data && criptos.data.length > 0 && (
        <div className="coti-grid">
          {criptos.data.map((c: CriptoDTO) => {
            const sube = c.cambio24h >= 0;
            return (
              <div key={c.id} className="coti-card">
                <div className="coti-nombre">
                  {c.name}{" "}
                  <span style={{ color: "var(--tinta-60)", fontWeight: 400 }}>
                    ({c.symbol?.toUpperCase()})
                  </span>
                </div>
                <div className="cripto-precio">{formatearUsd(c.precioUsd)}</div>
                <div className={sube ? "cripto-cambio sube" : "cripto-cambio baja"}>
                  {sube ? "▲" : "▼"} {Math.abs(c.cambio24h).toFixed(2)}% (24h)
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// Bloque reutilizable para dólar y divisas (misma estructura).
function BloqueCotizaciones({
  estado,
}: {
  estado: { data: CotizacionDTO[] | null; loading: boolean; error: string | null };
}) {
  if (estado.loading) return <div className="estado">Cargando…</div>;
  if (estado.error) return <div className="estado estado-error">{estado.error}</div>;
  if (!estado.data || estado.data.length === 0)
    return <div className="estado">Sin datos disponibles.</div>;

  return (
    <div className="coti-grid">
      {estado.data.map((c, i) => (
        <div key={`${c.casa}-${i}`} className="coti-card">
          <div className="coti-nombre">{c.nombre || c.casa}</div>
          <div className="coti-valores">
            <div>
              <div className="coti-valor-label">Compra</div>
              <div className="coti-valor">{formatearMoneda(c.compra)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="coti-valor-label">Venta</div>
              <div className="coti-valor">{formatearMoneda(c.venta)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
