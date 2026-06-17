import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Image } from '@/components/native/Image';
import Video, { type VideoRef } from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppBottomNavigationBar, APP_BOTTOM_BAR_HEIGHT } from '@/components/shared/AppBottomNavigationBar';
import { useUploadVideoMutation } from '@/mutations';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Keep title under 120 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Keep description under 2000 characters'),
  tagInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type ContentType = 'video' | 'vibe';

type SelectedAsset = {
  uri: string;
  fileName: string;
  mimeType: string;
  duration: number;
  sizeMb?: number;
};

type VisualItem = {
  id: string;
  uri?: string;
  videoUri?: string;
  time?: number;
  label: string;
  isCustom?: boolean;
};

type CustomThumbnail = Asset & {
  visualId: string;
};

const DEFAULT_CATEGORY = 'general';

function UploadPreview({ uri, contentType }: { uri: string; contentType: ContentType }) {
  return (
    <Video
      source={{ uri }}
      style={contentType === 'vibe' ? styles.vibePreview : styles.videoPreview}
      controls
      paused
      resizeMode={contentType === 'vibe' ? 'cover' : 'contain'}
    />
  );
}

function FramePreview({ uri, time }: { uri: string; time: number }) {
  const videoRef = useRef<VideoRef>(null);

  const seekPreview = useCallback(() => {
    videoRef.current?.seek(Math.max(0, time));
  }, [time]);

  return (
    <Video
      ref={videoRef}
      source={{ uri }}
      style={styles.visualImage}
      paused
      muted
      resizeMode="cover"
      onLoad={seekPreview}
    />
  );
}

function KineticPlayerPreview({
  uri,
  contentType,
  durationLabel,
  fileName,
}: {
  uri: string;
  contentType: ContentType;
  durationLabel: string;
  fileName: string;
}) {
  return (
    <LinearGradient
      colors={['#17122a', '#2b1551', '#120f1f']}
      style={styles.kineticStage}
    >
      <View style={styles.stageHeader}>
        <View>
          <Text style={styles.stageEyebrow}>Preview Studio</Text>
          <Text style={styles.stageTitle}>{contentType === 'vibe' ? 'Vibe Cut' : 'Video Cut'}</Text>
        </View>
        <View style={styles.stageBadge}>
          <Ionicons name="time-outline" size={14} color={colors.white} />
          <Text style={styles.stageBadgeText}>{durationLabel}</Text>
        </View>
      </View>

      <View style={styles.previewShell}>
        <UploadPreview uri={uri} contentType={contentType} />
      </View>

      <View style={styles.filePill}>
        <Ionicons name="document-attach-outline" size={16} color={colors.white} />
        <Text style={styles.filePillText} numberOfLines={1}>{fileName}</Text>
      </View>
    </LinearGradient>
  );
}

