export function formatAvailableUntil(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getFoodRescueBadgeClass(status) {
  return status === "available"
    ? "status-badge status-success"
    : "status-badge status-danger";
}
