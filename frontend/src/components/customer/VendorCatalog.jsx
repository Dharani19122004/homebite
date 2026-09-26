import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Inbox } from "lucide-react";
import { getVendorsByType, getVendorById } from "../../services/vendorService";
import { getProductsByVendor } from "../../services/productService";
import { addToCart, clearCart } from "../../utils/cart";
import { getErrorMessage } from "../../utils/apiError";
import VendorCard from "./VendorCard";
import ProductCard from "./ProductCard";
import "./VendorCatalog.css";
import { useConfirm } from "../../hooks/useConfirm";

function VendorCatalog({ vendorType, title, description, basePath }) {
  const confirm = useConfirm();
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (vendorId) {
      return;
    }

    setListLoading(true);
    setListError("");

    getVendorsByType(vendorType)
      .then((res) => setVendors(res.data.vendors || []))
      .catch((err) => setListError(getErrorMessage(err, "Unable to load vendors.")))
      .finally(() => setListLoading(false));
  }, [vendorType, vendorId]);

  useEffect(() => {
    if (!vendorId) {
      return;
    }

    setDetailLoading(true);
    setDetailError("");
    setNotice("");

    Promise.all([getVendorById(vendorId), getProductsByVendor(vendorId)])
      .then(([vendorRes, productsRes]) => {
        setVendor(vendorRes.data.vendor);
        setProducts(productsRes.data.products || []);
      })
      .catch((err) =>
        setDetailError(getErrorMessage(err, "Unable to load this vendor.")),
      )
      .finally(() => setDetailLoading(false));
  }, [vendorId]);

  const handleAddToCart = async (product) => {
    const result = addToCart({
      vendorId: vendor._id,
      vendorName: vendor.businessName,
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
      addToCart({ vendorId: vendor._id, vendorName: vendor.businessName, product });
      setNotice(`${product.name} added to cart.`);
      return;
    }

    if (result.limitReached) {
      setNotice(
        product.quantity > 0
          ? `Only ${product.quantity} ${product.unit || "item(s)"} of ${product.name} available.`
          : `${product.name} is currently out of stock.`,
      );
      return;
    }

    setNotice(`${product.name} added to cart.`);
  };

  // ===================== DETAIL VIEW =====================
  if (vendorId) {
    return (
      <div className="vendor-catalog">
        <button
          type="button"
          className="catalog-back-link"
          onClick={() => navigate(basePath)}
        >
          <ArrowLeft size={18} /> Back to {title}
        </button>

        {detailLoading && (
          <p className="catalog-status-text">
            <Loader2 size={18} className="spin" /> Loading vendor details...
          </p>
        )}

        {!detailLoading && detailError && (
          <p className="catalog-error">
            <AlertCircle size={16} /> {detailError}
          </p>
        )}

        {!detailLoading && !detailError && vendor && (
          <>
            <div className="vendor-detail-header card">
              {vendor.image && (
                <img
                  src={vendor.image}
                  alt={vendor.businessName}
                  className="vendor-detail-image"
                />
              )}
              <div>
                <h1>{vendor.businessName}</h1>
                <p className="vendor-detail-meta">
                  {vendor.ownerName} &bull; {vendor.city}
                </p>
                {vendor.description && (
                  <p className="vendor-detail-description">
                    {vendor.description}
                  </p>
                )}
              </div>
            </div>

            {notice && <p className="catalog-notice">{notice}</p>}

            <h2 className="catalog-section-title">Menu</h2>

            {products.length === 0 ? (
              <p className="catalog-empty">
                <Inbox size={18} /> This vendor has no products available
                right now.
              </p>
            ) : (
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
          </>
        )}
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="vendor-catalog">
      <div className="catalog-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {listLoading && (
        <p className="catalog-status-text">
          <Loader2 size={18} className="spin" /> Loading {title.toLowerCase()}
          ...
        </p>
      )}

      {!listLoading && listError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {listError}
        </p>
      )}

      {!listLoading && !listError && vendors.length === 0 && (
        <p className="catalog-empty">
          <Inbox size={18} /> No {title.toLowerCase()} are available right
          now.
        </p>
      )}

      {!listLoading && !listError && vendors.length > 0 && (
        <div className="vendor-grid">
          {vendors.map((v) => (
            <VendorCard
              key={v._id}
              vendor={v}
              onClick={() => navigate(`${basePath}/${v._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default VendorCatalog;
