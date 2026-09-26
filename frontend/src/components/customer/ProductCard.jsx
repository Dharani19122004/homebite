import { Package, Plus } from "lucide-react";
import "./ProductCard.css";
import SafeImage from "../ui/SafeImage";

function ProductCard({ product, onAddToCart }) {
  const outOfStock = !product.available || product.quantity <= 0;

  return (
    <div className="product-card card">
      <div className="product-card-image">
        <SafeImage
          src={product.image}
          alt={product.name}
          fallback={<Package size={28} />}
        />
      </div>

      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>

        {product.category && (
          <span className="product-card-category">{product.category}</span>
        )}

        {product.description && (
          <p className="product-card-description">{product.description}</p>
        )}

        <div className="product-card-footer">
          <span className="product-card-price">
            ₹{product.price}
            {product.unit ? ` / ${product.unit}` : ""}
          </span>

          {outOfStock ? (
            <span className="product-card-stock-out">Out of stock</span>
          ) : (
            <button
              type="button"
              className="btn btn-primary product-card-add"
              onClick={onAddToCart}
            >
              <Plus size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
