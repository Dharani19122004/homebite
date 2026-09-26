import { Clock, XCircle, PauseCircle } from "lucide-react";

function VendorStatusNotice({ vendor }) {
  if (vendor.status === "pending") {
    return (
      <p className="catalog-status-text">
        <Clock size={18} /> Your store is awaiting admin approval. You&apos;ll be able to add
        products and manage orders once it is approved.
      </p>
    );
  }

  if (vendor.status === "rejected") {
    return (
      <p className="catalog-error">
        <XCircle size={16} /> Your store was not approved.
        Contact HomeBite support for details.
      </p>
    );
  }

  if (!vendor.isActive) {
    return (
      <p className="catalog-error">
        <PauseCircle size={16} /> Your store is currently inactive.
      </p>
    );
  }

  return null;
}

export default VendorStatusNotice;
