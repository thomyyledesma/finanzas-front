// ============================================================
// Formateo de moneda y fechas para mostrar en la UI.
// Centralizado acá para que toda la app muestre los números igual.
// ============================================================

const formateadorPeso = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 50000 -> "$ 50.000,00"
export function formatearMoneda(monto: number): string {
  return formateadorPeso.format(monto);
}

// "2026-06-16" -> "16 jun 2026"
export function formatearFecha(fechaIso: string): string {
  // Parseamos como fecha local para evitar el corrimiento de zona horaria.
  const [anio, mes, dia] = fechaIso.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// "BILLETERA_VIRTUAL" -> "Billetera virtual"
export function formatearTipoCuenta(tipo: string): string {
  return tipo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
