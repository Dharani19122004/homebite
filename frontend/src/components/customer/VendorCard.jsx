import { useState } from "react";
import { MapPin, Store, Star } from "lucide-react";
import "./VendorCard.css";

// A saved image that fails to load, or is tiny (under 32px - a blank test
// upload), is treated as "no image" so the card shows the icon.
const MIN_IMAGE_SIZE = 32;
const isUsableImage = (img) =>
  img.naturalWidth >= MIN_IMAGE_SIZE && img.naturalHeight >= MIN_IMAGE_SIZE;

function VendorCard({ vendor, onClick, actionLabel = "View Menu" }) {
  const [brokenImage, setBrokenImage] = useState("");
  const showImage = vendor.image && vendor.image !== brokenImage;

  const hasRating =
    typeof vendor.averageRating === "number" && vendor.ratingCount > 0;

  return (
    <button type="button" className="vendor-card card" onClick={onClick}>
      <div className="vendor-card-image">
        {showImage ? (
          <img
            src={vendor.image}
            alt={vendor.businessName}
            onError={() => setBrokenImage(vendor.image)}
            onLoad={(e) => {
              if (!isUsableImage(e.currentTarget)) setBrokenImage(vendor.image);
            }}
          />
        ) : (
          <Store size={32} />
        )}
      </div>

      <div className="vendor-card-body">
        <h3 className="vendor-card-name">{vendor.businessName}</h3>

        {vendor.city && (
          <p className="vendor-card-meta">
            <MapPin size={14} /> {vendor.city}
          </p>
        )}

        {vendor.description && (
          <p className="vendor-card-description">{vendor.description}</p>
        )}

        <p className="vendor-card-rating">
          {hasRating ? (
            <>
              <Star size={14} fill="#f97316" color="#f97316" />
              <span className="vendor-card-rating-value">
                {vendor.averageRating.toFixed(1)}
              </span>
              <span className="vendor-card-rating-count">
                ({vendor.ratingCount} rating{vendor.ratingCount === 1 ? "" : "s"})
              </span>
            </>
          ) : (
            <span className="vendor-card-rating-empty">No ratings yet</span>
          )}
        </p>

        <span className="vendor-card-action">{actionLabel}</span>
      </div>
    </button>
  );
}

export default VendorCard;
