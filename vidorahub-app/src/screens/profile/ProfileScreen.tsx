import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileQuery, useProductsQuery } from '@/queries';
import { ProductCard } from '@/features/store/components/ProductCard';
import { Loader } from '@/components/ui/Loader';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing, typography, radius, shadows } from '@/theme';
import { buildVideoSlug, formatDuration, formatViews } from '@/utils';
import type { VideoItem } from '@/types';
import type { MainStackParamList } from '@/navigation/types';
import { config } from '@/config';
import { deleteVideo } from '@/services/api/authApi';
import { QUERY_KEYS } from '@/constants';

type Tab = 'videos' | 'store';

type CreatorPlatform = {
  platform: string;
  url: string;
  audience: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEADER_HEIGHT = 60;
const VIDEO_GAP = spacing.md;
const VIDEO_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - VIDEO_GAP) / 2;
const FALLBACK_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDk4A2vp9K-OQ3Cv_NhDpq9r3E-ub-S3nBqylu_cCRNbPfjMonkPp-XlgKn_IXVHh9eWl-DS8MM4O2GuK7FgnW4OLNg0cBPLYzHDGOFOQsnLg7M5l5AC40w9ywI_oaaQzgT7NuToZpDo8xR0ZgYgeNEJ1594zx9Z1vYVI6KMLj5kWSphOJQfx9GK-nPWWNaMERreWYajFRaKUtUG5oILZKwMO2LRtun3R3Re_fBFjFrf3_rLei3ATVq3CBj1DSsNotoVtzG-e40xDNf';

