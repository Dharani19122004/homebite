import { useState, useMemo } from "react";
import { ChefHat, UtensilsCrossed, CalendarCheck } from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchHomeChefOverview } from "../../services/adminService";
import {
  formatCurrency,
  formatDateTime,
  shortId,
  vendorStatusClass,
  matchesSearch,
} from "../../utils/adminFormat";
import {
  formatStatusLabel,
  getStatusBadgeClass,
  formatDate,
} from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import "./AdminHomeChefs.css";

const ERROR_MESSAGE = "Unable to load Home Chef data.";

// Home Chef food selling and booking services are independent activities,
// so they are shown as two separate sections per Home Chef. Both are derived
// from the existing vendor, product, order and booking lists.
function AdminHomeChefs() {
  const { data, loading, refreshing, error, reload } = useAdminData(
    fetchHomeChefOverview,
    ERROR_MESSAGE,
  );
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const chefs = useMemo(
    () =>
      (data?.vendors || [])
        .filter((v) => v.vendorType === "homechef")
        .map((chef) => ({
          ...chef,
          products: data.products.filter((p) => p.vendorId?._id === chef._id),
          orders: data.orders.filter((o) => o.vendorId?._id === chef._id),
          bookings: data.bookings.filter(
            (b) => b.homeChefId?._id === chef._id,
          ),
        })),
    [data],
  );

  const visible = chefs.filter((c) =>
    matchesSearch([c.businessName, c.ownerName, c.city], search),
  );
  const selected = chefs.find((c) => c._id === selectedId) || null;

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Home Chef Management"
        subtitle="Home Chefs sell homemade food and accept event bookings as two independent activities."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={chefs.length === 0}
        emptyMessage="No Home Chefs found."
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search Home Chef, owner or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="admin-result-count">
            {visible.length} of {chefs.length} Home Chefs
          </span>
        </div>

        <div className="admin-chef-grid">
          {visible.map((c) => (
            <button
              key={c._id}
              type="button"
              className={
                c._id === selectedId
                  ? "admin-chef-card card admin-chef-card-active"
                  : "admin-chef-card card"
              }
              onClick={() => setSelectedId(c._id === selectedId ? null : c._id)}
            >
              <span className="admin-chef-title">
                <ChefHat size={18} /> {c.businessName}
              </span>
              <span className="admin-cell-sub">
                {c.ownerName} &bull; {c.city || "—"}
              </span>
              <span className="admin-chef-badges">
                <span className={vendorStatusClass(c.status)}>
                  {formatStatusLabel(c.status)}
                </span>
                <span
                  className={
                    c.isActive
                      ? "status-badge status-success"
                      : "status-badge status-danger"
                  }
                >
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="admin-chef-counts">
                {c.products.length} food item(s) &bull; {c.orders.length} food
                order(s) &bull; {c.bookings.length} booking(s)
              </span>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="admin-hint">No Home Chefs match the search.</p>
          )}
        </div>

        {selected && (
          <div className="admin-chef-detail">
            <h2 className="catalog-section-title">{selected.businessName}</h2>

            <section className="card admin-chef-section">
              <h3>
                <UtensilsCrossed size={18} /> Food Selling
              </h3>

              <h4>Food products</h4>
              {selected.products.length === 0 ? (
                <p className="admin-hint">No food products added.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.products.map((p) => (
                        <tr key={p._id}>
                          <td className="admin-cell-main">{p.name}</td>
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
                    </tbody>
                  </table>
                </div>
              )}

              <h4>Food orders</h4>
              {selected.orders.length === 0 ? (
                <p className="admin-hint">No food orders yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.orders.map((o) => (
                        <tr key={o._id}>
                          <td className="admin-cell-main">{shortId(o._id)}</td>
                          <td>{o.customerId?.name || "—"}</td>
                          <td>
                            {o.items
                              .map((i) => `${i.name} × ${i.quantity}`)
                              .join(", ")}
                          </td>
                          <td>{formatCurrency(o.totalAmount)}</td>
                          <td>
                            <span className={getStatusBadgeClass(o.orderStatus)}>
                              {formatStatusLabel(o.orderStatus)}
                            </span>
                          </td>
                          <td>{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card admin-chef-section">
              <h3>
                <CalendarCheck size={18} /> Booking Services
              </h3>
              {selected.bookings.length === 0 ? (
                <p className="admin-hint">No bookings yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Event</th>
                        <th>Date &amp; Time</th>
                        <th>Guests</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.bookings.map((b) => (
                        <tr key={b._id}>
                          <td className="admin-cell-main">
                            {b.customerId?.name || "—"}
                          </td>
                          <td>{b.functionType}</td>
                          <td>
                            {formatDate(b.eventDate)}
                            <span className="admin-cell-sub">{b.eventTime}</span>
                          </td>
                          <td>{b.guestCount}</td>
                          <td>{b.location}</td>
                          <td>
                            <span className={getStatusBadgeClass(b.status)}>
                              {formatStatusLabel(b.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </AdminDataState>
    </div>
  );
}

export default AdminHomeChefs;
