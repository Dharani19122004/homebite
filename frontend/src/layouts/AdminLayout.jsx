import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import "../components/admin/AdminCommon.css";
import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
