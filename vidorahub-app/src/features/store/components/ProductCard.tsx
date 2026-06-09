import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Product } from '@/types';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { formatProductPrice } from '@/utils';
import { ShareBlade } from '@/components/ui/ShareBlade';
import { ProductModal } from './ProductModal';

type ProductCardProps = {
  products: Product[];
  ownerId?: string;
};

export function ProductCard({ products, ownerId }: ProductCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareThumb, setShareThumb] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const shareLink = `https://www.vidorahub.com/channel/${ownerId ?? ''}?tab=store`;

  const openShare = (product: Product) => {
    setShareThumb(product.image || products[0]?.image || '');
    setShareOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      {products.map((product) => (
        <View style={styles.card} key={product.id}>
          <View style={styles.topGlow} pointerEvents="none" />

          <View style={styles.topSection}>
            <View style={styles.imageWrapper}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.imageFallback]} />
              )}
            </View>

            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={styles.category}>{product.category}</Text>

              <View style={styles.badges}>
                <Text style={styles.badge}>Size {product.size}</Text>
                <Text style={styles.badge}>{product.stock}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.updatedDot} />
                <Text style={styles.updatedText}>Updated {product.updatedAt}</Text>
              </View>

              <Text style={styles.desc} numberOfLines={2}>
                {product.description}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.priceSection}>
              <Text style={styles.label}>Starting From</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {formatProductPrice(product.price, product.currency)}
                </Text>
                {product.oldPrice != null && product.oldPrice > 0 ? (
                  <Text style={styles.oldPrice}>
                    {formatProductPrice(product.oldPrice, product.currency)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.detailsBtn} onPress={() => setSelectedProduct(product)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailsGradient}
                >
                  <Text style={styles.detailsText}>Details</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.iconBtn} onPress={() => openShare(product)}>
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <ShareBlade
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        thumbnailUrl={shareThumb || products[0]?.image || ''}
        link={shareLink}
      />

      <ProductModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onShare={(product) => {
          setSelectedProduct(null);
          openShare(product);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  topGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.10)',
  },
  topSection: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  imageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { backgroundColor: colors.bgMuted },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  category: {
    marginTop: 7,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primary,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  updatedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  updatedText: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    color: colors.textFaint,
  },
  desc: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: { flexDirection: 'column' },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textFaint,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  price: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: typography.sizes.sm,
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailsBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  detailsGradient: {
    height: 42,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
