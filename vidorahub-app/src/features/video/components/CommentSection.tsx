import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCommentsQuery, usePostCommentMutation } from '@/queries';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { AuthModal } from '@/components/shared/AuthModal';
import { Loader } from '@/components/ui/Loader';
import { colors, radius, spacing, typography } from '@/theme';
import type { Comment } from '@/types';
import type { MainStackParamList } from '@/navigation/types';

type Props = {
  videoId: string;
  embedded?: boolean;
};

export function CommentSection({ videoId, embedded = false }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [text, setText] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useCommentsQuery(videoId);
  const postMutation = usePostCommentMutation(videoId);

  const comments: Comment[] = data?.data ?? [];

  const handlePost = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      await postMutation.mutateAsync(content);
    } catch {
      setShowAuth(true);
    }
  }, [isAuthenticated, text, postMutation]);

  return (
    <View style={[styles.wrapper, embedded && styles.embedded]}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={
            isAuthenticated ? 'Share your thoughts…' : 'Sign in to leave a comment…'
          }
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          multiline
          accessibilityLabel="Comment input"
        />
        <Pressable
          style={styles.sendBtn}
          onPress={handlePost}
          disabled={postMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </Pressable>
      </View>

      {isLoading ? (
        <Loader size="small" />
      ) : (
        <View style={styles.commentList}>
          {comments.map((c) => (
            <View key={c._id} style={styles.commentRow}>
              <Avatar
                name={c.user.name}
                uri={c.user.profilePicUrl ?? c.user.avatar}
                size={36}
              />
              <View
                style={[styles.bubble, c.optimistic && styles.optimistic]}
              >
                <View style={styles.meta}>
                  <Text style={styles.username}>{c.user.name}</Text>
                  <Text style={styles.time}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.text}>{c.content}</Text>
              </View>
            </View>
          ))}

          {comments.length === 0 ? (
            <Text style={styles.empty}>No comments yet. Be the first!</Text>
          ) : null}
        </View>
      )}

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        onLogin={() => {
          setShowAuth(false);
          navigation.navigate('Login');
        }}
        onSignup={() => {
          setShowAuth(false);
          navigation.navigate('Signup');
        }}
        message="Sign in to join the conversation."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  embedded: {
    padding: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxHeight: 120,
    color: colors.textPrimary,
    backgroundColor: colors.bgSubtle,
    fontSize: typography.sizes.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentList: {
    gap: spacing.lg,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optimistic: {
    opacity: 0.6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.textFaint,
  },
  text: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    lineHeight: 20,
  },
  empty: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
