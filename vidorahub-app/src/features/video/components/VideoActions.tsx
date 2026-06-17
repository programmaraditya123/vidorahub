import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ShareBlade } from '@/components/ui/ShareBlade';
import { AuthModal } from '@/components/shared/AuthModal';
import { useReactionsQuery, useReactionMutation } from '@/queries';
import { useAuthStore } from '@/store/authStore';
import { config } from '@/config';
import { colors, radius, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

type Props = {
  videoSerialNumber: number;
  thumbnailUrl: string;
  videoId: string;
};

export function VideoActions({
  videoSerialNumber,
  thumbnailUrl,
  videoId,
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userSerialNumber = user?.userSerialNumber
    ? Number(user.userSerialNumber)
    : undefined;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { data: reactions } = useReactionsQuery(
    videoSerialNumber,
    userSerialNumber,
  );
  const reactionMutation = useReactionMutation();

  useEffect(() => {
    if (reactions) {
      setLiked(reactions.liked);
      setDisliked(reactions.disliked);
      setLikeCount(reactions.likes);
      setDislikeCount(reactions.dislikes);
    }
  }, [reactions]);

  const requireAuth = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const handleLike = async () => {
    if (!userSerialNumber) return requireAuth('Sign in to like this video.');
    if (reactionMutation.isPending) return;
    try {
      const res = await reactionMutation.mutateAsync({
        action: liked ? 'unlike' : 'like',
        userSerialNumber,
        videoSerialNumber,
      });
      if (res) {
        setLiked(res.liked);
        setDisliked(res.disliked);
        setLikeCount(res.likes);
        setDislikeCount(res.dislikes);
      }
    } catch {
      requireAuth('Sign in to like this video.');
    }
  };

  const handleDislike = async () => {
    if (!userSerialNumber) return requireAuth('Sign in to dislike this video.');
    if (reactionMutation.isPending) return;
    try {
      const res = await reactionMutation.mutateAsync({
        action: disliked ? 'undislike' : 'dislike',
        userSerialNumber,
        videoSerialNumber,
      });
      if (res) {
        setLiked(res.liked);
        setDisliked(res.disliked);
        setLikeCount(res.likes);
        setDislikeCount(res.dislikes);
      }
    } catch {
      requireAuth('Sign in to dislike this video.');
    }
  };

  const shareLink = `${config.studioUrl}/video/${videoId}`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.likeBar}>
        <Pressable
          style={styles.likeBtn}
          onPress={handleLike}
          disabled={reactionMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Like video"
        >
          <Ionicons
            name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={liked ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.count, liked && styles.activeCount]}>
            {likeCount}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.likeBtn}
          onPress={handleDislike}
          disabled={reactionMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Dislike video"
        >
          <Ionicons
            name={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={20}
            color={disliked ? colors.error : colors.textMuted}
          />
          <Text style={[styles.count, disliked && styles.activeDislike]}>
            {dislikeCount}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.shareBtn}
        onPress={() => setShareOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Share video"
      >
        <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
        <Text style={styles.shareText}>Share</Text>
      </Pressable>

      <ShareBlade
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        thumbnailUrl={thumbnailUrl}
        link={shareLink}
      />

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
        message={modalMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  likeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  count: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeCount: {
    color: colors.primary,
  },
  activeDislike: {
    color: colors.error,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  shareText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
