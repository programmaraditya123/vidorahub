import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useUploadVideoMutation } from '@/mutations';
import { useToast } from '@/providers/ToastProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function UploadVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.preview}
      nativeControls
      contentFit="contain"
    />
  );
}

export function UploadVideoScreen() {
  const navigation = useNavigation();
  const { success, error: toastError } = useToast();
  const uploadMutation = useUploadVideoMutation();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState('video.mp4');
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', tags: '' },
  });

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setVideoFileName(asset.fileName ?? 'video.mp4');
      setDuration((asset.duration ?? 0) / 1000);
    }
  }, []);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!videoUri) {
        Alert.alert('Select a video', 'Please choose a video file first.');
        return;
      }

      try {
        await uploadMutation.mutateAsync({
          videoUri,
          videoFileName,
          videoContentType: 'video/mp4',
          duration,
          metadata: {
            title: data.title,
            description: data.description,
            tags: data.tags?.split(',').map((t) => t.trim()).filter(Boolean) ?? [],
            contentType: 'video',
            visibility: 'public',
          },
          onProgress: setProgress,
        });
        success('Video uploaded successfully!');
        navigation.goBack();
      } catch (err: unknown) {
        toastError((err as { message?: string })?.message ?? 'Upload failed');
      }
    },
    [videoUri, videoFileName, duration, uploadMutation, success, toastError, navigation],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Button title={videoUri ? 'Change Video' : 'Select Video'} onPress={pickVideo} variant="secondary" />
      {videoUri ? <UploadVideoPreview uri={videoUri} /> : null}

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Title" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="tags"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Tags (comma separated)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      {uploadMutation.isPending ? (
        <Text style={styles.progress}>Uploading... {progress}%</Text>
      ) : null}

      <Button
        title="Upload Video"
        onPress={handleSubmit(onSubmit)}
        loading={uploadMutation.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginVertical: spacing.lg,
    backgroundColor: colors.black,
    borderRadius: 12,
  },
  progress: {
    textAlign: 'center',
    color: colors.primary,
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
});
