import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Image } from 'react-native';
import {
  Text,
  useTheme,
  Button,
  IconButton,
  Divider,
  Surface,
} from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutLeft,
  Layout,
  SlideInRight,
} from 'react-native-reanimated';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Id } from '../../types';
import { useAppAuth } from '../../context/AuthProvider';
import { formatPrice } from '../../theme';
import { calculateDisplayPrice } from '../../hooks/useOrderTotal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import { Skeleton } from '../../components/ui/Skeleton';
import { StackHeader } from '../../components/ui/Header';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

interface CartItem {
  _id: Id<'cartItems'>;
  quantity: number;
  selectedShipping: { name: string; price: number };
  product: {
    _id: Id<'products'>;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    status: string;
    sellerId: Id<'users'>;
    sellerName: string;
  };
}

export default function CartScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useAppAuth();
  const [loading, setLoading] = useState(false);

  const cart = useQuery(
    api.cart.getCart,
    user ? { userId: user._id } : 'skip'
  );

  const updateQuantity = useMutation(api.cart.updateCartQuantity);
  const removeFromCart = useMutation(api.cart.removeFromCart);
  const clearCart = useMutation(api.cart.clearCart);

  const handleQuantityChange = async (itemId: Id<'cartItems'>, newQuantity: number) => {
    if (!user || newQuantity < 1) return;

    try {
      await updateQuantity({
        cartItemId: itemId,
        userId: user._id,
        quantity: newQuantity,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRemoveItem = async (itemId: Id<'cartItems'>) => {
    if (!user) return;

    try {
      await removeFromCart({ cartItemId: itemId, userId: user._id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await clearCart({ userId: user._id });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  // Get item count for header
  const itemCount = cart?.items?.length || 0;

  // Loading state
  if (cart === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header shown even during loading */}
        <StackHeader
          title="Shopping Cart"
          subtitle="Loading..."
          onBackPress={() => navigation.goBack()}
          variant="gradient"
        />
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={80} height={80} borderRadius={12} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton width="80%" height={18} />
                <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
                <Skeleton width="30%" height={20} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header shown even when empty */}
        <StackHeader
          title="Shopping Cart"
          subtitle="0 items"
          onBackPress={() => navigation.goBack()}
          variant="gradient"
        />
        <View style={[styles.centered, { flex: 1 }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ opacity: { type: 'timing', duration: 400 }, scale: { type: 'timing', duration: 400 } }}
        >
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Icon name="cart-outline" size={64} color={theme.colors.onSurfaceVariant} />
          </View>
        </MotiView>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginTop: 24 }}>
          Your cart is empty
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}
        >
          Add auto parts to your cart to get started
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Browse' as never)}
          style={styles.browseButton}
          icon="shopping"
        >
          Browse Products
        </Button>
        </View>
      </View>
    );
  }

  const cartItems = cart.items as CartItem[];
  // Apply markup to subtotal (5% service fee is baked into prices)
  const baseSubtotal = cart.subtotal;
  const subtotal = calculateDisplayPrice(baseSubtotal);
  const shippingTotal = cart.shippingTotal;
  const total = subtotal + shippingTotal;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Futuristic Header */}
      <StackHeader
        title="Shopping Cart"
        subtitle={`${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`}
        onBackPress={() => navigation.goBack()}
        rightActions={[{ icon: 'delete-outline', onPress: handleClearCart }]}
        variant="gradient"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cartItems.map((item: CartItem, index: number) => (
            <Animated.View
              key={item._id}
              entering={FadeInDown.delay(index * 80).duration(400)}
              exiting={FadeOutLeft.duration(300)}
              layout={Layout.springify()}
            >
              <Surface style={[styles.cartItem, { backgroundColor: theme.colors.surface }]} elevation={2}>
                <View style={styles.itemContent}>
                  {/* Product Image */}
                  {item.product.images[0] ? (
                    <Image
                      source={{ uri: item.product.images[0] }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Icon name="image" size={24} color={theme.colors.onSurfaceVariant} />
                    </View>
                  )}

                  {/* Product Info */}
                  <View style={styles.itemInfo}>
                    <Text
                      variant="titleSmall"
                      numberOfLines={2}
                      style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                    >
                      {item.product.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                      Sold by {item.product.sellerName}
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 4, fontWeight: '700' }}>
                      {formatPrice(calculateDisplayPrice(item.product.price))}
                    </Text>

                    {/* Quantity Controls */}
                    <View style={styles.quantityRow}>
                      <View style={[styles.quantityControls, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <IconButton
                          icon="minus"
                          size={18}
                          onPress={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        />
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, minWidth: 24, textAlign: 'center' }}>
                          {item.quantity}
                        </Text>
                        <IconButton
                          icon="plus"
                          size={18}
                          onPress={() => handleQuantityChange(item._id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.quantity}
                        />
                      </View>
                      <IconButton
                        icon="delete-outline"
                        size={22}
                        iconColor={theme.colors.error}
                        onPress={() => handleRemoveItem(item._id)}
                      />
                    </View>
                  </View>
                </View>

                {/* Shipping Info */}
                <View style={[styles.shippingInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon name="truck-delivery" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
                    {item.selectedShipping.name} - {formatPrice(item.selectedShipping.price)}
                  </Text>
                </View>
              </Surface>
            </Animated.View>
          ))}
        </View>

        {/* AI Recommendation */}
        <Animated.View entering={FadeInDown.delay(cartItems.length * 80 + 100).duration(400)}>
          <Surface style={[styles.aiCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
            <View style={styles.aiContent}>
              <Icon name="creation" size={24} color={theme.colors.tertiary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="labelLarge" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '600' }}>
                  AI Recommendation
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onTertiaryContainer, opacity: 0.8 }}>
                  Based on your cart, you might also need brake fluid
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.tertiary} />
            </View>
          </Surface>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View entering={FadeInDown.delay(cartItems.length * 80 + 200).duration(400)}>
          <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 16 }}>
              Order Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Subtotal
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Shipping
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {formatPrice(shippingTotal)}
              </Text>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.summaryRow}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                Total
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {formatPrice(total)}
              </Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Secure Checkout Info */}
        <Animated.View entering={FadeInDown.delay(cartItems.length * 80 + 300).duration(400)} style={styles.securityInfo}>
          <Icon name="shield-check" size={16} color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
            Secure escrow payment protection
          </Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Button */}
      <Animated.View
        entering={SlideInRight.delay(200).duration(400)}
        style={[styles.checkoutBar, { backgroundColor: theme.colors.surface }]}
      >
        <View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Total
          </Text>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
            {formatPrice(total)}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handleCheckout}
          loading={loading}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutContent}
          icon="lock"
        >
          Secure Checkout
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartItem: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  checkoutButton: {
    borderRadius: 12,
    minWidth: 180,
  },
  checkoutContent: {
    paddingVertical: 6,
  },
});
