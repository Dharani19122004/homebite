import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "../utils/apiError";

// Loads data for a dashboard page. `fetcher` must be a stable (module-level)
// function that resolves to the data to display.
export function useLoader(fetcher, errorMessage) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    (isRefresh) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      fetcher()
        .then(setData)
        .catch((err) => setError(getErrorMessage(err, errorMessage)))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [fetcher, errorMessage],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  return { data, setData, loading, refreshing, error, reload };
}
