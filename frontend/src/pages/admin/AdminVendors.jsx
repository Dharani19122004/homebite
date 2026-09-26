import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import {
  fetchVendors,
  approveVendor,
  rejectVendor,
  activateVendor,
  deactivateVendor,
} from "../../services/adminService";
import { getErrorMessage } from "../../utils/apiError";
import {
  VENDOR_TYPE_LABELS,
  vendorStatusClass,
  matchesSearch,
} from "../../utils/adminFormat";
import { formatStatusLabel } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import { useConfirm } from "../../hooks/useConfirm";

const ERROR_MESSAGE = "Unable to load vendors.";
const TABS = [
  ["all", "All"],
  ["restaurant", "Restaurants"],
  ["grocery", "Groceries"],
  ["homechef", "Home Chefs"],
];

function AdminVendors() {
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const { data: vendors, setData, loading, refreshing, error, reload } =
    useAdminData(fetchVendors, ERROR_MESSAGE);

  const [type, setType] = useState("all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(
    () =>
      (vendors || []).filter(
        (v) =>
          (type === "all" || v.vendorType === type) &&
          (status === "all" || v.status === status) &&
          matchesSearch(
            [v.businessName, v.ownerName, v.city, v.userId?.email],
            search,
          ),
      ),
    [vendors, type, status, search],
  );

  const runAction = async (vendor, action, confirmText) => {
    if (
      confirmText &&
      !(await confirm({
        title: "Please confirm",
        message: confirmText,
        confirmLabel: "Yes, continue",
        tone: "danger",
      }))
    ) {
      return;
    }

    setActionError("");
    setNotice("");
    setActingId(vendor._id);

    try {
      const res = await action(vendor._id);
      const updated = res.data.vendor;

      setData((prev) =>
        prev.map((v) =>
          v._id === vendor._id
            ? { ...v, status: updated.status, isActive: updated.isActive }
            : v,
        ),
      );
      setNotice(`${vendor.businessName}: ${res.data.message}`);
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to update this vendor."));
    } finally {
      setActingId(null);
    }
  };

  const renderActions = (v) => {
    const busy = actingId === v._id;

    if (v.status === "pending") {
      return (
        <>
          <button
            type="button"
            className="btn btn-primary admin-action-btn"
            disabled={busy}
            onClick={() => runAction(v, approveVendor)}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn btn-outline admin-action-btn admin-action-danger"
            disabled={busy}
            onClick={() =>
              runAction(v, rejectVendor, `Reject ${v.businessName}?`)
            }
          >
            Reject
          </button>
        </>
      );
    }

    if (v.status === "rejected") {
      return (
        <button
          type="button"
          className="btn btn-outline admin-action-btn"
          disabled={busy}
          onClick={() => runAction(v, approveVendor)}
        >
          Approve
        </button>
      );
    }

    return v.isActive ? (
      <button
        type="button"
        className="btn btn-outline admin-action-btn admin-action-danger"
        disabled={busy}
        onClick={() =>
          runAction(
            v,
            deactivateVendor,
            `Deactivate ${v.businessName}? Customers will no longer be able to order from or book them.`,
          )
        }
      >
        Deactivate
      </button>
    ) : (
      <button
        type="button"
        className="btn btn-outline admin-action-btn"
        disabled={busy}
        onClick={() => runAction(v, activateVendor)}
      >
        Activate
      </button>
    );
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Vendors"
        subtitle="Restaurants, grocery stores and Home Chefs."
        onRefresh={reload}
        refreshing={refreshing}
      />

      {notice && <p className="catalog-notice">{notice}</p>}
      {actionError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {actionError}
        </p>
      )}

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!vendors || vendors.length === 0}
        emptyMessage="No vendors found."
      >
        <div className="admin-tabs">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                type === value ? "admin-tab admin-tab-active" : "admin-tab"
              }
              onClick={() => setType(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search business, owner, city or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="admin-result-count">
            {filtered.length} of {vendors?.length} vendors
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Type</th>
                <th>City</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id}>
                  <td>
                    <span className="admin-cell-main">{v.businessName}</span>
                    <span className="admin-cell-sub">{v.userId?.email}</span>
                  </td>
                  <td>{v.ownerName}</td>
                  <td>{VENDOR_TYPE_LABELS[v.vendorType] || v.vendorType}</td>
                  <td>{v.city || "—"}</td>
                  <td>
                    <span className={vendorStatusClass(v.status)}>
                      {formatStatusLabel(v.status)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        v.isActive
                          ? "status-badge status-success"
                          : "status-badge status-danger"
                      }
                    >
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-cell-actions">{renderActions(v)}</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-hint">
                    No vendors match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminDataState>
    </div>
  );
}

export default AdminVendors;
