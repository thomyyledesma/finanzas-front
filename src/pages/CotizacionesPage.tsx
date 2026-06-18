import { useAsync } from "../hooks/useAsync";
import { externoApi } from "../api";
import type { CotizacionDTO, CriptoDTO } from "../types";

// Formatea un valor en USD de forma robusta (puede venir como number o string).
function formatearUsd(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num == null || Number.isNaN(num)) return "—";
  // Cripto de bajo valor (ej: shiba) necesita más decimales.
  const maxDec = num < 1 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxDec,
  }).format(num);
}

// Formatea pesos de forma robusta.
function formatearPesos(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num == null || Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(num);
}

function aNumero(n: number | string | null | undefined): number {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return num == null || Number.isNaN(num) ? 0 : num;
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

      <h2 className="seccion-titulo">Dólar</h2>
      <BloqueCotizaciones estado={dolares} />

      <h2 className="seccion-titulo">Otras divisas</h2>
      <BloqueCotizaciones estado={divisas} />

      <h2 className="seccion-titulo">Criptomonedas</h2>
      {criptos.loading && <div className="estado">Cargando criptomonedas…</div>}
      {criptos.error && <div className="estado estado-error">{criptos.error}</div>}
      {criptos.data && criptos.data.length === 0 && (
        <div className="estado">
          No se pudieron cargar las cotizaciones de cripto en este momento (el
          servicio gratuito tiene un límite de consultas). Probá de nuevo en un rato.
        </div>
      )}
      {criptos.data && criptos.data.length > 0 && (
        <div className="coti-grid">
          {criptos.data.map((c: CriptoDTO) => {
            const cambio = aNumero(c.cambio24h);
            const sube = cambio >= 0;
            return (
              <div key={c.id} className="coti-card">
                <div className="coti-nombre" title={c.name}>
                  {c.name}{" "}
                  <span style={{ color: "var(--tinta-60)", fontWeight: 400 }}>
                    ({c.symbol?.toUpperCase()})
                  </span>
                </div>
                <div className="cripto-precio">{formatearUsd(c.precioUsd)}</div>
                <div className={sube ? "cripto-cambio sube" : "cripto-cambio baja"}>
                  {sube ? "▲" : "▼"} {Math.abs(cambio).toFixed(2)}% (24h)
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

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
          <div className="coti-nombre" title={c.nombre || c.casa}>
            {c.nombre || c.casa}
          </div>
          <div className="coti-valores">
            <div className="coti-valor-col">
              <div className="coti-valor-label">Compra</div>
              <div className="coti-valor">{formatearPesos(c.compra)}</div>
            </div>
            <div className="coti-valor-col" style={{ textAlign: "right" }}>
              <div className="coti-valor-label">Venta</div>
              <div className="coti-valor">{formatearPesos(c.venta)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
