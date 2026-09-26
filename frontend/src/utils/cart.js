const CART_KEY = "homebiteCart";

const EMPTY_CART = { vendorId: null, vendorName: "", items: [] };

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { ...EMPTY_CART };
  } catch {
    return { ...EMPTY_CART };
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("homebite-cart-updated"));
  return cart;
}

export function getCart() {
  return readCart();
}

// Returns { conflict: true, cart } if the cart already holds items from a
// different vendor (an order can only contain one vendor's products), so the
// caller can confirm clearing the cart before retrying.
//
// Returns { limitReached: true, cart } if the product's available stock
// (Product.quantity, the only stock field the backend actually has) is 0,
// or the cart already holds as many units as are in stock.
export function addToCart({ vendorId, vendorName, product }) {
  const cart = readCart();
  const stock =
    typeof product.quantity === "number" ? product.quantity : null;

  if (stock !== null && stock <= 0) {
    return { conflict: false, limitReached: true, cart };
  }

  if (cart.items.length > 0 && cart.vendorId !== vendorId) {
    return { conflict: true, cart };
  }

  const existing = cart.items.find((item) => item.productId === product._id);

  if (existing && stock !== null && existing.quantity >= stock) {
    return { conflict: false, limitReached: true, cart };
  }

  const items = existing
    ? cart.items.map((item) =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1, stock }
          : item,
      )
    : [
        ...cart.items,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image || "",
          unit: product.unit || "",
          quantity: 1,
          stock,
        },
      ];

  return { conflict: false, cart: writeCart({ vendorId, vendorName, items }) };
}

// Clamps to the item's stored stock cap (from Product.quantity at the time
// it was added) so no caller — including a stale UI state — can push the
// cart quantity above what is actually available.
export function setQuantity(productId, quantity) {
  const cart = readCart();
  const item = cart.items.find((i) => i.productId === productId);

  if (!item) {
    return cart;
  }

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const cappedQuantity =
    typeof item.stock === "number" ? Math.min(quantity, item.stock) : quantity;

  const items = cart.items.map((i) =>
    i.productId === productId ? { ...i, quantity: cappedQuantity } : i,
  );

  return writeCart({ ...cart, items });
}

export function removeFromCart(productId) {
  const cart = readCart();
  const items = cart.items.filter((item) => item.productId !== productId);

  return writeCart(items.length > 0 ? { ...cart, items } : { ...EMPTY_CART });
}

export function clearCart() {
  return writeCart({ ...EMPTY_CART });
}
