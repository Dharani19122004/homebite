import { Routes, Route, Navigate } from "react-router-dom";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ResetPassword from "../pages/auth/ResetPassword";
import ProtectedRoute from "./ProtectedRoute";
import CustomerLayout from "../layouts/CustomerLayout";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import Restaurants from "../pages/customer/Restaurants";
import Groceries from "../pages/customer/Groceries";
import HomeChefs from "../pages/customer/HomeChefs";
import FoodRescue from "../pages/customer/FoodRescue";
import MyOrders from "../pages/customer/MyOrders";
import MyBookings from "../pages/customer/MyBookings";
import Cart from "../pages/customer/Cart";
import Profile from "../pages/customer/Profile";
import AIChat from "../pages/customer/AIChat";
import VendorLayout from "../layouts/VendorLayout";
import VendorDashboard from "../pages/vendor/VendorDashboard";
import VendorProducts from "../pages/vendor/VendorProducts";
import VendorAddProduct from "../pages/vendor/VendorAddProduct";
import VendorOrders from "../pages/vendor/VendorOrders";
import VendorSales from "../pages/vendor/VendorSales";
import VendorFeedback from "../pages/vendor/VendorFeedback";
import VendorStore from "../pages/vendor/VendorStore";
import VendorBookings from "../pages/vendor/VendorBookings";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryDashboard from "../pages/delivery/DeliveryDashboard";
import MyDeliveries from "../pages/delivery/MyDeliveries";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminVendors from "../pages/admin/AdminVendors";
import AdminHomeChefs from "../pages/admin/AdminHomeChefs";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminDeliveries from "../pages/admin/AdminDeliveries";
import AdminBookings from "../pages/admin/AdminBookings";
import AdminFeedback from "../pages/admin/AdminFeedback";
import AdminFoodRescue from "../pages/admin/AdminFoodRescue";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/customer/*"
        element={<ProtectedRoute allowedRoles={["customer"]} />}
      >
        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="restaurants/:vendorId" element={<Restaurants />} />
          <Route path="groceries" element={<Groceries />} />
          <Route path="groceries/:vendorId" element={<Groceries />} />
          <Route path="home-chefs" element={<HomeChefs />} />
          <Route path="home-chefs/:vendorId" element={<HomeChefs />} />
          <Route path="food-rescue" element={<FoodRescue />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="cart" element={<Cart />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ai-chat" element={<AIChat />} />
        </Route>
      </Route>

      <Route
        path="/vendor/*"
        element={<ProtectedRoute allowedRoles={["vendor", "homechef"]} />}
      >
        <Route element={<VendorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="products/add" element={<VendorAddProduct />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="sales" element={<VendorSales />} />
          <Route path="ratings" element={<VendorFeedback />} />
          <Route path="store" element={<VendorStore />} />
          <Route path="bookings" element={<VendorBookings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* The Home Chef dashboard is now part of the unified vendor dashboard. */}
      <Route
        path="/homechef/*"
        element={<Navigate to="/vendor/dashboard" replace />}
      />

      <Route
        path="/delivery/*"
        element={<ProtectedRoute allowedRoles={["delivery_partner"]} />}
      >
        <Route element={<DeliveryLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DeliveryDashboard />} />
          <Route path="deliveries" element={<MyDeliveries />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route
        path="/admin/*"
        element={<ProtectedRoute allowedRoles={["admin"]} />}
      >
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="home-chefs" element={<AdminHomeChefs />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="food-rescue" element={<AdminFoodRescue />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
