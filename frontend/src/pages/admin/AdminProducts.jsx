import { useState, useMemo } from "react";
import { Package } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchProducts } from "../../services/adminService";
import {
  VENDOR_TYPE_LABELS,
  formatCurrency,
  matchesSearch,
} from "../../utils/adminFormat";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import SafeImage from "../../components/ui/SafeImage";

const ERROR_MESSAGE = "Unable to load products.";
const TABS = [
  ["all", "All"],
  ["restaurant", "Restaurant Food"],
  ["grocery", "Grocery"],
  ["homechef", "Home Chef Food"],
];

// A product's source is the type of the vendor that owns it.
function AdminProducts() {
  const { data: products, loading, refreshing, error, reload } = useAdminData(
    fetchProducts,
    ERROR_MESSAGE,
  );
  const [source, setSource] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (products || []).filter(
        (p) =>
          (source === "all" || p.vendorId?.vendorType === source) &&
          (availability === "all" ||
            (availability === "available") === Boolean(p.available)) &&
          matchesSearch(
            [p.name, p.category, p.vendorId?.businessName],
            search,
          ),
      ),
    [products, source, availability, search],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Products"
        subtitle="Restaurant food, grocery products and Home Chef food. Read-only."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!products || products.length === 0}
        emptyMessage="No products found."
      >
        <div className="admin-tabs">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                source === value ? "admin-tab admin-tab-active" : "admin-tab"
              }
              onClick={() => setSource(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search product, category or vendor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <span className="admin-result-count">
            {filtered.length} of {products?.length} products
          </span>
        </div>

        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="admin-cell-actions">
                      <SafeImage
                        src={p.image}
                        className="admin-thumb"
                        fallback={
                          <span className="admin-thumb">
                            <Package size={18} />
                          </span>
                        }
                      />
                      <span className="admin-cell-main">{p.name}</span>
                    </div>
                  </td>
                  <td>
                    {p.vendorId ? (
                      <>
                        <span className="admin-cell-main">
                          {p.vendorId.businessName}
                        </span>
                        <span className="admin-cell-sub">
                          {VENDOR_TYPE_LABELS[p.vendorId.vendorType] ||
                            p.vendorId.vendorType}
                        </span>
                      </>
                    ) : (
                      <span className="admin-hint">Unknown vendor</span>
                    )}
                  </td>
                  <td>{p.productType === "food" ? "Food" : "Grocery"}</td>
                  <td>{p.category}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>
                    {p.quantity} {p.unit}
                  </td>
                  <td>
                    <span
                      className={
                        p.available
                          ? "status-badge status-success"
                          : "status-badge status-danger"
                      }
                    >
                      {p.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-hint">
                    No products match the current filters.
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

export default AdminProducts;
