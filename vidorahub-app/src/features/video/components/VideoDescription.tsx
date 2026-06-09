import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  views: string;
  uploaded: string;
  hashtags?: string[];
  description: string;
};

export function VideoDescription({
  views,
  uploaded,
  hashtags,
  description,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.header}>Resources &amp; Info</Text>

      <View style={styles.descriptionBox}>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{views} views</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.stat}>{uploaded}</Text>
        </View>

        {hashtags && hashtags.length > 0 ? (
          <View style={styles.tags}>
            {hashtags.map((tag, i) => (
              <Text key={`${tag}-${i}`} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}

        <Text
          style={styles.text}
          numberOfLines={expanded ? undefined : 3}
        >
          {description || 'No description provided.'}
        </Text>

        <Pressable
          style={styles.readMore}
          onPress={() => setExpanded((e) => !e)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Read more'}
        >
          <Text style={styles.readMoreText}>
            {expanded ? 'SHOW LESS' : 'READ MORE'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  header: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  descriptionBox: {
    backgroundColor: colors.bgMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stat: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dot: {
    color: colors.textFaint,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  text: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  readMoreText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
});
