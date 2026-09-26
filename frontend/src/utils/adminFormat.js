export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function formatDateTime(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortId(id) {
  return `#HB${String(id).slice(-6).toUpperCase()}`;
}

export const VENDOR_TYPE_LABELS = {
  restaurant: "Restaurant",
  grocery: "Grocery",
  homechef: "Home Chef",
};

export function vendorStatusClass(status) {
  if (status === "approved") return "status-badge status-success";
  if (status === "rejected") return "status-badge status-danger";
  return "status-badge status-progress";
}

export function matchesSearch(values, term) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return values.some((v) => String(v ?? "").toLowerCase().includes(query));
}
