import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit, type VideoTrack } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { config } from '@/config';
import { postView } from '@/services/api/authApi';
import { generateSessionId } from '@/utils';
import { useVideoStore } from '@/store/videoStore';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { VideoItem } from '@/types';

type VideoPlayerProps = {
  video: VideoItem;
  autoPlay?: boolean;
};

const CONTROLS_HIDE_MS = 2800;
const CONTROLS_BAR_HEIGHT = 104;
const SKIP_SECONDS = 10;

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
  const fullscreenPlaybackRef = useRef({ wasPlaying: false, time: 0 });
  const saveProgress = useVideoStore((s) => s.setProgress);
  const getSavedProgress = useVideoStore((s) => s.getProgress);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<VideoTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<VideoTrack | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sourceUri = video.hlsUl
    ? `${config.gcsBaseUrl}/${video.hlsUl}/master.m3u8`
    : video.videoUrl;
  const source = useMemo(
    () =>
      video.hlsUl
        ? {
            uri: sourceUri,
            contentType: 'hls' as const,
            metadata: {
              title: video.title,
              artist: video.uploader?.name,
              artwork: video.thumbnailUrl,
            },
          }
        : {
            uri: sourceUri,
            metadata: {
              title: video.title,
              artist: video.uploader?.name,
              artwork: video.thumbnailUrl,
            },
          },
    [sourceUri, video.hlsUl, video.thumbnailUrl, video.title, video.uploader?.name],
  );

  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0.25;
    videoPlayer.keepScreenOnWhilePlaying = true;
    if (autoPlay) videoPlayer.play();
  });

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;
  const currentQualityLabel = currentTrack?.size?.height
    ? `${currentTrack.size.height}p`
    : video.hlsUl
      ? 'Auto'
      : 'HD';
  const sortedTracks = useMemo(
    () =>
      [...availableTracks]
        .filter((track) => track.size?.height)
        .sort((a, b) => b.size.height - a.size.height),
    [availableTracks],
  );

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const runPlayerAction = useCallback((action: () => void | Promise<void>) => {
    try {
      const result = action();
      if (result && typeof result.catch === 'function') {
        result.catch(() => undefined);
      }
    } catch {
      // Expo Video may reject native calls after its shared object is released.
    }
  }, []);

  const readPlayerValue = useCallback(<T,>(reader: () => T, fallback: T) => {
    try {
      return reader();
    } catch {
      return fallback;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      if (readPlayerValue(() => player.playing, false)) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimeout, player, readPlayerValue]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(() => {
    if (isEnded) {
      runPlayerAction(() => player.replay());
      setIsEnded(false);
      return;
    }

    if (readPlayerValue(() => player.playing, false)) {
      runPlayerAction(() => player.pause());
    } else {
      runPlayerAction(() => player.play());
    }
  }, [isEnded, player, readPlayerValue, runPlayerAction]);

  const onVideoAreaPress = useCallback(() => {
    if (!showControls) {
      revealControls();
      return;
    }
    togglePlay();
    revealControls();
  }, [showControls, revealControls, togglePlay]);

  const toggleMute = useCallback(() => {
    runPlayerAction(() => {
      player.muted = !readPlayerValue(() => player.muted, false);
    });
    revealControls();
  }, [player, readPlayerValue, revealControls, runPlayerAction]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (!duration) return;
      const nextTime = Math.max(
        0,
        Math.min(readPlayerValue(() => player.currentTime, currentTime) + seconds, duration),
      );
      runPlayerAction(() => {
        player.currentTime = nextTime;
      });
      setCurrentTime(nextTime);
      setIsEnded(false);
      revealControls();
    },
    [currentTime, duration, player, readPlayerValue, revealControls, runPlayerAction],
  );

  const replay = useCallback(() => {
    runPlayerAction(() => player.replay());
    setIsEnded(false);
    revealControls();
  }, [player, revealControls, runPlayerAction]);

  const handleSeek = useCallback(
    (locationX: number) => {
      if (!duration || timelineWidthRef.current <= 0) return;
      const ratio = Math.max(0, Math.min(locationX / timelineWidthRef.current, 1));
      const nextTime = duration * ratio;
      runPlayerAction(() => {
        player.currentTime = nextTime;
      });
      setCurrentTime(nextTime);
      setIsEnded(false);
      revealControls();
    },
    [duration, player, revealControls, runPlayerAction],
  );

  const restoreAfterSurfaceSwap = useCallback(() => {
    const { wasPlaying, time } = fullscreenPlaybackRef.current;
    setTimeout(() => {
      runPlayerAction(() => {
        player.currentTime = time;
      });
      setCurrentTime(time);
      if (wasPlaying) runPlayerAction(() => player.play());
    }, 120);
  }, [player, runPlayerAction]);

  const enterFullscreen = useCallback(async () => {
    fullscreenPlaybackRef.current = {
      wasPlaying: readPlayerValue(() => player.playing, false),
      time: readPlayerValue(() => player.currentTime, currentTime),
    };
    runPlayerAction(() => player.pause());
    setShowQualityMenu(false);
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => undefined);
    setIsFullscreen(true);
    revealControls();
    restoreAfterSurfaceSwap();
  }, [currentTime, player, readPlayerValue, restoreAfterSurfaceSwap, revealControls, runPlayerAction]);

  const exitFullscreen = useCallback(async () => {
    fullscreenPlaybackRef.current = {
      wasPlaying: readPlayerValue(() => player.playing, false),
      time: readPlayerValue(() => player.currentTime, currentTime),
    };
    runPlayerAction(() => player.pause());
    setShowQualityMenu(false);
    setIsFullscreen(false);
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => undefined);
    revealControls();
    restoreAfterSurfaceSwap();
  }, [currentTime, player, readPlayerValue, restoreAfterSurfaceSwap, revealControls, runPlayerAction]);

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
        setPlayerError(status === 'error' ? 'Video could not be loaded.' : null);
      }),
      player.addListener('mutedChange', ({ muted }) => {
        setIsMuted(muted);
      }),
      player.addListener('timeUpdate', ({ currentTime: time, bufferedPosition }) => {
        setCurrentTime(time);
        if (bufferedPosition >= 0) setBuffered(bufferedPosition);
      }),
      player.addListener('sourceLoad', ({ duration: loadedDuration, availableVideoTracks }) => {
        if (loadedDuration > 0) setDuration(loadedDuration);
        setAvailableTracks(availableVideoTracks ?? []);
        setCurrentTrack(readPlayerValue(() => player.videoTrack, null));

        const saved = getSavedProgress(video._id);
        if (saved > 3 && loadedDuration - saved > 6) {
          runPlayerAction(() => {
            player.currentTime = saved;
          });
          setCurrentTime(saved);
        }
      }),
      player.addListener('videoTrackChange', ({ videoTrack }) => {
        setCurrentTrack(videoTrack);
      }),
      player.addListener('playToEnd', () => {
        setIsEnded(true);
        setIsPlaying(false);
        setShowControls(true);
        clearHideTimeout();
      }),
    ];

    const initialDuration = readPlayerValue(() => player.duration, 0);
    const initialBuffered = readPlayerValue(() => player.bufferedPosition, -1);
    const initialPlaying = readPlayerValue(() => player.playing, false);
    setIsPlaying(initialPlaying);
    setIsMuted(readPlayerValue(() => player.muted, false));
    if (initialDuration > 0) setDuration(initialDuration);
    if (initialBuffered >= 0) setBuffered(initialBuffered);
    if (initialPlaying) scheduleHideControls();

    return () => {
      listeners.forEach((sub) => sub.remove());
      clearHideTimeout();
    };
  }, [
    player,
    scheduleHideControls,
    clearHideTimeout,
    getSavedProgress,
    readPlayerValue,
    runPlayerAction,
    video._id,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (video._id && currentTime > 0 && !isEnded) {
        saveProgress(video._id, currentTime);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentTime, isEnded, saveProgress, video._id]);

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
  }, [player, video._id]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        runPlayerAction(() => player.pause());
        setIsFullscreen(false);
        setShowControls(true);
        setShowQualityMenu(false);
        clearHideTimeout();
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
          () => undefined,
        );
      };
    }, [clearHideTimeout, player, runPlayerAction]),
  );

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
        () => undefined,
      );
    };
  }, []);

  const onTimelineLayout = (e: LayoutChangeEvent) => {
    timelineWidthRef.current = e.nativeEvent.layout.width;
  };

  const renderPlayerSurface = (fullscreen = false) => (
    <View style={fullscreen ? styles.fullscreenPlayer : styles.playerGlow}>
      <View style={styles.inner}>
        {!isReady && video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}

        <VideoView
          ref={!fullscreen ? videoViewRef : undefined}
          player={player}
          style={styles.video}
          contentFit={'contain' as VideoContentFit}
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
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

        <View style={styles.interactionLayer} pointerEvents="box-none">
          <Pressable
            style={styles.videoTapZone}
            onPress={onVideoAreaPress}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
          >
            {showControls && !isLoading ? (
              <View style={styles.centerControls} pointerEvents="box-none">
                <Pressable
                  style={styles.skipBtn}
                  onPress={() => seekBy(-SKIP_SECONDS)}
                  accessibilityRole="button"
                  accessibilityLabel="Rewind 10 seconds"
                >
                  <Ionicons name="play-back" size={24} color={colors.white} />
                  <Text style={styles.skipText}>10</Text>
                </Pressable>

                <Pressable
                  style={styles.centerPlayBtn}
                  onPress={togglePlay}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
                >
                  <Ionicons
                    name={isEnded ? 'refresh' : isPlaying ? 'pause' : 'play'}
                    size={36}
                    color={colors.white}
                    style={!isPlaying && !isEnded ? styles.playIconOffset : undefined}
                  />
                </Pressable>

                <Pressable
                  style={styles.skipBtn}
                  onPress={() => seekBy(SKIP_SECONDS)}
                  accessibilityRole="button"
                  accessibilityLabel="Forward 10 seconds"
                >
                  <Text style={styles.skipText}>10</Text>
                  <Ionicons name="play-forward" size={24} color={colors.white} />
                </Pressable>
              </View>
            ) : null}
          </Pressable>

          {showControls ? (
            <View style={styles.controlsOverlay}>
              <LinearGradient
                colors={['rgba(0,0,0,0.68)', 'transparent', 'rgba(0,0,0,0.92)']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.topRow}>
                <View style={styles.titleBlock}>
                  <Text style={styles.playerTitle} numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text style={styles.playerSubtitle} numberOfLines={1}>
                    {video.uploader?.name ?? 'Vidorahub'}
                  </Text>
                </View>

                <Pressable
                  style={styles.qualityPill}
                  onPress={() => {
                    setShowQualityMenu((prev) => !prev);
                    revealControls();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Video quality"
                >
                  <Ionicons name="settings-outline" size={15} color={colors.white} />
                  <Text style={styles.qualityText}>{currentQualityLabel}</Text>
                </Pressable>

                {fullscreen ? (
                  <Pressable
                    style={styles.closeFullscreenBtn}
                    onPress={exitFullscreen}
                    accessibilityRole="button"
                    accessibilityLabel="Exit fullscreen"
                  >
                    <Ionicons name="close" size={22} color={colors.white} />
                  </Pressable>
                ) : null}
              </View>

              {showQualityMenu ? (
                <View style={styles.qualityMenu}>
                  <View style={styles.qualityItemActive}>
                    <Text style={styles.qualityItemText}>Auto</Text>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </View>
                  {sortedTracks.slice(0, 5).map((track) => (
                    <View key={track.id} style={styles.qualityItem}>
                      <Text style={styles.qualityItemText}>{track.size.height}p</Text>
                    </View>
                  ))}
                  <Text style={styles.qualityHint}>Adaptive playback</Text>
                </View>
              ) : null}

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
                      name={isEnded ? 'refresh' : isPlaying ? 'pause' : 'play'}
                      size={24}
                      color={colors.white}
                    />
                  </Pressable>

                  <Text style={styles.time}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Text>

                  <View style={styles.rightControls}>
                    {isEnded ? (
                      <Pressable
                        onPress={replay}
                        hitSlop={14}
                        style={styles.controlBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Replay"
                      >
                        <Ionicons name="refresh" size={21} color={colors.white} />
                      </Pressable>
                    ) : null}

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
                      onPress={fullscreen ? exitFullscreen : enterFullscreen}
                      hitSlop={14}
                      style={styles.controlBtn}
                      accessibilityRole="button"
                      accessibilityLabel={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      <Ionicons
                        name={fullscreen ? 'contract' : 'expand'}
                        size={20}
                        color={colors.white}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {playerError ? (
            <View style={styles.errorOverlay}>
              <Ionicons name="alert-circle" size={28} color={colors.white} />
              <Text style={styles.errorText}>{playerError}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {!isFullscreen ? renderPlayerSurface(false) : <View style={styles.playerGlow} />}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={exitFullscreen}
      >
        <View style={styles.fullscreenModal}>{renderPlayerSurface(true)}</View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: colors.black,
  },
  playerGlow: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: colors.black,
    ...shadows.lg,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: colors.black,
  },
  fullscreenPlayer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.black,
  },
  inner: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 2,
  },
  interactionLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  videoTapZone: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTapZoneWithControls: {
    bottom: CONTROLS_BAR_HEIGHT,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  centerPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipBtn: {
    minWidth: 56,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  skipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.white,
  },
  playIconOffset: {
    marginLeft: 3,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  topRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  playerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.white,
  },
  playerSubtitle: {
    marginTop: 1,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  qualityPill: {
    height: 32,
    minWidth: 72,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  closeFullscreenBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.white,
  },
  qualityMenu: {
    position: 'absolute',
    right: spacing.md,
    top: 46,
    minWidth: 128,
    borderRadius: radius.md,
    backgroundColor: 'rgba(12,12,16,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  qualityItem: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  qualityItemActive: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qualityItemText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.white,
  },
  qualityHint: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.55)',
  },
  controlsInner: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
  },
  bufferBar: {
    position: 'absolute',
    left: 0,
    top: 13.5,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 13.5,
    height: 4,
    backgroundColor: '#ff0033',
    borderRadius: radius.pill,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    top: 8,
    borderRadius: 8,
    backgroundColor: '#ff0033',
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    fontVariant: ['tabular-nums'],
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  errorText: {
    maxWidth: '82%',
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.white,
  },
});
