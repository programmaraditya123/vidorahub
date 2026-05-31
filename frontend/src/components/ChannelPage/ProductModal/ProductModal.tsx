"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ProductModal.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import Portal from "@/src/components/shared/AuthModal/Portal";
import { useScrollLock } from "@/src/hooks/ui/useScrollLock";
import {
  formatProductPrice,
  getProductImages,
  type ProductType,
} from "@/src/lib/store/store";

export type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: ProductType | null;
};

export default function ProductModal({
  isOpen,
  onClose,
  product,
}: ProductModalProps) {
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(
    () => (product ? getProductImages(product) : []),
    [product],
  );

  const displayPrice = product
    ? formatProductPrice(product.price, product.currency)
    : "";

  const hasRating =
    product?.rating != null &&
    (product.rating.count ?? 0) > 0 &&
    (product.rating.average ?? 0) > 0;

  const isActive = product?.status !== "inactive";
  const isVisible = isOpen && !!product;

  useScrollLock(isVisible);

  useEffect(() => {
    if (!isVisible) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isVisible, onClose]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  if (!isVisible || !product) return null;

  const activeSrc = images[activeImage];

  return (
    <Portal>
      <div
        id="product-modal-root"
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={onClose}
      >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} type="button">
          ✕
        </button>

        <div className={styles.container}>
          <div className={styles.gallerySection}>
            <div className={styles.galleryLayout}>
              {images.length > 1 && (
                <div className={styles.thumbnailList}>
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`${styles.thumb} ${
                        activeImage === index ? styles.activeThumb : ""
                      }`}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.mainImageWrapper}>
                {activeSrc ? (
                  <img
                    src={activeSrc}
                    alt={product.title}
                    className={styles.mainImage}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>No image</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.topMeta}>
              {product.category && (
                <span className={styles.category}>{product.category}</span>
              )}

              {product.updatedAt && (
                <span className={styles.updated}>
                  Updated {product.updatedAt}
                </span>
              )}
            </div>

            <h1 id="product-modal-title" className={styles.title}>
              {product.title}
            </h1>

            <div className={styles.priceRow}>
              <h2 className={styles.price}>{displayPrice}</h2>

              {product.oldPrice != null && product.oldPrice > 0 && (
                <span className={styles.oldPrice}>
                  {formatProductPrice(product.oldPrice, product.currency)}
                </span>
              )}
            </div>

            <div className={styles.badgeRow}>
              {product.stock && (
                <span
                  className={`${styles.stockBadge} ${
                    isActive ? "" : styles.stockBadgeInactive
                  }`}
                >
                  {product.stock}
                </span>
              )}

              {product.shippingRequired != null && (
                <span className={styles.metaChip}>
                  {product.shippingRequired
                    ? "Shipping required"
                    : "Digital delivery"}
                </span>
              )}

              {product.brand && (
                <span className={styles.metaChip}>{product.brand}</span>
              )}
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className={styles.tagsRow}>
                {product.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {hasRating && (
              <p className={styles.ratingLine}>
                ⭐ {product.rating!.average!.toFixed(1)} (
                {product.rating!.count} review
                {product.rating!.count === 1 ? "" : "s"})
              </p>
            )}

            <div className={styles.descriptionCard}>
              <h3>Description</h3>
              <p>
                {product.description.trim() ||
                  "No description provided for this product."}
              </p>
            </div>

            {(product.analytics?.views ?? 0) > 0 && (
              <p className={styles.analyticsLine}>
                {product.analytics!.views} view
                {product.analytics!.views === 1 ? "" : "s"}
              </p>
            )}

            <div className={styles.actionRow}>
              <button className={styles.primaryBtn} type="button">
                Buy Now
              </button>

              <button className={styles.secondaryBtn} type="button">
                <VidorahubIcon.ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  );
}
