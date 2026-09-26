import { useState } from "react";

// An <img> that quietly gives way to `fallback` (usually an icon) when the
// saved URL is empty, fails to load, or is only a tiny placeholder image.
const MIN_SIZE = 32;

function SafeImage({ src, alt = "", className, fallback = null }) {
  const [failedSrc, setFailedSrc] = useState("");

  if (!src || src === failedSrc) {
    return fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      onLoad={(e) => {
        const img = e.currentTarget;

        if (img.naturalWidth < MIN_SIZE || img.naturalHeight < MIN_SIZE) {
          setFailedSrc(src);
        }
      }}
    />
  );
}

export default SafeImage;
