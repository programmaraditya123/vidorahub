import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Video, { type VideoRef } from 'react-native-video';
import { Image } from '@/components/native/Image';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { config } from '@/config';
import { AuthModal } from '@/components/shared/AuthModal';
import { ShareBlade } from '@/components/ui/ShareBlade';
import { useFollowMutation, useFollowQuery, useReactionMutation, useReactionsQuery } from '@/queries';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme';
import type { VibeItem } from '@/types';
import { formatViews } from '@/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { MainStackParamList } from '@/navigation/types';

type VibeSlideProps = {
  vibe: VibeItem;
  isActive: boolean;
  isMuted: boolean;
  slideHeight: number;
  onToggleMute: () => void;
  onCreatorPress: (creatorId: string) => void;
};

export function VibeSlide({
  vibe,
  isActive,
  isMuted,
  slideHeight,
  onToggleMute,
  onCreatorPress,
}: VibeSlideProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const videoRef = useRef<VideoRef>(null);
  const [isReady, setIsReady] = useState(false);
  const [showMuteHint, setShowMuteHint] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(vibe.uploader.subscriber);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('Sign in to continue.');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userSerialNumber = user?.userSerialNumber ? Number(user.userSerialNumber) : 0;
  const videoSerialNumber = vibe.videoSerialNumber ?? 0;
  const creatorSerialNumber = vibe.uploader.userSerialNumber;

  const sourceUri = vibe.hlsUl
    ? `${config.gcsBaseUrl}/${vibe.hlsUl}/master.m3u8`
    : vibe.videoUrl;
  const shareLink = `https://www.vidorahub.com/vibes?v=${vibe._id}`;

  const { data: reactions } = useReactionsQuery(
    videoSerialNumber,
    userSerialNumber || undefined,
  );
  const reactionMutation = useReactionMutation();
  const { data: followData } = useFollowQuery(
    vibe.uploader._id,
    userSerialNumber,
    creatorSerialNumber,
    isAuthenticated && userSerialNumber > 0,
  );
  const followMutation = useFollowMutation(vibe.uploader._id);

  const uploaderAvatar = useMemo(
    () => vibe.uploader.profilePicture ?? vibe.uploader.profilePicUrl,
    [vibe.uploader.profilePicUrl, vibe.uploader.profilePicture],
  );

  useEffect(() => {
    if (reactions) {
      setLiked(reactions.liked);
      setDisliked(reactions.disliked);
      setLikeCount(reactions.likes);
      setDislikeCount(reactions.dislikes);
    }
  }, [reactions]);

  useEffect(() => {
    if (followData?.following !== undefined) {
      setFollowing(followData.following);
    }
  }, [followData]);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.seek(0);
    }
  }, [isActive]);

  const requireAuth = (message: string) => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const handleToggleMute = () => {
    setShowMuteHint(true);
    setTimeout(() => setShowMuteHint(false), 1200);
    onToggleMute();
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

  const toggleSubscribe = async () => {
    if (!isAuthenticated || userSerialNumber <= 0) {
      requireAuth('Sign in to subscribe to this channel.');
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
      if (typeof total === 'number') {
        setSubscriberCount(total);
      } else {
        setSubscriberCount((count) => (following ? Math.max(0, count - 1) : count + 1));
      }
    } catch {
      requireAuth('Sign in to subscribe to this channel.');
    }
  };

  return (
    <Pressable style={[styles.slide, { height: slideHeight }]} onPress={handleToggleMute}>
      {!isReady && vibe.thumbnailUrl ? (
        <Image source={{ uri: vibe.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      {!isReady ? (
        <View style={styles.skeleton} pointerEvents="none" />
      ) : null}
      <Video
        ref={videoRef}
        source={{ uri: sourceUri }}
        style={styles.video}
        paused={!isActive}
        muted={isMuted}
        repeat
        controls={false}
        resizeMode="contain"
        onReadyForDisplay={() => setIsReady(true)}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <View style={[styles.muteOverlay, showMuteHint && styles.muteOverlayVisible]} pointerEvents="none">
        <View style={styles.muteBubble}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={34}
            color={colors.white}
          />
        </View>
      </View>

      <View style={styles.actionRail}>
        <ActionButton icon="eye-outline" label={formatViews(vibe.stats.views)} />
        <ActionButton
          icon={liked ? 'heart' : 'heart-outline'}
          label={formatViews(likeCount)}
          active={liked}
          onPress={handleLike}
        />
        <ActionButton
          icon={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
          label={formatViews(dislikeCount)}
          activeDislike={disliked}
          onPress={handleDislike}
        />
        <ActionButton icon="share-social-outline" label="Share" onPress={() => setShareOpen(true)} />
      </View>

      <View style={styles.overlay}>
        <View style={styles.metaCard}>
          <Pressable
            style={styles.creatorLeft}
            onPress={() => onCreatorPress(vibe.uploader._id)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${vibe.uploader.name} channel`}
          >
            <Avatar name={vibe.uploader.name} uri={uploaderAvatar} size={42} />
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName} numberOfLines={1}>
                {vibe.uploader.name}
              </Text>
              <Text style={styles.subscribers}>{formatViews(subscriberCount)} subscribers</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.subscribeBtn, following && styles.subscribedBtn]}
            onPress={toggleSubscribe}
            disabled={followMutation.isPending}
            accessibilityRole="button"
          >
            <Text style={[styles.subscribeText, following && styles.subscribedText]}>
              {followMutation.isPending ? '...' : following ? 'Subscribed' : 'Subscribe'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {vibe.title}
        </Text>
        {vibe.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {vibe.description}
          </Text>
        ) : null}
      </View>

      <ShareBlade
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        thumbnailUrl={vibe.thumbnailUrl ?? ''}
        link={shareLink}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => {
          setShowAuthModal(false);
          navigation.navigate('Login');
        }}
        onSignup={() => {
          setShowAuthModal(false);
          navigation.navigate('Signup');
        }}
        message={authMessage}
      />
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  active,
  activeDislike,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  activeDislike?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.actionBtn,
        active && styles.actionBtnActive,
        activeDislike && styles.actionBtnDislike,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
      <Text style={styles.actionCount} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: '100%',
    backgroundColor: colors.black,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  skeleton: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#111111',
    zIndex: 1,
    opacity: 0.84,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    zIndex: 5,
  },
  muteOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    opacity: 0,
  },
  muteOverlayVisible: {
    opacity: 1,
  },
  muteBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  actionRail: {
    position: 'absolute',
    right: 5,
    bottom: 180,
    alignItems: 'center',
    gap: 18,
    zIndex: 20,
  },
  actionBtn: {
    width: 68,
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  actionBtnActive: {
    backgroundColor: '#ff2e63',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnDislike: {
    backgroundColor: '#4b5563',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 20,
    right: 86,
    bottom: 0,
    paddingBottom: 0,
    zIndex: 20,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  creatorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  creatorInfo: {
    flex: 1,
    minWidth: 0,
  },
  creatorName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  subscribers: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  subscribeBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  subscribedBtn: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  subscribeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  subscribedText: {
    color: colors.white,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 6,
  },
});