function VisualCarousel({
  items,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: {
  items: VisualItem[];
  selectedId: string;
  onSelect: (item: VisualItem) => void;
  onAdd: () => void;
  onDelete: (item: VisualItem) => void;
}) {
  return (
    <View style={styles.carouselCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.carouselHeading}>
          <Text style={styles.sectionTitle}>Visual Carousel</Text>
          <Text style={styles.sectionHint}>AI Suggestions Ready</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselTrack}>
        {items.map((item) => {
          const selected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.visualTile, selected && styles.visualTileActive]}
              onPress={() => onSelect(item)}
            >
              {item.uri ? (
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.visualImage, !selected && styles.visualImageMuted]}
                  contentFit="cover"
                />
              ) : item.videoUri ? (
                <View style={[styles.visualImage, !selected && styles.visualImageMuted]}>
                  <FramePreview uri={item.videoUri} time={item.time ?? 0} />
                </View>
              ) : (
                <LinearGradient
                  colors={['#7c3aed', '#ec4899']}
                  style={[styles.visualFallback, !selected && styles.visualImageMuted]}
                >
                  <Ionicons name="play" size={22} color={colors.white} />
                </LinearGradient>
              )}
              {selected ? (
                <View style={styles.currentTag}>
                  <Text style={styles.currentTagText}>CURRENT</Text>
                </View>
              ) : null}
              {item.isCustom ? (
                <Pressable
                  style={styles.deleteVisualBtn}
                  onPress={(event) => {
                    event.stopPropagation();
                    onDelete(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.white} />
                </Pressable>
              ) : null}
              <View style={styles.visualOverlay}>
                <Text style={styles.visualLabel} numberOfLines={1}>{item.label}</Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable style={styles.addCustomTile} onPress={onAdd}>
          <Ionicons name="image-outline" size={28} color={colors.primary} />
          <Text style={styles.addCustomText}>Custom</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function UploadContentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'UploadDetails'>>();
  const insets = useSafeAreaInsets();
  const { success, error: toastError, show } = useToast();
  const uploadMutation = useUploadVideoMutation();
  const tagInputRef = useRef<TextInput>(null);

  const [customThumbnails, setCustomThumbnails] = useState<CustomThumbnail[]>([]);
  const [selectedVisualId, setSelectedVisualId] = useState('frame-first');
  const [tags, setTags] = useState<string[]>(['trending']);
  const [addingTag, setAddingTag] = useState(false);
  const [progress, setProgress] = useState(0);

  const contentType = route.params.contentType;
  const isVibe = contentType === 'vibe';
  const selectedVideo: SelectedAsset = useMemo(
    () => ({
      uri: route.params.videoUri,
      fileName: route.params.videoFileName,
      mimeType: route.params.videoContentType,
      duration: route.params.duration,
      sizeMb: route.params.sizeMb,
    }),
    [route.params],
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', tagInput: '' },
  });

  const description = watch('description');
  const tagInput = watch('tagInput');

  const durationLabel = useMemo(() => {
    const mins = Math.floor(selectedVideo.duration / 60);
    const secs = Math.round(selectedVideo.duration % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  }, [selectedVideo]);

  const visualItems = useMemo<VisualItem[]>(() => {
    const endTime = Math.max(0, selectedVideo.duration - 0.25);
    return [
      { id: 'frame-first', videoUri: selectedVideo.uri, time: 0, label: 'First scene' },
      {
        id: 'frame-middle',
        videoUri: selectedVideo.uri,
        time: Math.max(0, selectedVideo.duration / 2),
        label: 'Middle scene',
      },
      { id: 'frame-last', videoUri: selectedVideo.uri, time: endTime, label: 'Last scene' },
      ...customThumbnails.map((asset, index) => ({
        id: asset.visualId,
        uri: asset.uri,
        label: `Custom ${index + 1}`,
        isCustom: true,
      })),
    ];
  }, [customThumbnails, selectedVideo.duration, selectedVideo.uri]);

  const selectedVisual = visualItems.find((item) => item.id === selectedVisualId) ?? visualItems[0];
  const selectedCustomThumbnail = customThumbnails.find((asset) => asset.visualId === selectedVisual?.id);

  const resolveThumbnail = useCallback(async () => {
    if (selectedVisual?.isCustom && selectedCustomThumbnail) {
      return {
        uri: selectedCustomThumbnail.uri,
        fileName: selectedCustomThumbnail.fileName ?? 'thumbnail.jpg',
        contentType: selectedCustomThumbnail.type ?? 'image/jpeg',
      };
    }

    if (selectedVisual?.videoUri) {
      const generated = await createThumbnail({
        url: selectedVisual.videoUri,
        timeStamp: Math.max(0, Math.round((selectedVisual.time ?? 0) * 1000)),
      });

      return {
        uri: generated.path,
        fileName: `${selectedVisual.id}.jpg`,
        contentType: 'image/jpeg',
      };
    }

    return undefined;
  }, [selectedCustomThumbnail, selectedVisual]);

  const pickThumbnail = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
      quality: 0.9,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const stamp = Date.now();
      const nextAssets = result.assets.map((asset, index) => ({
        ...asset,
        visualId: `custom-${stamp}-${index}`,
      }));
      setCustomThumbnails((current) => [...current, ...nextAssets]);
      setSelectedVisualId(nextAssets[0].visualId);
    }
  }, []);

  const selectVisual = useCallback((item: VisualItem) => {
    setSelectedVisualId(item.id);
  }, []);

  const deleteVisual = useCallback((item: VisualItem) => {
    if (!item.isCustom) return;
    setCustomThumbnails((current) => current.filter((asset) => asset.visualId !== item.id));
    setSelectedVisualId((current) => (current === item.id ? 'frame-first' : current));
  }, []);

  const addTag = useCallback(() => {
    const cleaned = tagInput?.trim().replace(/\s+/g, '').replace(/^#/, '');
    if (!cleaned) {
      setAddingTag(false);
      setValue('tagInput', '');
      return;
    }
    if (!tags.includes(cleaned)) {
      setTags((current) => [...current, cleaned]);
    }
    setAddingTag(false);
    setValue('tagInput', '');
  }, [setValue, tagInput, tags]);

  const openTagInput = useCallback(() => {
    setAddingTag(true);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }, []);

  const removeTag = useCallback((tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  }, []);

  const submit = useCallback(
    async (data: FormData) => {
      if (!tags.length) {
        show('Add at least one tag.');
        return;
      }

      try {
        setProgress(0);
        const thumbnailAsset = await resolveThumbnail();
        await uploadMutation.mutateAsync({
          videoUri: selectedVideo.uri,
          videoFileName: selectedVideo.fileName,
          videoContentType: selectedVideo.mimeType,
          thumbnailUri: thumbnailAsset?.uri,
          thumbnailFileName: thumbnailAsset?.fileName,
          thumbnailContentType: thumbnailAsset?.contentType,
          duration: selectedVideo.duration,
          metadata: {
            title: data.title.trim(),
            description: data.description.trim(),
            tags,
            category: DEFAULT_CATEGORY,
            contentType,
            visibility: 'public',
          },
          onProgress: setProgress,
        });
        success(isVibe ? 'Vibe uploaded successfully!' : 'Video uploaded successfully!');
        navigation.navigate('Tabs', { screen: 'ProfileTab' });
      } catch (err: unknown) {
        toastError((err as { message?: string })?.message ?? 'Upload failed.');
      }
    },
    [
      contentType,
      isVibe,
      navigation,
      resolveThumbnail,
      selectedVideo,
      success,
      tags,
      toastError,
      uploadMutation,
      show,
    ],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: APP_BOTTOM_BAR_HEIGHT + insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <KineticPlayerPreview
          uri={selectedVideo.uri}
          contentType={contentType}
          durationLabel={durationLabel}
          fileName={selectedVideo.fileName}
        />

        <VisualCarousel
          items={visualItems}
          selectedId={selectedVisualId}
          onSelect={selectVisual}
          onAdd={pickThumbnail}
          onDelete={deleteVisual}
        />

        <View style={styles.detailsCard}>
          <View style={styles.uploadDetailsHeading}>
            <Ionicons name="brush-outline" size={22} color={colors.primary} />
            <Text style={styles.uploadDetailsTitle}>Upload Details</Text>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Title"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={isVibe ? 'Name this vibe' : 'Enter video title'}
                maxLength={120}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Description"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={isVibe ? 'Describe the vibe' : 'Describe the video'}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                style={styles.descriptionInput}
                error={errors.description?.message}
              />
            )}
          />
          <Text style={styles.charCount}>{description?.length ?? 0}/2000</Text>

          <Text style={styles.fieldLabel}>Tags</Text>
          <View style={styles.tagsBox}>
            {tags.map((tag, index) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
                <Pressable
                  style={styles.tagRemoveBtn}
                  onPress={() => removeTag(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                >
                  <Ionicons name="close" size={14} color={colors.primary} />
                </Pressable>
              </View>
            ))}

            {addingTag ? (
              <Controller
                control={control}
                name="tagInput"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    ref={tagInputRef}
                    value={value}
                    onChangeText={onChange}
                    onBlur={addTag}
                    onSubmitEditing={addTag}
                    placeholder="Tag name"
                    placeholderTextColor={colors.textFaint}
                    maxLength={30}
                    autoCapitalize="none"
                    returnKeyType="done"
                    style={styles.inlineTagInput}
                  />
                )}
              />
            ) : (
              <Pressable style={styles.tagAddBtn} onPress={openTagInput} accessibilityRole="button">
                <Text style={styles.tagAddText}>+ Add Bubble</Text>
              </Pressable>
            )}
          </View>
          <Button
            title={isVibe ? 'Publish Vibe' : 'Publish Video'}
            onPress={handleSubmit(submit)}
            loading={uploadMutation.isPending}
            style={styles.publishButton}
          />
        </View>
      </ScrollView>

      <AppBottomNavigationBar />

      <Modal visible={uploadMutation.isPending} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.progressBox}>
            <Text style={styles.progressTitle}>
              {isVibe ? 'Uploading Vibe...' : 'Uploading Video...'}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(progress, 4)}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgSubtle },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  kineticStage: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stageEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stageTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stageBadgeText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  previewShell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: colors.black,
  },
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filePillText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  carouselCard: {
    marginTop: 0,
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: '#181124',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...shadows.sm,
  },
  carouselHeading: {
    flex: 1,
  },
  sectionHint: {
    color: '#a855f7',
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  carouselTrack: {
    gap: spacing.md,
    paddingRight: spacing.lg,
    paddingBottom: spacing.xs,
  },
  visualTile: {
    width: 180,
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(60,35,72,0.25)',
  },
  visualTileActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  visualImageMuted: {
    opacity: 0.55,
  },
  visualFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTag: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  currentTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  deleteVisualBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  visualOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: spacing.sm,
  },
  visualLabel: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  addCustomTile: {
    width: 180,
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(124,58,237,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  addCustomText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  vibePreview: {
    width: '72%',
    maxWidth: 320,
    aspectRatio: 9 / 16,
    backgroundColor: colors.black,
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  detailsCard: {
    marginTop: 0,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  uploadDetailsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  uploadDetailsTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: '800',
  },
  descriptionInput: {
    minHeight: 118,
  },
  charCount: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    textAlign: 'right',
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  tagsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagRemoveBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  inlineTagInput: {
    minWidth: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  tagAddBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagAddText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '800',
  },
  publishButton: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  progressBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  progressTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: '800',
    marginTop: spacing.md,
  },
});





