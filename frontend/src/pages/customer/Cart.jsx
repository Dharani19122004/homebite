import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Package,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getCart,
  setQuantity,
  removeFromCart,
  clearCart,
} from "../../utils/cart";
import { createOrder, createRazorpayOrder } from "../../services/orderService";
import {
  createRazorpayOrder as createRazorpayPaymentOrder,
  verifyRazorpayPayment,
} from "../../services/paymentService";
import { getErrorMessage } from "../../utils/apiError";
import "./Cart.css";
import { useConfirm } from "../../hooks/useConfirm";

const DELIVERY_FEE = 40;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Cart() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(getCart());
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const grandTotal = cart.items.length > 0 ? subtotal + DELIVERY_FEE : 0;

  const handleQuantityChange = (productId, delta) => {
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) return;

    const atMax = typeof item.stock === "number" && item.quantity >= item.stock;
    if (delta > 0 && atMax) return;
    if (delta < 0 && item.quantity <= 1) return;

    setCart(setQuantity(productId, item.quantity + delta));
  };

  const handleRemove = (productId) => {
    setCart(removeFromCart(productId));
  };

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: "Clear your cart?",
      message: "This removes every item from your cart.",
      confirmLabel: "Clear cart",
      tone: "danger",
    });

    if (confirmed) {
      setCart(clearCart());
    }
  };

  const buildOrderItems = () =>
    cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

  const handlePlaceOrder = async () => {
    setError("");

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    setPlacing(true);

    if (paymentMethod === "COD") {
      try {
        await createOrder({
          customerId: user.id,
          vendorId: cart.vendorId,
          items: buildOrderItems(),
          deliveryAddress: deliveryAddress.trim(),
          paymentMethod: "COD",
        });

        clearCart();
        setSuccess("Order placed successfully! Redirecting to My Orders...");
        setTimeout(() => navigate("/customer/orders"), 1200);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to place order."));
        setPlacing(false);
      }

      return;
    }

    // Razorpay flow
    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError("Unable to load payment gateway. Please try again.");
        setPlacing(false);
        return;
      }

      const orderRes = await createRazorpayPaymentOrder(grandTotal);
      const razorpayOrder = orderRes.data.razorpayOrder;

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "HomeBite",
        description: cart.vendorName,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyRes.data.verified) {
              setError("Payment verification failed. Please try again.");
              setPlacing(false);
              return;
            }

            await createRazorpayOrder({
              customerId: user.id,
              vendorId: cart.vendorId,
              items: buildOrderItems(),
              deliveryAddress: deliveryAddress.trim(),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            clearCart();
            setSuccess(
              "Payment successful! Order placed. Redirecting to My Orders...",
            );
            setTimeout(() => navigate("/customer/orders"), 1200);
          } catch (err) {
            setError(getErrorMessage(err, "Unable to create order after payment."));
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPlacing(false);
      });

      razorpay.open();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to start payment."));
      setPlacing(false);
    }
  };

  if (cart.items.length === 0 && !success) {
    return (
      <div className="cart-page">
        <div className="catalog-header">
          <h1>Cart</h1>
        </div>
        <p className="catalog-empty">
          <ShoppingCart size={18} /> Your cart is empty. Browse{" "}
          <Link to="/customer/restaurants">Restaurants</Link>,{" "}
          <Link to="/customer/groceries">Groceries</Link> to add items.
        </p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="catalog-header">
        <h1>Cart</h1>
        {cart.vendorName && <p>Ordering from {cart.vendorName}</p>}
      </div>

      {success && <p className="catalog-notice">{success}</p>}

      {error && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {!success && (
        <div className="cart-layout">
          <div className="cart-items card">
            {cart.items.map((item) => {
              const hasStock = typeof item.stock === "number";
              const atMin = item.quantity <= 1;
              const atMax = hasStock && item.quantity >= item.stock;

              return (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <Package size={22} />
                    )}
                  </div>

                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <span>
                      ₹{item.price}
                      {item.unit ? ` / ${item.unit}` : ""}
                    </span>
                  </div>

                  <div className="cart-item-quantity-wrap">
                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        title="Decrease quantity"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={atMin}
                        onClick={() => handleQuantityChange(item.productId, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        title="Increase quantity"
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={atMax}
                        onClick={() => handleQuantityChange(item.productId, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {hasStock && (
                      <span
                        className={
                          atMax
                            ? "cart-item-stock-hint cart-item-stock-max"
                            : "cart-item-stock-hint"
                        }
                      >
                        {atMax
                          ? "Maximum available quantity reached"
                          : `${item.stock} available`}
                      </span>
                    )}
                  </div>

                  <span className="cart-item-subtotal">
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    type="button"
                    className="cart-item-remove"
                    title="Remove item"
                    aria-label={`Remove ${item.name} from cart`}
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn-outline cart-clear-btn"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          </div>

          <div className="cart-summary card">
            <h2 className="catalog-section-title">Checkout</h2>

            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery Address</label>
              <textarea
                id="deliveryAddress"
                rows={3}
                placeholder="Enter your full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <span className="payment-method-title">Payment Method</span>
              <div className="payment-method-options">
                <label
                  className={
                    paymentMethod === "COD"
                      ? "payment-method-option payment-method-option-active"
                      : "payment-method-option"
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <span>Cash on Delivery</span>
                </label>
                <label
                  className={
                    paymentMethod === "Razorpay"
                      ? "payment-method-option payment-method-option-active"
                      : "payment-method-option"
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "Razorpay"}
                    onChange={() => setPaymentMethod("Razorpay")}
                  />
                  <span>Razorpay</span>
                </label>
              </div>
            </div>

            <div className="cart-totals">
              <div>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div>
                <span>Delivery Fee</span>
                <span>₹{DELIVERY_FEE}</span>
              </div>
              <div className="cart-grand-total">
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary auth-submit"
              disabled={placing}
              onClick={handlePlaceOrder}
            >
              {placing ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
