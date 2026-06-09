import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { config } from '@/config';
import { postView } from '@/services/api/authApi';
import { generateSessionId } from '@/utils';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { VideoItem } from '@/types';

type VideoPlayerProps = {
  video: VideoItem;
  autoPlay?: boolean;
};

const CONTROLS_HIDE_MS = 3000;

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function VideoPlayer({ video, autoPlay = true }: VideoPlayerProps) {
  const videoViewRef = useRef<VideoView>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineWidthRef = useRef(0);
  const watchStartRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(generateSessionId('video_session'));

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const sourceUri = video.hlsUl
    ? `${config.gcsBaseUrl}/${video.hlsUl}/master.m3u8`
    : video.videoUrl;

  const player = useVideoPlayer(sourceUri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0.25;
    if (autoPlay) videoPlayer.play();
  });

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      if (player.playing) setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimeout, player]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const onVideoAreaPress = useCallback(() => {
    if (!showControls) {
      revealControls();
      return;
    }
    togglePlay();
    revealControls();
  }, [showControls, revealControls, togglePlay]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
    revealControls();
  }, [player, revealControls]);

  const handleSeek = useCallback(
    (locationX: number) => {
      if (!duration || timelineWidthRef.current <= 0) return;
      const ratio = Math.max(0, Math.min(locationX / timelineWidthRef.current, 1));
      player.currentTime = duration * ratio;
      setCurrentTime(player.currentTime);
      revealControls();
    },
    [duration, player, revealControls],
  );

  const enterFullscreen = useCallback(() => {
    videoViewRef.current?.enterFullscreen().catch(() => undefined);
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    const listeners = [
      player.addListener('playingChange', ({ isPlaying: playing }) => {
        setIsPlaying(playing);
        if (playing) {
          scheduleHideControls();
        } else {
          clearHideTimeout();
          setShowControls(true);
        }
      }),
      player.addListener('statusChange', ({ status }) => {
        setIsLoading(status === 'loading');
      }),
      player.addListener('mutedChange', ({ muted }) => {
        setIsMuted(muted);
      }),
      player.addListener('timeUpdate', ({ currentTime: time, bufferedPosition }) => {
        setCurrentTime(time);
        if (bufferedPosition >= 0) setBuffered(bufferedPosition);
      }),
      player.addListener('sourceLoad', ({ duration: loadedDuration }) => {
        if (loadedDuration > 0) setDuration(loadedDuration);
      }),
    ];

    setIsPlaying(player.playing);
    setIsMuted(player.muted);
    if (player.duration > 0) setDuration(player.duration);
    if (player.bufferedPosition >= 0) setBuffered(player.bufferedPosition);
    if (player.playing) scheduleHideControls();

    return () => {
      listeners.forEach((sub) => sub.remove());
      clearHideTimeout();
    };
  }, [player, scheduleHideControls, clearHideTimeout]);

  useEffect(() => {
    watchStartRef.current = Date.now();
    const id = video._id;
    return () => {
      const watchTime = Math.floor((Date.now() - watchStartRef.current) / 1000);
      if (watchTime < 3 || !id) return;
      postView({
        videoId: id,
        sessionId: sessionIdRef.current,
        watchTime,
      }).catch(() => undefined);
    };
  }, [video._id]);

  const onTimelineLayout = (e: LayoutChangeEvent) => {
    timelineWidthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.playerGlow}>
        <View style={styles.inner}>
          {!isReady && video.thumbnailUrl ? (
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : null}

          <VideoView
            ref={videoViewRef}
            player={player}
            style={styles.video}
            contentFit={'contain' as VideoContentFit}
            nativeControls={false}
            allowsFullscreen
            surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
            onFirstFrameRender={() => {
              setIsReady(true);
              setIsLoading(false);
            }}
          />

          {isLoading ? (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={colors.white} />
            </View>
          ) : null}

          {/* Interaction layer — split zones so controls never fight the video tap area */}
          <View style={styles.interactionLayer} pointerEvents="box-none">
            {/* Video tap zone: full area when controls hidden; upper area when controls visible */}
            <Pressable
              style={[styles.videoTapZone, showControls && styles.videoTapZoneWithControls]}
              onPress={onVideoAreaPress}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
            >
              {!isPlaying && !isLoading ? (
                <View style={styles.centerPlayBtn} pointerEvents="none">
                  <Ionicons
                    name="play"
                    size={34}
                    color={colors.white}
                    style={styles.playIconOffset}
                  />
                </View>
              ) : null}
            </Pressable>

            {/* Bottom control bar — only rendered when visible */}
            {showControls ? (
              <View style={styles.controlsBar}>
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <View style={styles.controlsInner}>
                  <Pressable
                    style={styles.timeline}
                    onLayout={onTimelineLayout}
                    onPress={(e) => handleSeek(e.nativeEvent.locationX)}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Video progress"
                  >
                    <View style={styles.timelineTrack} />
                    <View style={[styles.bufferBar, { width: `${bufferProgress}%` }]} />
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    {duration > 0 ? (
                      <View style={[styles.progressThumb, { left: `${progress}%` }]} />
                    ) : null}
                  </Pressable>

                  <View style={styles.bottomRow}>
                    <Pressable
                      onPress={() => {
                        togglePlay();
                        revealControls();
                      }}
                      hitSlop={14}
                      style={styles.controlBtn}
                      accessibilityRole="button"
                      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color={colors.white}
                      />
                    </Pressable>

                    <Text style={styles.time}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>

                    <View style={styles.rightControls}>
                      <Pressable
                        onPress={toggleMute}
                        hitSlop={14}
                        style={styles.controlBtn}
                        accessibilityRole="button"
                        accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
                      >
                        <Ionicons
                          name={isMuted ? 'volume-mute' : 'volume-high'}
                          size={22}
                          color={colors.white}
                        />
                      </Pressable>

                      <Pressable
                        onPress={enterFullscreen}
                        hitSlop={14}
                        style={styles.controlBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Fullscreen"
                      >
                        <Ionicons name="expand" size={20} color={colors.white} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const CONTROLS_BAR_HEIGHT = 88;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  playerGlow: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  inner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 2,
  },
  interactionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  videoTapZone: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTapZoneWithControls: {
    bottom: CONTROLS_BAR_HEIGHT,
  },
  centerPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  playIconOffset: {
    marginLeft: 3,
  },
  controlsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROLS_BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  controlsInner: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  timeline: {
    height: 32,
    justifyContent: 'center',
  },
  timelineTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13.5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
  },
  bufferBar: {
    position: 'absolute',
    left: 0,
    top: 13.5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 13.5,
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    top: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryEnd,
    borderWidth: 2,
    borderColor: colors.white,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
  },
  controlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    fontVariant: ['tabular-nums'],
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
