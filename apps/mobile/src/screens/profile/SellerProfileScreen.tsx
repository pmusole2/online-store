import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';
import React from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../../../../convex/_generated/api';
import { calculateDisplayPrice } from '../../hooks/useOrderTotal';
import { formatPrice } from '../../theme';
import type { Id, Product, ReviewWithReviewer, RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type Props = NativeStackScreenProps<RootStackParamList, 'SellerProfile'>;

export default function SellerProfileScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { sellerId } = route.params;

  const seller = useQuery(api.users.getUser, { userId: sellerId as Id<'users'> });
  const products = useQuery(api.products.getProductsBySeller, {
    sellerId: sellerId as Id<'users'>,
  });
  const reviews = useQuery(api.reviews.getSellerReviews, {
    sellerId: sellerId as Id<'users'>,
  });

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  if (seller === undefined) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (seller === null) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Seller not found
        </Text>
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleProductPress(item._id)}
    >
      <Card.Cover
        source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <Card.Content style={styles.productContent}>
        <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
          {item.title}
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
          {formatPrice(calculateDisplayPrice(item.price))}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderReview = ({ item }: { item: ReviewWithReviewer }) => (
    <Card style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <Avatar.Text
            size={36}
            label={item.reviewer ? `${item.reviewer.firstName[0]}${item.reviewer.lastName[0]}` : '?'}
          />
          <View style={styles.reviewInfo}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {item.reviewer ? `${item.reviewer.firstName} ${item.reviewer.lastName}` : 'Anonymous'}
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= item.rating ? 'star' : 'star-outline'}
                  size={14}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.comment && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {item.comment}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const ListHeader = () => (
    <>
      {/* Seller Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={`${seller.firstName[0]}${seller.lastName[0]}`}
          style={{ backgroundColor: theme.colors.primary }}
        />
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
          {seller.firstName} {seller.lastName}
        </Text>

        {seller.isVerified && (
          <View style={styles.verifiedBadge}>
            <Icon name="check-decagram" size={16} color={theme.colors.primary} />
            <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
              Verified Seller
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {seller.totalSales}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Sales
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Icon name="star" size={20} color="#F59E0B" />
              <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                {seller.rating?.toFixed(1) || 'N/A'}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {reviews?.length || 0} reviews
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {products?.length || 0}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Listings
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Products Section */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Products ({products?.length || 0})
      </Text>

      {products && products.length > 0 && (
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <Card
              key={product._id}
              style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleProductPress(product._id)}
            >
              <Card.Cover
                source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
              />
              <Card.Content style={styles.productContent}>
                <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
                  {product.title}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
                  {formatPrice(calculateDisplayPrice(product.price))}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Reviews Section */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Reviews ({reviews?.length || 0})
      </Text>
    </>
  );

  return (
    <FlatList
      data={reviews || []}
      renderItem={renderReview}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={[styles.listContent, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No reviews yet
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    height: 100,
  },
  productContent: {
    padding: 8,
  },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
});
