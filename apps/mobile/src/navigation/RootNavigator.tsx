import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAppAuth } from '../context/AuthProvider';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import CreateProductScreen from '../screens/product/CreateProductScreen';
import EditProductScreen from '../screens/product/EditProductScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import DisputeDetailScreen from '../screens/disputes/DisputeDetailScreen';
import CreateDisputeScreen from '../screens/disputes/CreateDisputeScreen';
import ChatScreen from '../screens/disputes/ChatScreen';
import DisputesListScreen from '../screens/disputes/DisputesListScreen';
import SellerProfileScreen from '../screens/profile/SellerProfileScreen';
import ConversationsListScreen from '../screens/conversations/ConversationsListScreen';
import ConversationChatScreen from '../screens/conversations/ConversationChatScreen';
import SearchScreen from '../screens/browse/SearchScreen';
import CategoryProductsScreen from '../screens/browse/CategoryProductsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isSignedIn } = useAppAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        // Disable all default headers - we use custom headers in each screen
        headerShown: false,
        // Modern slide animation
        animation: 'slide_from_right',
        // Gesture handling
        gestureEnabled: true,
        // Full screen gesture for iOS
        fullScreenGestureEnabled: true,
      }}
    >
      {isSignedIn ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="CreateProduct"
            component={CreateProductScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="EditProduct"
            component={EditProductScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
          />
          <Stack.Screen
            name="DisputeDetail"
            component={DisputeDetailScreen}
          />
          <Stack.Screen
            name="CreateDispute"
            component={CreateDisputeScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
          />
          <Stack.Screen
            name="SellerProfile"
            component={SellerProfileScreen}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="CategoryProducts"
            component={CategoryProductsScreen}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
          />
          <Stack.Screen
            name="Conversations"
            component={ConversationsListScreen}
          />
          <Stack.Screen
            name="ConversationChat"
            component={ConversationChatScreen}
          />
          <Stack.Screen
            name="Disputes"
            component={DisputesListScreen}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              animation: 'slide_from_bottom',
              gestureDirection: 'vertical',
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </Stack.Navigator>
  );
}
