// Every API-backed page uses this so 401/403/404/500 and network failures
// all resolve to a friendly, backend-provided message instead of crashing
// the UI or leaking raw error objects.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    return "Network error. Please check your connection and try again.";
  }

  return error.response.data?.message || fallback;
}
