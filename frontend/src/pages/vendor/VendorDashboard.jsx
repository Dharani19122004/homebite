import { useCallback } from "react";
import {
  Package,
  ClipboardList,
  Clock,
  CheckCircle2,
  IndianRupee,
  CalendarCheck,
} from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import { getProductsByVendor } from "../../services/productService";
import { getOrdersByVendor } from "../../services/orderService";
import { getHomeChefBookings } from "../../services/bookingService";
import { computeSales } from "../../utils/vendorSales";
import {
  formatCurrency,
  formatDateTime,
  shortId,
} from "../../utils/adminFormat";
import { formatStatusLabel, getStatusBadgeClass } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import VendorStatusNotice from "../../components/vendor/VendorStatusNotice";
import "./VendorDashboard.css";

const ERROR_MESSAGE = "Unable to load your dashboard.";

function StatCard({ Icon, label, value, note }) {
  return (
    <div className="vendor-stat-card card">
      <span className="vendor-stat-icon">
        <Icon size={20} />
      </span>
      <span className="vendor-stat-value">{value}</span>
      <span className="vendor-stat-label">{label}</span>
      {note && <span className="vendor-stat-note">{note}</span>}
    </div>
  );
}

function VendorDashboard() {
  const { vendor, kind } = useVendor();
  const isHomeChef = vendor.vendorType === "homechef";

  const fetchDashboard = useCallback(async () => {
    const [products, orders, bookings] = await Promise.all([
      getProductsByVendor(vendor._id).then((r) => r.data.products),
      getOrdersByVendor(vendor._id).then((r) => r.data.orders),
      isHomeChef
        ? getHomeChefBookings(vendor._id).then((r) => r.data.bookings)
        : Promise.resolve(null),
    ]);

    return { products, orders, bookings };
  }, [vendor._id, isHomeChef]);

  const { data, loading, refreshing, error, reload } = useLoader(
    fetchDashboard,
    ERROR_MESSAGE,
  );

  const stats = data && {
    totalProducts: data.products.length,
    available: data.products.filter((p) => p.available).length,
    unavailable: data.products.filter((p) => !p.available).length,
    outOfStock: data.products.filter((p) => p.quantity <= 0).length,
    totalOrders: data.orders.length,
    pending: data.orders.filter((o) => o.orderStatus === "pending").length,
    delivered: data.orders.filter((o) => o.orderStatus === "delivered").length,
    pendingBookings: data.bookings
      ? data.bookings.filter((b) => b.status === "pending").length
      : 0,
    sales: computeSales(data.orders),
  };

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="Dashboard"
        subtitle={`Overview of your ${kind.label.toLowerCase()}.`}
        onRefresh={reload}
        refreshing={refreshing}
      />

      <VendorStatusNotice vendor={vendor} />

      <AdminDataState loading={loading} error={error}>
        {stats && (
          <>
            <div className="vendor-stat-grid">
              <StatCard
                Icon={Package}
                label={`Total ${kind.itemsLabel}`}
                value={stats.totalProducts}
              />
              <StatCard
                Icon={ClipboardList}
                label="Total Orders"
                value={stats.totalOrders}
              />
              <StatCard
                Icon={Clock}
                label="Pending Orders"
                value={stats.pending}
              />
              <StatCard
                Icon={CheckCircle2}
                label="Delivered Orders"
                value={stats.delivered}
              />
              <StatCard
                Icon={IndianRupee}
                label="Total Sales"
                value={formatCurrency(stats.sales.totalSales)}
                note="Delivered orders, excluding delivery fee"
              />
              {isHomeChef && (
                <StatCard
                  Icon={CalendarCheck}
                  label="Pending Booking Requests"
                  value={stats.pendingBookings}
                />
              )}
            </div>

            <div className="vendor-dashboard-columns">
              <section className="card vendor-panel">
                <h3>Product availability</h3>
                <ul className="vendor-summary-list">
                  <li>
                    <span>Available</span>
                    <strong>{stats.available}</strong>
                  </li>
                  <li>
                    <span>Unavailable</span>
                    <strong>{stats.unavailable}</strong>
                  </li>
                  <li>
                    <span>Out of stock</span>
                    <strong>{stats.outOfStock}</strong>
                  </li>
                </ul>
              </section>

              <section className="card vendor-panel">
                <h3>Recent orders</h3>
                {data.orders.length === 0 ? (
                  <p className="admin-hint">No orders yet.</p>
                ) : (
                  <ul className="vendor-recent-orders">
                    {data.orders.slice(0, 5).map((o) => (
                      <li key={o._id}>
                        <div>
                          <strong>{shortId(o._id)}</strong>
                          <span className="admin-cell-sub">
                            {o.customerId?.name || "Customer"} &bull;{" "}
                            {formatDateTime(o.createdAt)}
                          </span>
                        </div>
                        <div className="vendor-recent-end">
                          <span>{formatCurrency(o.totalAmount)}</span>
                          <span className={getStatusBadgeClass(o.orderStatus)}>
                            {formatStatusLabel(o.orderStatus)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </AdminDataState>
    </div>
  );
}

export default VendorDashboard;
