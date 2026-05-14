"use client";

import { useEffect, useState } from "react";
import styles from "./ProductModal.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

export type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: {
    title: string;
    price: number;
    oldPrice?: number;
    description: string;
    updatedAt?: string;
    category?: string;
    stock?: string;
    images: string[];
    seller?: {
      name: string;
      username?: string;
      avatar?: string;
      rating?: number;
      location?: string;
    };
  };
};

export default function ProductModal({
  isOpen,
  onClose,
  product,
}: ProductModalProps) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    document.body.style.overflow = isOpen
      ? "hidden"
      : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveImage(0);
  }, [product]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeBtn}
          onClick={onClose}
        >
          ✕
        </button>

        <div className={styles.container}>
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrapper}>
              <img
                src={product.images[activeImage]}
                alt={product.title}
                className={styles.mainImage}
              />
            </div>

            {product.images.length > 1 && (
              <div className={styles.thumbnailRow}>
                {product.images.map(
                  (image, index) => (
                    <button
                      key={index}
                      className={`${styles.thumb} ${
                        activeImage === index
                          ? styles.activeThumb
                          : ""
                      }`}
                      onClick={() =>
                        setActiveImage(index)
                      }
                    >
                      <img
                        src={image}
                        alt={`thumbnail-${index}`}
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.topMeta}>
              {product.category && (
                <span className={styles.category}>
                  {product.category}
                </span>
              )}

              {product.updatedAt && (
                <span className={styles.updated}>
                  Updated {product.updatedAt}
                </span>
              )}
            </div>

            <h1 className={styles.title}>
              {product.title}
            </h1>

            <div className={styles.priceRow}>
              <h2 className={styles.price}>
                ₹{product.price}
              </h2>

              {product.oldPrice && (
                <span className={styles.oldPrice}>
                  ₹{product.oldPrice}
                </span>
              )}
            </div>

            {product.stock && (
              <div className={styles.stockBadge}>
                {product.stock}
              </div>
            )}

            <div className={styles.descriptionCard}>
              <h3>Description</h3>

              <p>{product.description}</p>
            </div>

            {product.seller && (
              <div className={styles.sellerCard}>
                <div className={styles.sellerHeader}>
                  <h3>Seller Information</h3>
                </div>

                <div className={styles.sellerInfo}>
                  <div className={styles.sellerLeft}>
                    <div className={styles.avatarWrapper}>
                      {product.seller.avatar ? (
                        <img
                          src={product.seller.avatar}
                          alt={product.seller.name}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {product.seller.name[0]}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4>
                        {product.seller.name}
                      </h4>

                      {product.seller.username && (
                        <span>
                          @{product.seller.username}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.sellerMeta}>
                    {product.seller.rating && (
                      <div className={styles.rating}>
                        ⭐ {product.seller.rating}
                      </div>
                    )}

                    {product.seller.location && (
                      <div className={styles.location}>
                        {product.seller.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.actionRow}>
              <button className={styles.primaryBtn}>
                Buy Now
              </button>

              <button className={styles.secondaryBtn}>
                <VidorahubIcon.ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







