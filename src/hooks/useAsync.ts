import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../api/http";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// useAsync: para CARGAR datos al montar un componente (GET).
// Ej: const { data: cuentas, loading, error, reload } = useAsync(() => cuentaApi.listar());
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) =>
        setState({
          data: null,
          loading: false,
          error: e instanceof HttpError ? e.message : "Error inesperado",
        })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { ...state, reload: run };
}

// useAction: para ACCIONES disparadas por el usuario (POST/PUT/DELETE).
// Maneja loading/error y devuelve una función para ejecutar.
// Ej: const { run: crear, loading, error } = useAction(cuentaApi.crear);
//     await crear(nuevaCuenta);
export function useAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        const msg = e instanceof HttpError ? e.message : "Error inesperado";
        setError(msg);
        throw e; // re-lanzamos por si el componente quiere reaccionar
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { run, loading, error };
}