export function ProfileScreen({ initialTab = 'videos' }: { initialTab?: Tab }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  const { data, isLoading } = useProfileQuery();
  const profile = data?.data;
  const creatorId = profile?._id ?? '';
  const { data: products = [] } = useProductsQuery(creatorId);

  const isNarrow = SCREEN_WIDTH < 768;

  const handleVideoPress = useCallback(
    (video: VideoItem) => {
      setMenuOpenFor(null);
      navigation.navigate('VideoPlayer', {
        slug: buildVideoSlug(video.videoUrl ?? '', video._id),
        videoId: video._id,
      });
    },
    [navigation],
  );

  const openStudio = useCallback(async () => {
    if (token) {
      await Linking.openURL(`${config.studioUrl}/login/${token}`);
    }
  }, [token]);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteVideoId) return;
    try {
      setDeleting(true);
      const res = await deleteVideo(confirmDeleteVideoId);
      if (res?.success) {
        success('Video deleted successfully');
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      } else {
        error(res?.message ?? 'Failed to delete video');
      }
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? 'Failed to delete video');
    } finally {
      setDeleting(false);
      setConfirmDeleteVideoId(null);
    }
  }, [confirmDeleteVideoId, error, queryClient, success]);

  const handleLogout = useCallback(async () => {
    await logout();
    success('Logged out');
  }, [logout, success]);

  const openRoute = useCallback(
    (route: 'UploadChooser' | 'Earn') => {
      setMobileMenuOpen(false);
      navigation.navigate(route);
    },
    [navigation],
  );

  const filteredUploads = profile?.uploads ?? [];

  const connectItems = useMemo(
    () => (profile?.platforms ?? []) as CreatorPlatform[],
    [profile?.platforms],
  );

  if (isLoading || !profile) {
    return <Loader />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + HEADER_HEIGHT + spacing.xl },
      ]}
    >
      <View style={styles.backdrop} pointerEvents="none">
        <View style={styles.backdropImage} />
        <View style={styles.backdropOverlay} />
      </View>

      <View style={[styles.headerShell, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.logoWrap} onPress={() => navigation.navigate('Tabs')}>
          <Ionicons name="play-circle" size={24} color={colors.primary} />
          <Text style={styles.logoText}>VidoraHub</Text>
        </Pressable>
        {!isNarrow ? (
          <View style={styles.desktopNav}>
            <Pressable onPress={openStudio} hitSlop={8}>
              <Text style={styles.navLink}>Dashboard</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Earn')} hitSlop={8}>
              <Text style={styles.navLink}>Earning</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('UploadChooser')} hitSlop={8}>
              <Text style={styles.navLink}>Upload</Text>
            </Pressable>
            <Pressable onPress={handleLogout} hitSlop={8} style={styles.logoutPill}>
              <Text style={styles.logoutPillText}>Logout</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.menuBtn, mobileMenuOpen && styles.menuBtnActive]}
            onPress={() => setMobileMenuOpen((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={mobileMenuOpen ? 'close' : 'menu'}
              size={22}
              color={mobileMenuOpen ? colors.white : colors.primary}
            />
          </Pressable>
        )}
      </View>

      {mobileMenuOpen && isNarrow ? (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMobileMenuOpen(false)}
          />
          <View style={[styles.mobileMenu, { top: insets.top + HEADER_HEIGHT + spacing.xs }]}>
            <Text style={styles.mobileMenuHeading}>MENU</Text>
            <MobileMenuItem icon="grid-outline" label="Dashboard" onPress={openStudio} />
            <MobileMenuItem icon="wallet-outline" label="Earning" onPress={() => openRoute('Earn')} />
            <MobileMenuItem icon="cloud-upload-outline" label="Upload" onPress={() => openRoute('UploadChooser')} />
            <View style={styles.menuDivider} />
            <MobileMenuItem
              icon="log-out-outline"
              label="Logout"
              danger
              onPress={async () => {
                setMobileMenuOpen(false);
                await handleLogout();
              }}
            />
          </View>
        </>
      ) : null}

      <View style={styles.main}>
        <View style={styles.contentCol}>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                <View style={styles.avatarPulse}>
                  <Image
                    source={{ uri: profile.profilePicUrl ?? FALLBACK_AVATAR }}
                    style={styles.avatarLarge}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.verified}>{profile.creator ? 'Verified Creator' : 'User'}</Text>
                  {profile.bio ? (
                    <Text style={styles.bio} numberOfLines={2}>
                      {profile.bio}
                    </Text>
                  ) : null}
                  <View style={styles.stats}>
                    <Stat label="SUBSCRIBERS" value={formatViews(profile.subscriber)} />
                    <Stat label="TOTAL VIEWS" value={formatViews(profile.totalviews)} />
                    <Stat label="VIDEOS" value={formatViews(profile.totalvideos)} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.tabs}>
            <TabButton label="VIDEOS" active={tab === 'videos'} onPress={() => setTab('videos')} />
            <TabButton label="My Store" active={tab === 'store'} onPress={() => setTab('store')} />
          </View>

          {tab === 'videos' ? (
            <View style={styles.masonry}>
              {filteredUploads.map((item) => (
                <Pressable key={item._id} style={styles.videoCard} onPress={() => handleVideoPress(item)}>
                  <View style={styles.videoThumbWrap}>
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
                    <View style={styles.thumbOverlay} />
                  </View>
                  <Pressable
                    style={styles.menuDots}
                    onPress={(e) => {
                      e.stopPropagation();
                      setMenuOpenFor((id) => (id === item._id ? null : item._id));
                    }}
                  >
                    <Text style={styles.menuDotsText}>⋮</Text>
                  </Pressable>
                  {menuOpenFor === item._id ? (
                    <Pressable
                      style={styles.deleteMenu}
                      onPress={(e) => {
                        e.stopPropagation();
                        setMenuOpenFor(null);
                        setConfirmDeleteVideoId(item._id);
                      }}
                    >
                      <Text style={styles.deleteMenuText}>Delete</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formatDuration(item.duration ?? 0)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardAvatar}
                    />
                    <View style={styles.textWrap}>
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.videoMeta}>{formatViews(item.stats?.views ?? 0)} views</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
              {!filteredUploads.length ? <Text style={styles.empty}>No videos uploaded yet.</Text> : null}
            </View>
          ) : (
            <View style={styles.storeWrap}>
              {products.length ? (
                <ProductCard products={products} ownerId={creatorId} />
              ) : (
                <Text style={styles.empty}>No products in your store yet.</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.sidebar}>
          <View style={styles.aboutCard}>
            <View style={styles.headerRow}>
              <View style={styles.aboutTitleRow}>
                <Text style={styles.infoIcon}>ⓘ</Text>
                <Text style={styles.aboutTitle}>About the Creator</Text>
              </View>
              <Pressable onPress={openStudio} style={styles.editBtn}>
                <Text style={styles.editBtnText}>{profile.bio || connectItems.length ? 'Edit' : 'Add'}</Text>
              </Pressable>
            </View>
            <Text style={styles.aboutText}>{profile.bio || 'No bio added yet. Tell people about yourself 🚀'}</Text>
            <Text style={styles.connectLabel}>CONNECT</Text>
            <View style={styles.connectList}>
              {connectItems.length ? (
                connectItems.map((item, idx) => (
                  <Pressable
                    key={`${item.platform}-${idx}`}
                    style={styles.connectItem}
                    onPress={() =>
                      Linking.openURL(item.url).catch(() =>
                        Alert.alert('Invalid URL', 'Unable to open this link'),
                      )
                    }
                  >
                    <Text style={styles.connectItemLabel}>{item.platform}</Text>
                    <Text style={styles.openIcon}>↗</Text>
                  </Pressable>
                ))
              ) : (
                <Pressable style={styles.connectItem} onPress={openStudio}>
                  <Text style={styles.connectItemLabel}>Add your social links</Text>
                  <Text style={styles.openIcon}>↗</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>VIDORAHUB © 2026 • CREATOR UNIVERSE PROGRAM</Text>
      </View>

      <Modal
        visible={Boolean(confirmDeleteVideoId)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVideoId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Video?</Text>
            <Text style={styles.modalText}>This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setConfirmDeleteVideoId(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleDelete} disabled={deleting}>
                <Text style={styles.confirmText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MobileMenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={danger ? colors.error : colors.textFaint}
        style={styles.menuItemChevron}
      />
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: {
    paddingTop: spacing.huge + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 247, 255, 0.88)',
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.06,
  },
  headerShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    ...shadows.sm,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  navLink: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  logoutPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  logoutPillText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  menuBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  mobileMenu: {
    position: 'absolute',
    right: spacing.lg,
    left: spacing.lg,
    zIndex: 70,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.md,
  },
  mobileMenuHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textFaint,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  menuItemPressed: {
    backgroundColor: colors.bgMuted,
  },
  menuItemText: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: typography.sizes.md,
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuItemChevron: {
    opacity: 0.5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
  },
  main: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  contentCol: { flex: 1 },
  profileCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  profileRow: {},
  profileLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileMeta: {
    alignItems: 'center',
    width: '100%',
  },
  avatarPulse: {
    borderRadius: 50,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.white,
  },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.8,
  },
  verified: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bio: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statValue: { fontWeight: '800', fontSize: typography.sizes.lg, color: colors.primary },
  statLabel: {
    fontSize: 9,
    color: colors.textFaint,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    gap: spacing.xl,
  },
  tab: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textFaint,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  tabTextActive: { color: colors.primary },
  masonry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VIDEO_GAP,
  },
  videoCard: {
    width: VIDEO_CARD_WIDTH,
    height: 230,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    marginBottom: spacing.md,
  },
  videoThumbWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 5, 30, 0.18)',
  },
  menuDots: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 4,
    backgroundColor: 'rgba(10, 5, 20, 0.75)',
    borderRadius: 7,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  menuDotsText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  deleteMenu: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteMenuText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  durationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 4,
    backgroundColor: 'rgba(10, 5, 20, 0.75)',
    borderRadius: 7,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  durationText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  cardInfo: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 4,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cardAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  textWrap: {
    flex: 1,
  },
  videoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  videoMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  storeWrap: {
    marginTop: spacing.sm,
  },
  sidebar: {
    width: '100%',
  },
  aboutCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.xl,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  aboutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoIcon: {
    color: colors.primary,
    fontWeight: '700',
  },
  aboutTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bgMuted,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  aboutText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  connectLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  connectList: {
    gap: spacing.sm,
  },
  connectItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectItemLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  openIcon: {
    color: colors.textFaint,
    fontSize: typography.sizes.md,
  },
  footer: {
    marginTop: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: colors.textFaint,
    paddingVertical: spacing.xxxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  modalActions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.bgMuted,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.white,
    fontWeight: '700',
  },
});
