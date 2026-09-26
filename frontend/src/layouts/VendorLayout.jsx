import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLoader } from "../hooks/useLoader";
import { getVendorByUserId } from "../services/vendorService";
import { kindOf } from "../utils/vendorKinds";
import { vendorStatusClass } from "../utils/adminFormat";
import { formatStatusLabel } from "../utils/status";
import VendorSidebar from "../components/vendor/VendorSidebar";
import "../components/admin/AdminCommon.css";
import "./CustomerLayout.css";
import "./VendorLayout.css";

const ERROR_MESSAGE = "Unable to load your store.";

function VendorLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const fetchStore = useCallback(
    () => getVendorByUserId(user.id).then((res) => res.data.vendor),
    [user.id],
  );

  const { data: vendor, setData, loading, error, reload } = useLoader(
    fetchStore,
    ERROR_MESSAGE,
  );

  // The shared Profile page does not need the store record.
  const isProfilePage = location.pathname === "/vendor/profile";

  return (
    <div className="customer-layout">
      <VendorSidebar vendorType={vendor?.vendorType} />

      <div className="customer-content vendor-content">
        {vendor && (
          <header className="vendor-header card">
            <span className="vendor-header-image">
              {vendor.image ? (
                <img src={vendor.image} alt="" />
              ) : (
                <Store size={22} />
              )}
            </span>
            <div className="vendor-header-info">
              <strong>{vendor.businessName}</strong>
              <span>
                {kindOf(vendor).label}
                {vendor.city ? ` • ${vendor.city}` : ""}
              </span>
            </div>
            <div className="vendor-header-badges">
              <span className={vendorStatusClass(vendor.status)}>
                {formatStatusLabel(vendor.status)}
              </span>
              <span
                className={
                  vendor.isActive
                    ? "status-badge status-success"
                    : "status-badge status-danger"
                }
              >
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </header>
        )}

        {loading && !isProfilePage && (
          <p className="catalog-status-text">
            <Loader2 size={18} className="spin" /> Loading your store...
          </p>
        )}

        {!loading && error && !isProfilePage && (
          <p className="catalog-error">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {(isProfilePage || (!loading && !error && vendor)) && (
          <Outlet
            context={{
              vendor,
              kind: kindOf(vendor),
              reloadVendor: reload,
              setVendor: setData,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default VendorLayout;
