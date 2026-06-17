import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { Image } from '@/components/native/Image';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '@/theme';

type ShareBladeProps = {
  isOpen: boolean;
  onClose: () => void;
  thumbnailUrl: string;
  link: string;
};

export function ShareBlade({ isOpen, onClose, thumbnailUrl, link }: ShareBladeProps) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      Clipboard.setString(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await Share.share({ message: link, url: link });
      } catch {
        // sharing unavailable
      }
    }
  };

  const encoded = encodeURIComponent(link);
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?url=${encoded}`,
  };

  const open = (url: string) => Linking.openURL(url).catch(() => undefined);
  const nativeShare = () => Share.share({ message: link, url: link }).catch(() => undefined);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]} onPress={() => {}}>
          <View style={styles.grabber} />
          <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.preview}>
            {thumbnailUrl ? (
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbFallback]} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(168,85,247,0.10)', 'rgba(124,58,237,0.28)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <Text style={styles.label}>DIRECT LINK</Text>
          <View style={styles.copyRow}>
            <TextInput value={link} editable={false} style={styles.input} numberOfLines={1} />
            <Pressable
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={copyLink}
            >
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </Pressable>
          </View>

          <View style={styles.socialGrid}>
            <SocialButton icon="logo-twitter" onPress={() => open(shareLinks.twitter)} />
            <SocialButton icon="paper-plane" onPress={() => open(shareLinks.telegram)} />
            <SocialButton icon="logo-whatsapp" onPress={() => open(shareLinks.whatsapp)} />
            <SocialButton icon="share-social" label="Share" onPress={nativeShare} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.social, pressed && styles.socialPressed]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      {label ? <Text style={styles.socialLabel}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(246, 244, 251, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  close: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  preview: {
    height: 170,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
    marginBottom: spacing.xl,
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: colors.bgMuted },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSubtle,
    padding: 5,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  copyBtnSuccess: {
    backgroundColor: colors.success,
  },
  copyBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  social: {
    flex: 1,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  socialPressed: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  socialLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
