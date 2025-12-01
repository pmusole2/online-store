import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { differenceInHours } from 'date-fns';
import type { Product } from '../../types';
import { formatPrice } from '../../theme';
import { calculateDisplayPrice } from '../../hooks/useOrderTotal';

const isNewProduct = (timestamp: number): boolean => {
  return differenceInHours(new Date(), new Date(timestamp)) < 48;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface AnimatedProductCardProps {
  product: Product;
  index: number;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedProductCard({
  product,
  index,
  onPress,
  onFavorite,
  isFavorited = false,
}: AnimatedProductCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleFavoritePress = () => {
    favoriteScale.value = withSpring(0.7, { damping: 10, stiffness: 400 }, () => {
      favoriteScale.value = withSpring(1, { damping: 10, stiffness: 400 });
    });
    onFavorite?.();
  };

  const conditionColors: Record<string, string> = {
    new: '#10B981',
    like_new: '#3B82F6',
    good: '#8B5CF6',
    fair: '#F59E0B',
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <AnimatedPressable
        style={[styles.container, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.cardContent}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
            {product.images[0] ? (
              <Animated.Image
                source={{ uri: product.images[0] }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Icon name="image" size={32} color={theme.colors.onSurfaceVariant} />
              </View>
            )}

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              {isNewProduct(product.createdAt) && (
                <View style={styles.newBadge}>
                  <Icon name="star-four-points" size={10} color="#fff" />
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            <View
              style={[
                styles.conditionBadge,
                { backgroundColor: conditionColors[product.condition] || theme.colors.outline },
              ]}
            >
              <Text style={styles.conditionText}>
                {product.condition.replace('_', ' ').toUpperCase()}
              </Text>
              </View>
            </View>

            {/* Favorite Button */}
            {onFavorite && (
              <AnimatedPressable
                style={[styles.favoriteButton, favoriteAnimatedStyle]}
                onPress={handleFavoritePress}
              >
                <Surface style={[styles.favoriteCircle, { backgroundColor: theme.colors.surface }]} elevation={2}>
                  <Icon
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFavorited ? theme.colors.error : theme.colors.onSurfaceVariant}
                  />
                </Surface>
              </AnimatedPressable>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              variant="bodyMedium"
              numberOfLines={2}
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {product.title}
            </Text>

            <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
              {formatPrice(calculateDisplayPrice(product.price))}
            </Text>

            <View style={styles.footer}>
              {product.location && (
                <View style={styles.locationRow}>
                  <Icon name="map-marker-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
                    {product.location.city}
                  </Text>
                </View>
              )}
              <View style={styles.viewsRow}>
                <Icon name="eye-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
                  {product.views}
                </Text>
              </View>
              </View>
            </View>
          </View>
        </Surface>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Grid wrapper for product cards
export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favoriteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
