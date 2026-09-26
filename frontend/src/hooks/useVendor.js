import { useOutletContext } from "react-router-dom";

// Vendor dashboard pages read the logged-in vendor's own store (loaded once
// by VendorLayout from GET /api/vendor/user/:userId) from the outlet context.
export function useVendor() {
  return useOutletContext();
}
