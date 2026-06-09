import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '@/theme';
import { formatProductPrice, getProductImages } from '@/utils';
import type { Product } from '@/types';

type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onShare?: (product: Product) => void;
};

export function ProductModal({ isOpen, onClose, product, onShare }: ProductModalProps) {
  const insets = useSafeAreaInsets();
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(() => (product ? getProductImages(product) : []), [product]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const displayPrice = formatProductPrice(product.price, product.currency);
  const activeSrc = images[activeImage];
  const isActive = product.status !== 'inactive';
  const hasRating =
    product.rating != null &&
    (product.rating.count ?? 0) > 0 &&
    (product.rating.average ?? 0) > 0;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.grabber} />
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.textPrimary} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.mainImageWrapper}>
              {activeSrc ? (
                <Image source={{ uri: activeSrc }} style={styles.mainImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>No image</Text>
                </View>
              )}
            </View>

            {images.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {images.map((image, index) => (
                  <Pressable
                    key={`${image}-${index}`}
                    style={[styles.thumb, activeImage === index && styles.thumbActive]}
                    onPress={() => setActiveImage(index)}
                  >
                    <Image source={{ uri: image }} style={styles.thumbImg} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.details}>
              <View style={styles.topMeta}>
                {product.category ? <Text style={styles.category}>{product.category}</Text> : null}
                {product.updatedAt ? (
                  <Text style={styles.updated}>Updated {product.updatedAt}</Text>
                ) : null}
              </View>

              <Text style={styles.title}>{product.title}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{displayPrice}</Text>
                {product.oldPrice != null && product.oldPrice > 0 ? (
                  <Text style={styles.oldPrice}>
                    {formatProductPrice(product.oldPrice, product.currency)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.badgeRow}>
                {product.stock ? (
                  <Text style={[styles.stockBadge, !isActive && styles.stockBadgeInactive]}>
                    {product.stock}
                  </Text>
                ) : null}
                {product.shippingRequired != null ? (
                  <Text style={styles.metaChip}>
                    {product.shippingRequired ? 'Shipping required' : 'Digital delivery'}
                  </Text>
                ) : null}
                {product.brand ? <Text style={styles.metaChip}>{product.brand}</Text> : null}
              </View>

              {product.tags && product.tags.length > 0 ? (
                <View style={styles.tagsRow}>
                  {product.tags.map((tag) => (
                    <Text key={tag} style={styles.tag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              ) : null}

              {hasRating ? (
                <Text style={styles.ratingLine}>
                  ⭐ {product.rating!.average!.toFixed(1)} ({product.rating!.count} review
                  {product.rating!.count === 1 ? '' : 's'})
                </Text>
              ) : null}

              <View style={styles.descriptionCard}>
                <Text style={styles.descTitle}>Description</Text>
                <Text style={styles.descText}>
                  {product.description.trim() || 'No description provided for this product.'}
                </Text>
              </View>

              {(product.analytics?.views ?? 0) > 0 ? (
                <Text style={styles.analyticsLine}>
                  {product.analytics!.views} view{product.analytics!.views === 1 ? '' : 's'}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.actionRow, { paddingBottom: insets.bottom + spacing.sm }]}>
            <Pressable style={styles.primaryBtn}>
              <LinearGradient
                colors={[colors.primary, colors.primaryEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryText}>Buy Now</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => onShare?.(product)}>
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 5,
  },
  scroll: { paddingBottom: spacing.lg },
  mainImageWrapper: {
    width: '100%',
    aspectRatio: 1 / 0.9,
    backgroundColor: colors.bgSubtle,
  },
  mainImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSubtle,
  },
  placeholderText: { color: colors.textFaint, fontWeight: '600' },
  thumbRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: colors.primary },
  thumbImg: { width: '100%', height: '100%' },
  details: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  category: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#f5f1ff',
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    overflow: 'hidden',
  },
  updated: { color: colors.textFaint, fontSize: typography.sizes.xs, fontWeight: '500' },
  title: {
    marginTop: spacing.md,
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  price: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  oldPrice: {
    fontSize: typography.sizes.md,
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stockBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.12)',
    color: '#16a34a',
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stockBadgeInactive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    color: '#dc2626',
  },
  metaChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#f3f4f6',
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    overflow: 'hidden',
  },
  ratingLine: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  descriptionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fcfbff',
  },
  descTitle: {
    marginBottom: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  descText: {
    fontSize: typography.sizes.sm,
    lineHeight: 22,
    color: colors.textMuted,
  },
  analyticsLine: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  primaryBtn: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  primaryGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.md },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
