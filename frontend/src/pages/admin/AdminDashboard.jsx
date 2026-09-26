import { Link } from "react-router-dom";
import {
  IndianRupee,
  ClipboardList,
  Users,
  Store,
  Package,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { useAdminData } from "../../hooks/useAdminData";
import { fetchDashboardStats } from "../../services/adminService";
import { formatCurrency } from "../../utils/adminFormat";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import "./AdminDashboard.css";

const ERROR_MESSAGE = "Unable to load dashboard statistics.";

function StatCard({ Icon, label, value, note, to }) {
  const body = (
    <>
      <span className="admin-stat-icon">
        <Icon size={20} />
      </span>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
      {note && <span className="admin-stat-note">{note}</span>}
    </>
  );

  return to ? (
    <Link to={to} className="admin-stat-card card admin-stat-link">
      {body}
    </Link>
  ) : (
    <div className="admin-stat-card card">{body}</div>
  );
}

function BreakdownCard({ title, rows }) {
  return (
    <div className="admin-breakdown card">
      <h3>{title}</h3>
      <ul>
        {rows.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, loading, refreshing, error, reload } = useAdminData(
    fetchDashboardStats,
    ERROR_MESSAGE,
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Live overview of HomeBite activity."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <AdminDataState loading={loading} error={error}>
        {stats && (
          <>
            <div className="admin-stat-grid">
              <StatCard
                Icon={IndianRupee}
                label="Total Sales"
                value={formatCurrency(stats.sales.totalSales)}
                note="All orders except cancelled/rejected"
              />
              <StatCard
                Icon={TrendingUp}
                label="Today's Sales"
                value={formatCurrency(stats.today.todaySales)}
              />
              <StatCard
                Icon={ClipboardList}
                label="Total Orders"
                value={stats.orders.totalOrders}
                to="/admin/orders"
              />
              <StatCard
                Icon={CalendarDays}
                label="Today's Orders"
                value={stats.today.todayOrders}
              />
              <StatCard
                Icon={Clock}
                label="Pending Orders"
                value={stats.orders.pendingOrders}
                to="/admin/orders"
              />
              <StatCard
                Icon={CheckCircle2}
                label="Delivered Orders"
                value={stats.orders.deliveredOrders}
              />
              <StatCard
                Icon={Users}
                label="Customers"
                value={stats.users.totalCustomers}
                to="/admin/users"
              />
              <StatCard
                Icon={Store}
                label="Vendors"
                value={stats.vendors.totalVendors}
                note="Restaurants, groceries and Home Chefs"
                to="/admin/vendors"
              />
              <StatCard
                Icon={Package}
                label="Products"
                value={stats.products.totalProducts}
                to="/admin/products"
              />
              <StatCard
                Icon={UserCheck}
                label="Pending Vendor Approvals"
                value={stats.vendors.pendingVendors}
                to="/admin/vendors?status=pending"
              />
            </div>

            <div className="admin-breakdown-grid">
              <BreakdownCard
                title="Users by role"
                rows={[
                  ["Customers", stats.users.totalCustomers],
                  ["Vendors", stats.users.totalVendors],
                  ["Home Chefs", stats.users.totalHomeChefs],
                  ["Delivery Partners", stats.users.totalDeliveryPartners],
                  ["Admins", stats.users.totalAdmins],
                ]}
              />
              <BreakdownCard
                title="Vendor profiles"
                rows={[
                  ["Restaurants", stats.vendors.totalRestaurants],
                  ["Grocery stores", stats.vendors.totalGroceryStores],
                  ["Home Chefs", stats.vendors.totalHomeChefVendors],
                  ["Approved", stats.vendors.approvedVendors],
                  ["Pending", stats.vendors.pendingVendors],
                  ["Rejected", stats.vendors.rejectedVendors],
                  ["Active", stats.vendors.activeVendors],
                ]}
              />
              <BreakdownCard
                title="Orders by status"
                rows={[
                  ["Pending", stats.orders.pendingOrders],
                  ["Accepted", stats.orders.acceptedOrders],
                  ["Preparing", stats.orders.preparingOrders],
                  ["Ready", stats.orders.readyOrders],
                  ["Out for delivery", stats.orders.outForDeliveryOrders],
                  ["Delivered", stats.orders.deliveredOrders],
                  ["Cancelled", stats.orders.cancelledOrders],
                  ["Rejected", stats.orders.rejectedOrders],
                ]}
              />
              <BreakdownCard
                title="Products"
                rows={[
                  ["Food", stats.products.totalFoodProducts],
                  ["Grocery", stats.products.totalGroceryProducts],
                  ["Available", stats.products.availableProducts],
                  ["Unavailable", stats.products.unavailableProducts],
                ]}
              />
            </div>
          </>
        )}
      </AdminDataState>
    </div>
  );
}

export default AdminDashboard;
