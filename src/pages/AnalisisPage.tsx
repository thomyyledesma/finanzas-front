import { useState } from "react";
import { externoApi } from "../api";
import { HttpError } from "../api/http";

// Cache a nivel de módulo: sobrevive a desmontar/montar la página, así el
// análisis NO se pierde al cambiar de pestaña y volver.
let analisisCache: string | null = null;

function hoyIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function AnalisisPage() {
  const [analisis, setAnalisis] = useState<string | null>(analisisCache);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtro de fechas opcional (vacío = analiza todo).
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  async function generar() {
    setError(null);

    // El análisis por período necesita AMBAS fechas. Si puso solo una, avisamos.
    if ((desde && !hasta) || (!desde && hasta)) {
      setError("Para analizar un período tenés que completar las dos fechas (o dejar ambas vacías para analizar todo).");
      return;
    }
    if (desde && hasta && desde > hasta) {
      setError("La fecha 'desde' no puede ser posterior a 'hasta'.");
      return;
    }

    setCargando(true);
    try {
      const res = await externoApi.analisis(desde || undefined, hasta || undefined);
      setAnalisis(res.analisis);
      analisisCache = res.analisis;
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo generar el análisis");
    } finally {
      setCargando(false);
    }
  }

  const yaHayAnalisis = analisis !== null;
  const hayRango = desde !== "" || hasta !== "";

  return (
    <>
      <header className="contenido-header">
        <h1>Análisis financiero</h1>
        <p>Un asesor con IA analiza tus finanzas y te da recomendaciones.</p>
      </header>

      <div className="analisis-intro">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
          ¿Qué hago con mi plata?
        </div>
        <p>
          Generamos un resumen de tu situación, tus hábitos de gasto y tres
          recomendaciones concretas. Si querés acotar el análisis a un período,
          completá las dos fechas; si las dejás vacías, analiza todo tu historial.
        </p>

        {/* Filtro de fechas opcional */}
        <div className="analisis-fechas">
          <div className="analisis-fecha-campo">
            <label htmlFor="desde">Desde</label>
            <input
              id="desde"
              type="date"
              value={desde}
              max={hoyIso()}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="analisis-fecha-campo">
            <label htmlFor="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              value={hasta}
              max={hoyIso()}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          {hayRango && (
            <button
              className="btn btn-secundario btn-chico"
              onClick={() => {
                setDesde("");
                setHasta("");
              }}
              disabled={cargando}
            >
              Limpiar
            </button>
          )}
        </div>

        <button
          className="btn btn-primario btn-auto"
          onClick={generar}
          disabled={cargando}
          style={{ marginTop: 16 }}
        >
          {cargando
            ? "Analizando tus finanzas…"
            : yaHayAnalisis
            ? "Actualizar análisis"
            : "Generar análisis"}
        </button>

        {yaHayAnalisis && !cargando && (
          <p style={{ marginTop: 10, fontSize: 13 }}>
            Ya tenés un análisis generado abajo. Cambiá el rango de fechas o tocá
            "Actualizar análisis" para generar uno nuevo.
          </p>
        )}
      </div>

      {error && <div className="estado estado-error">{error}</div>}

      {cargando && (
        <div className="estado">
          La IA está revisando tus números. Esto puede tardar unos segundos…
        </div>
      )}

      {analisis && !cargando && <div className="analisis-panel">{analisis}</div>}

      {!analisis && !cargando && !error && (
        <div className="estado">
          Tocá "Generar análisis" para recibir tu informe personalizado.
        </div>
      )}
    </>
  );
}
