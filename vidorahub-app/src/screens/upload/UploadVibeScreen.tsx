import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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
import { colors, spacing } from '@/theme';

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const MAX_VIBE_DURATION = 60;

function VibeVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.preview}
      nativeControls
      contentFit="cover"
    />
  );
}

export function UploadVibeScreen() {
  const navigation = useNavigation();
  const { success, error: toastError } = useToast();
  const uploadMutation = useUploadVideoMutation();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dur = (asset.duration ?? 0) / 1000;
      if (dur > MAX_VIBE_DURATION) {
        Alert.alert('Too long', 'Vibes must be under 60 seconds.');
        return;
      }
      setVideoUri(asset.uri);
      setDuration(dur);
    }
  }, []);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!videoUri) {
        Alert.alert('Select a video', 'Please choose a short video first.');
        return;
      }

      try {
        await uploadMutation.mutateAsync({
          videoUri,
          videoFileName: 'vibe.mp4',
          videoContentType: 'video/mp4',
          duration,
          metadata: {
            title: data.title,
            description: data.description ?? '',
            tags: [],
            contentType: 'vibe',
            visibility: 'public',
          },
        });
        success('Vibe uploaded!');
        navigation.goBack();
      } catch (err: unknown) {
        toastError((err as { message?: string })?.message ?? 'Upload failed');
      }
    },
    [videoUri, duration, uploadMutation, success, toastError, navigation],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Button title="Select Vibe Video" onPress={pickVideo} variant="secondary" />
      {videoUri ? <VibeVideoPreview uri={videoUri} /> : null}

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
          <Input label="Description" value={value} onChangeText={onChange} onBlur={onBlur} multiline />
        )}
      />

      <Button title="Upload Vibe" onPress={handleSubmit(onSubmit)} loading={uploadMutation.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  preview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 400,
    marginVertical: spacing.lg,
    backgroundColor: colors.black,
    borderRadius: 12,
    alignSelf: 'center',
  },
});
