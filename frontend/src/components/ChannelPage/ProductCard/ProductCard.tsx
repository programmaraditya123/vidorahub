"use client";

import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./ProductCard.module.scss";
import { useEffect, useState } from "react";
import ShareBlade from "../../ui/ShareBlade/ShareBlade";
import ProductModal from "../ProductModal/ProductModal";

export type ProductType = {
  id: string;
  title: string;
  category: string;
  size: string;
  stock: string;
  updatedAt: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
};

type ProductCardProps = {
  products: ProductType[];
};

export default function ProductCard({ products }: ProductCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );

  useEffect(() => {
    setFullUrl(window.location.href);
  }, []);
  return (
    <div className={styles.wrapper}>
      {products.map((product) => (
        <div className={styles.card} key={product.id}>
          <div className={styles.topGlow}></div>

          <div className={styles.topSection}>
            <div className={styles.imageWrapper}>
              <img src={product.image} alt={product.title} />
            </div>

            <div className={styles.content}>
              <div>
                <h3>{product.title}</h3>

                <p>{product.category}</p>

                <div className={styles.badges}>
                  <span className={styles.badge}>Size {product.size}</span>

                  <span className={styles.badge}>{product.stock}</span>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.updatedDot}></div>

                  <span className={styles.updatedText}>
                    Updated {product.updatedAt}
                  </span>
                </div>

                <div className={styles.desc}>{product.description}</div>
              </div>
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.footer}>
            <div className={styles.priceSection}>
              <span className={styles.label}>Starting From</span>

              <div className={styles.priceRow}>
                <h2 className={styles.price}>₹{product.price}</h2>

                {product.oldPrice && (
                  <span className={styles.oldPrice}>₹{product.oldPrice}</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.detailsBtn}
                onClick={() => setSelectedProduct(product)}
              >
                Details
              </button>

              <button
                className={styles.iconBtn}
                onClick={() => setShareOpen(true)}
              >
                <VidorahubIcon.ShareIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
      <ShareBlade
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        thumbnailUrl={products[0]?.image || ""}
        link={fullUrl}
      />

      <ProductModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={{
          title: selectedProduct?.title || "",
          category: selectedProduct?.category || "",
          updatedAt: selectedProduct?.updatedAt || "",
          price: selectedProduct?.price || 0,
          oldPrice: selectedProduct?.oldPrice,
          stock: selectedProduct?.stock || "",
          description: selectedProduct?.description || "",
          images: [selectedProduct?.image || ""],
        }}
      />
    </div>
  );
}
