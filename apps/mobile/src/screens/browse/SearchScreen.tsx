import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Text, Searchbar, useTheme, ActivityIndicator, Card, Chip, Menu, Button } from 'react-native-paper';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Product, ProductCondition, Id } from '../../types';
import { formatPrice } from '../../theme';
import { calculateDisplayPrice } from '../../hooks/useOrderTotal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

type SortOption = 'newest' | 'price_asc' | 'price_desc';
type ConditionFilter = 'all' | ProductCondition;

export default function SearchScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { query: initialQuery, categoryId } = route.params || {};

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [condition, setCondition] = useState<ConditionFilter>('all');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const searchResults = useQuery(
    api.products.searchProducts,
    searchQuery.trim()
      ? {
          query: searchQuery,
          categoryId: categoryId ? (categoryId as Id<'categories'>) : undefined,
          condition: condition === 'all' ? undefined : condition,
          limit: 50,
        }
      : 'skip'
  );

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

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
        <View style={styles.productMeta}>
          <Chip compact mode="flat" style={styles.conditionChip}>
            {item.condition.replace('_', ' ')}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  const conditionOptions: { value: ConditionFilter; label: string }[] = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              icon="sort"
              compact
              style={styles.filterButton}
            >
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </Button>
          }
        >
          {sortOptions.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setSortBy(option.value);
                setSortMenuVisible(false);
              }}
              title={option.label}
            />
          ))}
        </Menu>

        <FlatList
          horizontal
          data={conditionOptions}
          renderItem={({ item }) => (
            <Chip
              mode={condition === item.value ? 'flat' : 'outlined'}
              selected={condition === item.value}
              onPress={() => setCondition(item.value)}
              style={styles.conditionFilterChip}
            >
              {item.label}
            </Chip>
          )}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.conditionFilters}
        />
      </View>

      {/* Results */}
      {!searchQuery.trim() ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Enter a search term
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Search for products by name or description
          </Text>
        </View>
      ) : searchResults === undefined ? (
        <ActivityIndicator style={styles.loader} />
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            No products found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              {searchResults.length} results
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    borderRadius: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  conditionFilters: {
    gap: 8,
  },
  conditionFilterChip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    height: 120,
  },
  productContent: {
    padding: 8,
  },
  productMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  conditionChip: {
    height: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
