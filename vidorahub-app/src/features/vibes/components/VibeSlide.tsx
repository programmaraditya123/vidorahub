import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';
import { Image } from 'expo-image';
import { config } from '@/config';
import { colors, typography } from '@/theme';
import type { VibeItem } from '@/types';
import { formatViews } from '@/utils';
import { Avatar } from '@/components/ui/Avatar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type VibeSlideProps = {
  vibe: VibeItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onCreatorPress: (creatorId: string) => void;
};

export function VibeSlide({
  vibe,
  isActive,
  isMuted,
  onToggleMute,
  onCreatorPress,
}: VibeSlideProps) {
  const [isReady, setIsReady] = useState(false);

  const sourceUri = vibe.hlsUl
    ? `${config.gcsBaseUrl}/${vibe.hlsUl}/master.m3u8`
    : vibe.videoUrl;

  const player = useVideoPlayer(sourceUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = isMuted;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, player]);

  return (
    <Pressable style={styles.slide} onPress={onToggleMute}>
      {!isReady && vibe.thumbnailUrl ? (
        <Image source={{ uri: vibe.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <VideoView
        player={player}
        style={styles.video}
        contentFit={'cover' as VideoContentFit}
        nativeControls={false}
        onFirstFrameRender={() => setIsReady(true)}
      />
      <View style={styles.overlay}>
        <Pressable onPress={() => onCreatorPress(vibe.uploader._id)}>
          <Avatar
            name={vibe.uploader.name}
            uri={vibe.uploader.profilePicture ?? vibe.uploader.profilePicUrl}
            size={44}
          />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {vibe.title}
        </Text>
        <Text style={styles.views}>{formatViews(vibe.stats.views)} views</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: SCREEN_HEIGHT,
    width: '100%',
    backgroundColor: colors.black,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginTop: 8,
  },
  views: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
});
