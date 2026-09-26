export const ROLE_LABELS = {
  customer: "Customer",
  vendor: "Vendor",
  homechef: "Home Chef",
  delivery_partner: "Delivery Partner",
  admin: "Admin",
};

// Where each role lands after login (and where its "Go to dashboard" link
// points). Keys are the exact role values stored by the backend.
export const ROLE_HOME = {
  customer: "/customer",
  vendor: "/vendor/dashboard",
  homechef: "/vendor/dashboard",
  delivery_partner: "/delivery/dashboard",
  admin: "/admin/dashboard",
};

// Roles the backend allows via /api/auth/register (admin registration is blocked)
export const REGISTER_ROLES = ["customer", "vendor", "homechef", "delivery_partner"];

// Roles the backend allows via /api/auth/login
export const LOGIN_ROLES = ["customer", "vendor", "homechef", "delivery_partner", "admin"];
