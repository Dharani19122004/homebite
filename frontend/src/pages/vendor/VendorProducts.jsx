import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  PlusCircle,
} from "lucide-react";
import { useVendor } from "../../hooks/useVendor";
import { useLoader } from "../../hooks/useLoader";
import {
  getProductsByVendor,
  activateProduct,
  deactivateProduct,
  deleteProduct,
} from "../../services/productService";
import { getErrorMessage } from "../../utils/apiError";
import { formatCurrency, matchesSearch } from "../../utils/adminFormat";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminDataState from "../../components/admin/AdminDataState";
import VendorStatusNotice from "../../components/vendor/VendorStatusNotice";
import EditProductModal from "../../components/vendor/EditProductModal";
import "./VendorProducts.css";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import SafeImage from "../../components/ui/SafeImage";

const ERROR_MESSAGE = "Unable to load your products.";

function VendorProducts() {
  const toast = useToast();
  const confirm = useConfirm();
  const { vendor, kind } = useVendor();
  const isReady = vendor.status === "approved" && vendor.isActive;

  const fetchProducts = useCallback(
    () => getProductsByVendor(vendor._id).then((res) => res.data.products),
    [vendor._id],
  );

  const { data: products, setData, loading, refreshing, error, reload } =
    useLoader(fetchProducts, ERROR_MESSAGE);

  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const [actingId, setActingId] = useState(null);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(
    () =>
      (products || []).filter(
        (p) =>
          (availability === "all" ||
            (availability === "available") === Boolean(p.available)) &&
          matchesSearch([p.name, p.category], search),
      ),
    [products, availability, search],
  );

  const handleToggle = async (product) => {
    setActingId(product._id);

    try {
      const res = product.available
        ? await deactivateProduct(product._id)
        : await activateProduct(product._id);

      setData((prev) =>
        prev.map((p) => (p._id === product._id ? res.data.product : p)),
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update this item."));
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = await confirm({
      title: "Delete this item?",
      message: `"${product.name}" will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }
    setActingId(product._id);

    try {
      await deleteProduct(product._id);
      setData((prev) => prev.filter((p) => p._id !== product._id));
      toast.success(`${product.name} deleted.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to delete this item."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="vendor-page">
      <AdminPageHeader
        title="My Products"
        subtitle={`Manage the ${kind.itemsLabel.toLowerCase()} you sell.`}
        onRefresh={reload}
        refreshing={refreshing}
      >
        {isReady && (
          <Link to="/vendor/products/add" className="btn btn-primary">
            <PlusCircle size={18} /> Add {kind.itemLabel}
          </Link>
        )}
      </AdminPageHeader>

      <VendorStatusNotice vendor={vendor} />

      <AdminDataState
        loading={loading}
        error={error}
        isEmpty={!products || products.length === 0}
        emptyMessage={`You haven't added any ${kind.itemsLabel.toLowerCase()} yet.`}
      >
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <span className="admin-result-count">
            {filtered.length} of {products?.length}
          </span>
        </div>

        <div className="vendor-product-grid">
          {filtered.map((product) => (
            <div key={product._id} className="vendor-product-card card">
              <div className="vendor-product-image">
                <SafeImage
                  src={product.image}
                  alt={product.name}
                  fallback={<Package size={28} />}
                />
              </div>

              <div className="vendor-product-body">
                <div className="vendor-product-title">
                  <h3>{product.name}</h3>
                  <span
                    className={
                      product.available
                        ? "status-badge status-success"
                        : "status-badge status-danger"
                    }
                  >
                    {product.available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <p className="vendor-product-meta">{product.category}</p>
                <p className="vendor-product-price">
                  {formatCurrency(product.price)} / {product.unit}
                </p>
                <p className="vendor-product-meta">
                  {product.quantity} in stock
                </p>

                <div className="vendor-product-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditing(product)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={actingId === product._id}
                    onClick={() => handleToggle(product)}
                  >
                    {product.available ? (
                      <>
                        <EyeOff size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Activate
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline vendor-product-delete"
                    disabled={actingId === product._id}
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="admin-hint">No items match the current filters.</p>
          )}
        </div>
      </AdminDataState>

      {editing && (
        <EditProductModal
          product={editing}
          categories={kind.categories}
          unitHint={kind.unitHint}
          itemLabel={kind.itemLabel}
          onClose={() => setEditing(null)}
          onUpdated={(updated, message) => {
            setData((prev) =>
              prev.map((p) => (p._id === updated._id ? updated : p)),
            );
            toast.success(message || "Updated successfully.");
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

export default VendorProducts;
