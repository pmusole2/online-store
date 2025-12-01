import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View
      style={[
        {
          width: typeof width === 'number' ? width : (width as `${number}%` | 'auto'),
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          overflow: 'hidden',
        },
        style as ViewStyle,
      ]}
    >
      <Animated.View
        style={[
          { width: '100%', height: '100%', backgroundColor: theme.colors.surfaceVariant },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
      <Skeleton height={120} borderRadius={12} />
      <View style={styles.productContent}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="50%" height={20} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// Category Chip Skeleton
export function CategoryChipSkeleton() {
  return <Skeleton width={80} height={32} borderRadius={16} />;
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.orderHeader}>
        <Skeleton width="40%" height={18} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="70%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.orderFooter}>
        <Skeleton width={80} height={18} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={150} height={24} style={{ marginTop: 16 }} />
      <Skeleton width={100} height={16} style={{ marginTop: 8 }} />
    </View>
  );
}

// Chat Message Skeleton
export function ChatMessageSkeleton({ isRight = false }: { isRight?: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.chatMessage, isRight && styles.chatMessageRight]}>
      {!isRight && <Skeleton width={36} height={36} borderRadius={18} />}
      <View style={[styles.chatBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Skeleton width={180} height={14} />
        <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// List Loading Component
export function ListSkeleton({ count = 3, type = 'product' }: { count?: number; type?: 'product' | 'order' | 'chat' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (type) {
    case 'order':
      return (
        <View style={styles.list}>
          {items.map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </View>
      );
    case 'chat':
      return (
        <View style={styles.list}>
          {items.map((i) => (
            <ChatMessageSkeleton key={i} isRight={i % 2 === 1} />
          ))}
        </View>
      );
    default:
      return (
        <View style={styles.productGrid}>
          {items.map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  productCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productContent: {
    padding: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  chatMessageRight: {
    justifyContent: 'flex-end',
  },
  chatBubble: {
    padding: 12,
    borderRadius: 16,
    marginLeft: 8,
    maxWidth: '70%',
  },
  list: {
    padding: 16,
  },
});
