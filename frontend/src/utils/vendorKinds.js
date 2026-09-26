// What each vendor type sells. The Product model's `productType` is
// "food" (restaurants and Home Chefs) or "grocery"; `category` is free text,
// so the category lists are suggestions only.
export const VENDOR_KINDS = {
  restaurant: {
    label: "Restaurant",
    productType: "food",
    itemLabel: "Menu Item",
    itemsLabel: "Menu Items",
    unitHint: "plate, box, piece...",
    categories: ["Starters", "Main Course", "Biryani", "Snacks", "Desserts", "Beverages"],
  },
  grocery: {
    label: "Grocery Store",
    productType: "grocery",
    itemLabel: "Product",
    itemsLabel: "Products",
    unitHint: "kg, litre, pack...",
    categories: ["Vegetables", "Fruits", "Dairy", "Staples", "Snacks", "Beverages"],
  },
  homechef: {
    label: "Home Chef",
    productType: "food",
    itemLabel: "Food Item",
    itemsLabel: "Food Items",
    unitHint: "plate, box, piece...",
    categories: ["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts", "Beverages"],
  },
};

export function kindOf(vendor) {
  return VENDOR_KINDS[vendor?.vendorType] || VENDOR_KINDS.restaurant;
}
