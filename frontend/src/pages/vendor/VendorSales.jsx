import { useCallback, useMemo } from "react";
import { IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import { getOrdersByVendor } from "../../services/orderService";
import { computeSales } from "../../utils/vendorSales";
import { formatCurrency } from "../../utils/adminFormat";
import { formatDate } from "../../utils/status";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import "./VendorDashboard.css";

const ERROR_MESSAGE = "Unable to load your sales.";

function VendorSales() {
  const { vendor } = useVendor();

  const fetchOrders = useCallback(
    () => getOrdersByVendor(vendor._id).then((res) => res.data.orders),
    [vendor._id],
  );

  const { data: orders, loading, refreshing, error, reload } = useLoader(
    fetchOrders,
    ERROR_MESSAGE,
  );

  const sales = useMemo(() => (orders ? computeSales(orders) : null), [orders]);

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="Sales"
        subtitle="Calculated from your own orders only."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <p className="admin-hint">
        Sales count the product amounts of <strong>delivered</strong> orders.
        The flat delivery fee is not included, and cancelled or rejected orders
        are excluded. Orders still in progress are shown separately as pending
        value.
      </p>

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!orders || orders.length === 0}
        emptyMessage="No orders yet, so there are no sales to show."
      >
        {sales && (
          <>
            <div className="vendor-stat-grid">
              <div className="vendor-stat-card card">
                <span className="vendor-stat-icon">
                  <IndianRupee size={20} />
                </span>
                <span className="vendor-stat-value">
                  {formatCurrency(sales.totalSales)}
                </span>
                <span className="vendor-stat-label">Total Sales</span>
              </div>
              <div className="vendor-stat-card card">
                <span className="vendor-stat-icon">
                  <CheckCircle2 size={20} />
                </span>
                <span className="vendor-stat-value">{sales.deliveredCount}</span>
                <span className="vendor-stat-label">Delivered Orders</span>
              </div>
              <div className="vendor-stat-card card">
                <span className="vendor-stat-icon">
                  <Clock size={20} />
                </span>
                <span className="vendor-stat-value">
                  {formatCurrency(sales.pendingValue)}
                </span>
                <span className="vendor-stat-label">Pending Value</span>
                <span className="vendor-stat-note">
                  {sales.inProgressCount} order(s) in progress
                </span>
              </div>
            </div>

            {sales.deliveredCount === 0 ? (
              <p className="catalog-empty">
                No delivered orders yet. Sales appear once an order is delivered.
              </p>
            ) : (
              <div className="vendor-dashboard-columns">
                <section className="card vendor-panel">
                  <h3>Sales by order date</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Orders</th>
                          <th>Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.byDay.map((d) => (
                          <tr key={d.day}>
                            <td>{formatDate(d.day)}</td>
                            <td>{d.orders}</td>
                            <td>{formatCurrency(d.sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3>By payment method</h3>
                  <ul className="vendor-summary-list">
                    {sales.byPayment.map((p) => (
                      <li key={p.method}>
                        <span>
                          {p.method} ({p.orders} order{p.orders === 1 ? "" : "s"})
                        </span>
                        <strong>{formatCurrency(p.sales)}</strong>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="card vendor-panel">
                  <h3>Best sellers</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units</th>
                          <th>Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.byProduct.map((p) => (
                          <tr key={p.name}>
                            <td className="admin-cell-main">{p.name}</td>
                            <td>{p.units}</td>
                            <td>{formatCurrency(p.sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </AdminDataState>
    </div>
  );
}

export default VendorSales;
