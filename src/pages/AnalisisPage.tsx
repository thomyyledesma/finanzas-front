import { useState } from "react";
import { externoApi } from "../api";
import { HttpError } from "../api/http";

// Cache a nivel de módulo: sobrevive a desmontar/montar la página, así el
// análisis NO se pierde al cambiar de pestaña y volver. Se borra al recargar
// la app o cerrar sesión (es solo para la sesión actual).
let analisisCache: string | null = null;

export function AnalisisPage() {
  const [analisis, setAnalisis] = useState<string | null>(analisisCache);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const res = await externoApi.analisis();
      setAnalisis(res.analisis);
      analisisCache = res.analisis; // guardamos para cuando se vuelva a la pestaña
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "No se pudo generar el análisis");
    } finally {
      setCargando(false);
    }
  }

  const yaHayAnalisis = analisis !== null;

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
          recomendaciones concretas a partir de tus cuentas, presupuestos y movimientos.
        </p>
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
            Ya tenés un análisis generado abajo. Si tu situación cambió (nuevos
            movimientos, cuentas o presupuestos), tocá "Actualizar análisis" para
            generar uno nuevo con los datos más recientes.
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
