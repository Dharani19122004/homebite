import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Inbox,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  X,
} from "lucide-react";
import { getVendorsByType, getVendorById } from "../../services/vendorService";
import { getProductsByVendor } from "../../services/productService";
import {
  checkAvailability,
  createBooking,
} from "../../services/bookingService";
import { useAuth } from "../../context/AuthContext";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { getErrorMessage } from "../../utils/apiError";
import { addToCart, clearCart } from "../../utils/cart";
import VendorCard from "../../components/customer/VendorCard";
import ProductCard from "../../components/customer/ProductCard";
import "./HomeChefs.css";
import { useConfirm } from "../../hooks/useConfirm";

// Broken or tiny (under 32px) placeholder uploads are treated as "no image".
const MIN_IMAGE_SIZE = 32;
const isUsableImage = (img) =>
  img.naturalWidth >= MIN_IMAGE_SIZE && img.naturalHeight >= MIN_IMAGE_SIZE;

const initialForm = {
  functionType: "",
  eventDate: "",
  eventTime: "",
  guestCount: "",
  location: "",
  description: "",
};

function HomeChefs() {
  const confirm = useConfirm();
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chefs, setChefs] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [chef, setChef] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [cartNotice, setCartNotice] = useState("");

  const [formData, setFormData] = useState(initialForm);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [brokenImage, setBrokenImage] = useState("");

  // The booking form only opens when the customer clicks "Book This Chef".
  const closeBooking = () => {
    if (submitting) {
      return;
    }

    setShowBooking(false);
    setBookingResult(null);
    setFormError("");
  };

  useEscapeKey(() => {
    if (showBooking) {
      closeBooking();
    }
  });

  useEffect(() => {
    if (vendorId) {
      return;
    }

    setListLoading(true);
    setListError("");

    getVendorsByType("homechef")
      .then((res) => setChefs(res.data.vendors || []))
      .catch((err) =>
        setListError(getErrorMessage(err, "Unable to load Home Chefs.")),
      )
      .finally(() => setListLoading(false));
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) {
      return;
    }

    setDetailLoading(true);
    setDetailError("");
    setFormData(initialForm);
    setAvailability(null);
    setBookingResult(null);
    setShowBooking(false);
    setFormError("");
    setCartNotice("");

    getVendorById(vendorId)
      .then((res) => setChef(res.data.vendor))
      .catch((err) =>
        setDetailError(getErrorMessage(err, "Unable to load this Home Chef.")),
      )
      .finally(() => setDetailLoading(false));
  }, [vendorId]);

  // Fetched independently from the vendor profile/booking form so that a
  // failure loading the food menu never breaks the booking workflow.
  useEffect(() => {
    if (!vendorId) {
      return;
    }

    setProductsLoading(true);
    setProductsError("");

    getProductsByVendor(vendorId)
      .then((res) => {
        setProducts((res.data.products || []).filter((p) => p.available));
      })
      .catch((err) =>
        setProductsError(
          getErrorMessage(err, "Unable to load food menu. Please try again."),
        ),
      )
      .finally(() => setProductsLoading(false));
  }, [vendorId]);

  const handleAddToCart = async (product) => {
    const result = addToCart({
      vendorId: chef._id,
      vendorName: chef.businessName,
      product,
    });

    if (result.conflict) {
      const confirmed = await confirm({
        title: "Start a new cart?",
        message: `Your cart has items from ${result.cart.vendorName}. Adding this item will clear your current cart.`,
        confirmLabel: "Clear cart & add",
        tone: "danger",
      });

      if (!confirmed) {
        return;
      }

      clearCart();
      addToCart({ vendorId: chef._id, vendorName: chef.businessName, product });
      setCartNotice(`${product.name} added to cart.`);
      return;
    }

    if (result.limitReached) {
      setCartNotice(
        product.quantity > 0
          ? `Only ${product.quantity} ${product.unit || "item(s)"} of ${product.name} available.`
          : `${product.name} is currently out of stock.`,
      );
      return;
    }

    setCartNotice(`${product.name} added to cart.`);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setAvailability(null);
  };

  const handleCheckAvailability = async () => {
    setFormError("");

    if (!formData.eventDate || !formData.eventTime) {
      setFormError("Select an event date and time first.");
      return;
    }

    setCheckingAvailability(true);

    try {
      const res = await checkAvailability(
        vendorId,
        formData.eventDate,
        formData.eventTime,
      );
      setAvailability(res.data);
    } catch (err) {
      setFormError(getErrorMessage(err, "Unable to check availability."));
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const { functionType, eventDate, eventTime, guestCount, location } =
      formData;

    if (!functionType || !eventDate || !eventTime || !guestCount || !location) {
      setFormError("Please fill in all required booking details.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createBooking({
        customerId: user.id,
        homeChefId: vendorId,
        functionType,
        eventDate,
        eventTime,
        guestCount: Number(guestCount),
        location,
        description: formData.description,
      });

      setBookingResult(res.data);
      setFormData(initialForm);
      setAvailability(null);
    } catch (err) {
      setFormError(getErrorMessage(err, "Unable to submit booking request."));
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== DETAIL VIEW =====================
  if (vendorId) {
    return (
      <div className="homechefs-page">
        <button
          type="button"
          className="catalog-back-link"
          onClick={() => navigate("/customer/home-chefs")}
        >
          <ArrowLeft size={18} /> Back to Home Chefs
        </button>

        {detailLoading && (
          <p className="catalog-status-text">
            <Loader2 size={18} className="spin" /> Loading Home Chef
            details...
          </p>
        )}

        {!detailLoading && detailError && (
          <p className="catalog-error">
            <AlertCircle size={16} /> {detailError}
          </p>
        )}

        {!detailLoading && !detailError && chef && (
          <>
            <div className="vendor-detail-header card chef-header">
              {chef.image && chef.image !== brokenImage && (
                <img
                  src={chef.image}
                  alt={chef.businessName}
                  className="vendor-detail-image"
                  onError={() => setBrokenImage(chef.image)}
                  onLoad={(e) => {
                    if (!isUsableImage(e.currentTarget)) {
                      setBrokenImage(chef.image);
                    }
                  }}
                />
              )}
              <div className="chef-header-info">
                <h1>{chef.businessName}</h1>
                <p className="vendor-detail-meta">
                  {chef.ownerName} &bull; {chef.city}
                </p>
                {chef.description && (
                  <p className="vendor-detail-description">
                    {chef.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary chef-book-btn"
                onClick={() => setShowBooking(true)}
              >
                <CalendarPlus size={18} /> Book This Chef
              </button>
            </div>

            <h2 className="catalog-section-title">Order Food</h2>

            {cartNotice && <p className="catalog-notice">{cartNotice}</p>}

            {productsLoading && (
              <p className="catalog-status-text">
                <Loader2 size={18} className="spin" /> Loading food menu...
              </p>
            )}

            {!productsLoading && productsError && (
              <p className="catalog-error">
                <AlertCircle size={16} /> {productsError}
              </p>
            )}

            {!productsLoading && !productsError && products.length === 0 && (
              <p className="catalog-empty">
                <Inbox size={18} /> This Home Chef has not added any food
                items yet.
              </p>
            )}

            {!productsLoading && !productsError && products.length > 0 && (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}

            {showBooking && (
              <div className="booking-modal-overlay" onClick={closeBooking}>
                <div
                  className="booking-modal card"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="booking-modal-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="booking-modal-header">
                    <div>
                      <h2 id="booking-modal-title">Book This Home Chef</h2>
                      <p>{chef.businessName}</p>
                    </div>
                    <button
                      type="button"
                      className="booking-modal-close"
                      onClick={closeBooking}
                      aria-label="Close booking form"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {bookingResult ? (
                    <div className="booking-success">
                      <CheckCircle2 size={28} />
                      <div>
                        <h3>{bookingResult.message}</h3>
                        <p>
                          Request type:{" "}
                          <strong>{bookingResult.bookingType}</strong>
                        </p>
                        <div className="booking-success-actions">
                          <Link
                            to="/customer/bookings"
                            className="btn btn-primary"
                          >
                            View My Bookings
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={closeBooking}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form className="booking-form" onSubmit={handleSubmit}>
                      {formError && (
                        <div className="auth-error">{formError}</div>
                      )}

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="functionType">Function Type</label>
                          <input
                            id="functionType"
                            name="functionType"
                            type="text"
                            placeholder="e.g. Birthday party"
                            value={formData.functionType}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="guestCount">Guest Count</label>
                          <input
                            id="guestCount"
                            name="guestCount"
                            type="number"
                            min="1"
                            value={formData.guestCount}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="eventDate">Event Date</label>
                          <input
                            id="eventDate"
                            name="eventDate"
                            type="date"
                            value={formData.eventDate}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="eventTime">Event Time</label>
                          <input
                            id="eventTime"
                            name="eventTime"
                            type="time"
                            value={formData.eventTime}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCheckAvailability}
                        disabled={checkingAvailability}
                      >
                        <CalendarCheck size={16} />
                        {checkingAvailability
                          ? "Checking..."
                          : "Check Availability"}
                      </button>

                      {availability && (
                        <p
                          className={
                            availability.available
                              ? "availability-note availability-ok"
                              : "availability-note availability-busy"
                          }
                        >
                          {availability.message}
                        </p>
                      )}

                      <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                          id="location"
                          name="location"
                          type="text"
                          placeholder="Event address"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="description">Additional Details</label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          placeholder="Optional notes for the Home Chef"
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Booking Request"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="homechefs-page">
      <div className="catalog-header">
        <h1>Home Chefs</h1>
        <p>Book trusted home chefs for your events and functions.</p>
      </div>

      {listLoading && (
        <p className="catalog-status-text">
          <Loader2 size={18} className="spin" /> Loading Home Chefs...
        </p>
      )}

      {!listLoading && listError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {listError}
        </p>
      )}

      {!listLoading && !listError && chefs.length === 0 && (
        <p className="catalog-empty">
          <Inbox size={18} /> No Home Chefs are available right now.
        </p>
      )}

      {!listLoading && !listError && chefs.length > 0 && (
        <div className="vendor-grid">
          {chefs.map((c) => (
            <VendorCard
              key={c._id}
              vendor={c}
              actionLabel="View & Book"
              onClick={() => navigate(`/customer/home-chefs/${c._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomeChefs;
