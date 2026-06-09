import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '@/components/ui/Avatar';
import { AuthModal } from '@/components/shared/AuthModal';
import { useFollowQuery, useFollowMutation } from '@/queries';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { Uploader } from '@/types';

type Props = {
  title: string;
  category: string;
  published: string;
  uploader: Uploader;
};

export function VideoMeta({ title, category, published, uploader }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userSerialNumber = user?.userSerialNumber
    ? Number(user.userSerialNumber)
    : 0;

  const creatorId = uploader._id;
  const creatorSerialNumber = uploader.userSerialNumber;

  const [following, setFollowing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(uploader.subscriber);
  const [showModal, setShowModal] = useState(false);

  const { data: followData } = useFollowQuery(
    creatorId,
    userSerialNumber,
    creatorSerialNumber,
    isAuthenticated && userSerialNumber > 0,
  );
  const followMutation = useFollowMutation(creatorId);

  useEffect(() => {
    if (followData?.following !== undefined) {
      setFollowing(followData.following);
    }
  }, [followData]);

  const toggleSubscribe = async () => {
    if (!isAuthenticated || userSerialNumber <= 0) {
      setShowModal(true);
      return;
    }
    if (followMutation.isPending) return;

    try {
      const res = await followMutation.mutateAsync({
        action: following ? 'unfollow' : 'follow',
        userSerialNumber,
        creatorSerialNumber,
      });
      setFollowing(!following);
      const total = (res as { totalSubscribers?: number })?.totalSubscribers;
      if (typeof total === 'number') setSubscriberCount(total);
      else setSubscriberCount((c) => (following ? Math.max(0, c - 1) : c + 1));
    } catch {
      setShowModal(true);
    }
  };

  return (
    <View style={styles.meta}>
      <View style={styles.top}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.published}>Published {published}</Text>
      </View>

      <Text style={styles.title}>
        {title} <Text style={styles.hash}>#024</Text>
      </Text>

      <View style={styles.channelRow}>
        <Pressable
          style={styles.channelLeft}
          onPress={() => navigation.navigate('Channel', { id: creatorId })}
          accessibilityRole="button"
          accessibilityLabel={`Open ${uploader.name} channel`}
        >
          <Avatar
            name={uploader.name}
            uri={uploader.profilePicUrl ?? uploader.profilePicture}
            size={48}
          />
          <View style={styles.channelInfo}>
            <Text style={styles.channelName} numberOfLines={1}>
              {uploader.name}
            </Text>
            <Text style={styles.subscribers}>
              {subscriberCount} subscribers
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.subscribe, following && styles.subscribed]}
          onPress={toggleSubscribe}
          disabled={followMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={following ? 'Unsubscribe' : 'Subscribe'}
        >
          <Text
            style={[
              styles.subscribeText,
              following && styles.subscribedText,
            ]}
          >
            {followMutation.isPending
              ? '...'
              : following
                ? 'Subscribed'
                : 'Subscribe'}
          </Text>
        </Pressable>
      </View>

      <AuthModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onLogin={() => {
          setShowModal(false);
          navigation.navigate('Login');
        }}
        onSignup={() => {
          setShowModal(false);
          navigation.navigate('Signup');
        }}
        message="Sign in to subscribe to this channel."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    gap: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  published: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  hash: {
    color: colors.textFaint,
    fontWeight: '600',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  channelInfo: {
    flex: 1,
    minWidth: 0,
  },
  channelName: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subscribers: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  subscribe: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  subscribed: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subscribeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  subscribedText: {
    color: colors.textMuted,
  },
});
