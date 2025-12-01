import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { MD3Theme, Surface, Text, useTheme } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../../../../convex/_generated/api';
import { TabHeader } from '../../components/ui/Header';
import { useAppAuth } from '../../context/AuthProvider';
import { calculateDisplayPrice } from '../../hooks/useOrderTotal';
import { formatPrice } from '../../theme';
import type { Product, RootStackParamList } from '../../types';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProductCardProps {
  product: Product;
  index: number;
  onPress: () => void;
  theme: MD3Theme;
}

function AnimatedProductCard({ product, index, onPress, theme }: ProductCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: '#10B981', bg: '#10B98120', label: 'Active', icon: 'check-circle' };
      case 'sold':
        return { color: '#6366F1', bg: '#6366F120', label: 'Sold', icon: 'tag-check' };
      case 'reserved':
        return { color: '#F59E0B', bg: '#F59E0B20', label: 'Reserved', icon: 'clock-outline' };
      case 'draft':
        return { color: '#64748B', bg: '#64748B20', label: 'Draft', icon: 'file-edit-outline' };
      default:
        return { color: '#64748B', bg: '#64748B20', label: status, icon: 'help-circle-outline' };
    }
  };

  const statusConfig = getStatusConfig(product.status);
  const hasImage = product.images && product.images.length > 0 && product.images[0];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <AnimatedPressable
        style={animatedStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Surface style={[styles.productCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardContent}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {hasImage ? (
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon name="image-outline" size={32} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text
                variant="titleMedium"
                numberOfLines={2}
                style={[styles.productTitle, { color: theme.colors.onSurface }]}
              >
                {product.title}
              </Text>

              <Text variant="titleLarge" style={[styles.productPrice, { color: theme.colors.primary }]}>
                {formatPrice(product.price)}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Buyers see: {formatPrice(calculateDisplayPrice(product.price))}
              </Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="eye-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                    {product.views || 0} views
                  </Text>
                </View>
                {product.quantity > 0 && (
                  <View style={styles.statItem}>
                    <Icon name="package-variant" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                      {product.quantity} in stock
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Chevron */}
            <View style={styles.chevronContainer}>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </View>
          </View>
        </Surface>
      </AnimatedPressable>
    </Animated.View>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  icon: string;
  colors: [string, string];
  index: number;
}

function StatCard({ value, label, icon, colors, index }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400).springify()}
      style={styles.statCardWrapper}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        <View style={styles.statCardIcon}>
          <Icon name={icon} size={20} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function SellScreen() {
  const theme = useTheme() as MD3Theme;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAppAuth();

  const myProducts = useQuery(
    api.products.getProductsBySeller,
    user ? { sellerId: user._id } : 'skip'
  );

  const handleCreateProduct = () => {
    navigation.navigate('CreateProduct');
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('EditProduct', { productId });
  };

  // Calculate stats
  const activeCount = myProducts?.filter((p) => p.status === 'active').length || 0;
  const soldCount = myProducts?.filter((p) => p.status === 'sold').length || 0;
  const totalViews = myProducts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <AnimatedProductCard
      product={item}
      index={index}
      onPress={() => handleProductPress(item._id)}
      theme={theme}
    />
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats Cards */}
      {myProducts && myProducts.length > 0 && (
        <View style={styles.statsContainer}>
          <StatCard
            value={activeCount}
            label="Active"
            icon="check-circle-outline"
            colors={['#10B981', '#059669']}
            index={0}
          />
          <StatCard
            value={soldCount}
            label="Sold"
            icon="tag-check-outline"
            colors={['#6366F1', '#4F46E5']}
            index={1}
          />
          <StatCard
            value={totalViews}
            label="Views"
            icon="eye-outline"
            colors={['#F59E0B', '#D97706']}
            index={2}
          />
        </View>
      )}

      {/* AI Tip */}
      {myProducts && myProducts.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <LinearGradient
            colors={[theme.colors.tertiaryContainer, theme.colors.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiTipCard}
          >
            <View style={[styles.aiTipIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Icon name="lightbulb-on-outline" size={22} color={theme.colors.tertiary} />
            </View>
            <View style={styles.aiTipText}>
              <Text variant="labelLarge" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '700' }}>
                AI Selling Tip
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onTertiaryContainer, opacity: 0.85, marginTop: 2 }}>
                Add multiple photos from different angles to increase sales by 40%
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.onTertiaryContainer} style={{ opacity: 0.6 }} />
          </LinearGradient>
        </Animated.View>
      )}

      {/* Section Title */}
      {myProducts && myProducts.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            Your Products
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {myProducts.length} listing{myProducts.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}
      </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header */}
      <TabHeader
        title="My Listings"
        subtitle="Manage your products"
        showAIAssistant
      />

      {/* Loading State */}
      {myProducts === undefined ? (
        <View style={styles.loadingContainer}>
          <MotiView
            from={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              opacity: { type: 'timing', duration: 1000, loop: true, repeatReverse: true },
              scale: { type: 'timing', duration: 1000, loop: true, repeatReverse: true },
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </MotiView>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading your listings...
          </Text>
        </View>
      ) : myProducts.length === 0 ? (
        /* Empty State */
        <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
          <MotiView
            from={{ opacity: 0, scale: 0.8, rotate: '-10deg' }}
            animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
            transition={{
              opacity: { type: 'spring', damping: 15 },
              scale: { type: 'spring', damping: 15 },
              rotate: { type: 'spring', damping: 15 },
            }}
          >
            <LinearGradient
              colors={[theme.colors.primaryContainer, theme.colors.secondaryContainer]}
              style={styles.emptyIcon}
            >
              <Icon name="store-plus-outline" size={56} color={theme.colors.primary} />
            </LinearGradient>
          </MotiView>

          <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Start Selling Today
          </Text>
          <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            List your first product and reach thousands of buyers in Zambia
          </Text>

          <Pressable onPress={handleCreateProduct}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButton}
            >
              <Icon name="plus" size={22} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Your First Listing</Text>
            </LinearGradient>
          </Pressable>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            {[
              { icon: 'shield-check', text: 'Secure escrow payments' },
              { icon: 'truck-fast', text: 'Nationwide shipping' },
              { icon: 'cash-multiple', text: 'Earn money fast' },
            ].map((benefit, index) => (
              <Animated.View
                key={benefit.text}
                entering={FadeInDown.delay(400 + index * 100).duration(400)}
                style={styles.benefitItem}
              >
                <Icon name={benefit.icon} size={18} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                  {benefit.text}
                </Text>
              </Animated.View>
            ))}
        </View>
        </Animated.View>
      ) : (
        /* Products List */
        <FlatList
          data={myProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader />}
        />
      )}

      {/* Floating Create Button */}
      {myProducts && myProducts.length > 0 && (
        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.fabContainer}>
          <Pressable onPress={handleCreateProduct}>
            <MotiView
              from={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                scale: { type: 'spring', damping: 10 },
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.tertiary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fab}
              >
                <Icon name="plus" size={28} color="#FFFFFF" />
              </LinearGradient>
            </MotiView>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  statCardIcon: {
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  aiTipCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTipIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiTipText: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  productCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productTitle: {
    fontWeight: '600',
    lineHeight: 22,
  },
  productPrice: {
    fontWeight: '800',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronContainer: {
    paddingLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  benefitsContainer: {
    marginTop: 40,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
});
