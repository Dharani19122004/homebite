import { Outlet } from "react-router-dom";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import "./CustomerLayout.css";

function CustomerLayout() {
  return (
    <div className="customer-layout">
      <CustomerSidebar />
      <div className="customer-content">
        <Outlet />
      </div>
    </div>
  );
}

export default CustomerLayout;
