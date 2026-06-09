import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEarningsQuery } from '@/queries';
import { useAuthStore } from '@/store/authStore';
import { Loader } from '@/components/ui/Loader';
import { colors, spacing, typography, radius, shadows } from '@/theme';
import type { EarningsData } from '@/types';
import type { MainStackParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '@/lib/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP) / 2;

const BREAKDOWN: Array<{
  title: string;
  subtitle: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { title: 'Views', subtitle: '1 point per view', value: '1x', icon: 'eye' },
  { title: 'Likes', subtitle: '5 points per like', value: '5x', icon: 'heart' },
  {
    title: 'Comments',
    subtitle: '10 points per comment',
    value: '10x',
    icon: 'chatbubble',
  },
  {
    title: 'Dislikes',
    subtitle: '-2 points per dislike',
    value: '-2x',
    icon: 'thumbs-down',
  },
];

type Activity = {
  icon: keyof typeof Ionicons.glyphMap;
  action: string;
  source: string;
  points: string;
  date: string;
};

function EarnNavbar() {
  return (
    <View style={styles.navbar}>
      <View style={styles.logoSection}>
        <Ionicons name="play-circle" size={26} color={colors.primary} />
        <Text style={styles.logoText}>VidoraHub</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={18} color={colors.primary} />
        </View>
        <LinearGradient
          colors={[colors.primary, colors.primaryEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>A</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

function VibePointsBreakdown() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>Points Earning Breakdown</Text>
      <Text style={styles.sectionSub}>
        Every interaction on your content earns you points.
      </Text>

      <View style={styles.grid}>
        {BREAKDOWN.map((card) => (
          <View key={card.title} style={[styles.card, { width: CARD_WIDTH }]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <Ionicons name={card.icon} size={26} color={colors.white} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EarnBar({
  totalPoints,
  totalEarning,
  onWithdraw,
}: {
  totalPoints: number;
  totalEarning: number;
  onWithdraw: () => void;
}) {
  return (
    <LinearGradient
      colors={['#7e22ce', '#4c1d95']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bar}
    >
      <View style={styles.barLeft}>
        <Text style={styles.barLabel}>Total Points Earned</Text>
        <Text style={styles.barPoints}>{totalPoints} pts</Text>
        <Text style={styles.barRupee}>≈ ₹{totalEarning}</Text>
      </View>
      <Pressable style={styles.withdrawBtn} onPress={onWithdraw}>
        <Text style={styles.withdrawText}>Withdraw</Text>
      </Pressable>
    </LinearGradient>
  );
}

function RecentEarningActivities({ activities }: { activities: Activity[] }) {
  return (
    <View style={styles.activitiesWrap}>
      <Text style={styles.activitiesTitle}>Recent Earning Activities</Text>

      {activities.map((item, index) => (
        <View key={index} style={styles.activityRow}>
          <View style={styles.activityTop}>
            <LinearGradient
              colors={[colors.primary, colors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activityIcon}
            >
              <Ionicons name={item.icon} size={18} color={colors.white} />
            </LinearGradient>
            <View style={styles.activityMeta}>
              <Text style={styles.activityAction}>{item.action}</Text>
              <Text style={styles.activitySource}>{item.source}</Text>
            </View>
          </View>
          <View style={styles.activityBottom}>
            <Text style={styles.activityPoints}>{item.points}</Text>
            <Text style={styles.activityDate}>{item.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function EarnScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data, isLoading } = useEarningsQuery(isAuthenticated);

  useFocusEffect(
    useCallback(() => {
      logScreenView('Earn');
    }, []),
  );

  const earnings = (data ?? {}) as EarningsData;
  const totalPoints = earnings.totalPoints ?? 0;
  const totalEarning = earnings.totalEarning ?? 0;

  const activities = useMemo<Activity[]>(() => {
    const totals = earnings.totals ?? {};
    const list: Activity[] = [];

    if ((totals.views ?? 0) > 0) {
      list.push({
        icon: 'eye',
        action: 'Views Earned',
        source: `${totals.views} total views`,
        points: `+${totals.views} pts`,
        date: 'Today',
      });
    }
    if ((totals.comments ?? 0) > 0) {
      list.push({
        icon: 'chatbubble',
        action: 'Comments Earned',
        source: `${totals.comments} comments`,
        points: `+${(totals.comments ?? 0) * 10} pts`,
        date: 'Today',
      });
    }
    list.push({
      icon: 'heart',
      action: 'Likes Earnings (Coming Soon)',
      source: 'We are working on likes earning criteria',
      points: '--',
      date: '--',
    });
    list.push({
      icon: 'thumbs-down',
      action: 'Dislikes Impact (Coming Soon)',
      source: 'We are working on dislikes earning criteria',
      points: '--',
      date: '--',
    });
    list.push({
      icon: 'share-social',
      action: 'Shares Earnings (Coming Soon)',
      source: 'We are working on shares earning criteria',
      points: '--',
      date: '--',
    });

    return list;
  }, [earnings]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EarnNavbar />
        <View style={styles.locked}>
          <LinearGradient
            colors={[colors.primary, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lockedIcon}
          >
            <Ionicons name="wallet" size={32} color={colors.white} />
          </LinearGradient>
          <Text style={styles.lockedTitle}>Sign in to view your earnings</Text>
          <Text style={styles.lockedSub}>
            Track your points and earnings from every view, like and comment.
          </Text>
          <Pressable
            style={styles.lockedBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.lockedBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <EarnNavbar />
      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <VibePointsBreakdown />
          <EarnBar
            totalPoints={totalPoints}
            totalEarning={totalEarning}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <RecentEarningActivities activities={activities} />
        </ScrollView>
      )}

      <Modal
        visible={withdrawOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWithdrawOpen(false)}
        >
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Withdrawals aren&apos;t open yet</Text>
            <Text style={styles.modalBody}>
              VidoraHub is still growing. Your points are{' '}
              <Text style={styles.modalStrong}>safe and recorded</Text> —
              they&apos;ll convert to real money once our platform is fully
              funded.
            </Text>
            <View style={styles.modalPledge}>
              <Text style={styles.modalBody}>
                Every point you earn today{' '}
                <Text style={styles.modalStrong}>will be paid out</Text>. We
                promise.
              </Text>
            </View>
            <Text style={styles.modalFooter}>
              Keep creating — early creators like you will be rewarded first.
            </Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setWithdrawOpen(false)}
            >
              <Text style={styles.modalCloseText}>
                Got it, I&apos;ll keep going
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },

  /* Navbar */
  navbar: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    ...shadows.sm,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },

  /* Breakdown section */
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeading: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  sectionSub: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    ...shadows.sm,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    marginVertical: spacing.md,
  },
  cardValue: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
  },

  /* Earn bar */
  bar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLeft: {
    flex: 1,
  },
  barLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  barPoints: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  barRupee: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '600',
  },
  withdrawBtn: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  withdrawText: {
    color: '#4c1d95',
    fontWeight: '700',
    fontSize: typography.sizes.md,
  },

  /* Activities */
  activitiesWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    ...shadows.sm,
  },
  activitiesTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  activityRow: {
    backgroundColor: '#faf8ff',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    marginBottom: spacing.md,
  },
  activityTop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMeta: {
    flex: 1,
  },
  activityAction: {
    fontWeight: '600',
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  activitySource: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityPoints: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.sizes.md,
  },
  activityDate: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
  },

  /* Locked / signed out */
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  lockedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  lockedTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockedSub: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  lockedBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
  },
  lockedBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sizes.md,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: '#12121a',
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalBody: {
    color: '#9ca3af',
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalStrong: {
    color: colors.white,
    fontWeight: '700',
  },
  modalPledge: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalFooter: {
    color: '#9ca3af',
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  modalCloseBtn: {
    backgroundColor: '#7e22ce',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.sizes.md,
  },
});
