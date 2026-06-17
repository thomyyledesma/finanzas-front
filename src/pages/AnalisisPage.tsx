import { useState } from "react";
import { externoApi } from "../api";
import { HttpError } from "../api/http";

export function AnalisisPage() {
  const [analisis, setAnalisis] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const res = await externoApi.analisis();
      setAnalisis(res.analisis);
    } catch (e) {
      // Ej: "El servicio de análisis no está configurado (falta GEMINI_API_KEY)"
      setError(e instanceof HttpError ? e.message : "No se pudo generar el análisis");
    } finally {
      setCargando(false);
    }
  }

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
          {cargando ? "Analizando tus finanzas…" : analisis ? "Volver a analizar" : "Generar análisis"}
        </button>
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
