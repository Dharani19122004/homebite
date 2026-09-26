import { Outlet } from "react-router-dom";
import DeliverySidebar from "../components/delivery/DeliverySidebar";
import "../components/admin/AdminCommon.css";
import "./CustomerLayout.css";
import "./DeliveryLayout.css";

function DeliveryLayout() {
  return (
    <div className="customer-layout">
      <DeliverySidebar />

      <div className="customer-content delivery-content">
        <Outlet />
      </div>
    </div>
  );
}

export default DeliveryLayout;
