import { z } from "zod";
import { ShippingOptionSchema } from "./product.schema";

// Selected shipping for cart item
export const SelectedShippingSchema = z.object({
  name: z.string(),
  price: z.number().min(0),
});
export type SelectedShipping = z.infer<typeof SelectedShippingSchema>;

// Add to cart
export const AddToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  selectedShipping: SelectedShippingSchema,
});
export type AddToCart = z.infer<typeof AddToCartSchema>;

// Update cart quantity
export const UpdateCartQuantitySchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
});
export type UpdateCartQuantity = z.infer<typeof UpdateCartQuantitySchema>;

// Update cart shipping
export const UpdateCartShippingSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  selectedShipping: SelectedShippingSchema,
});
export type UpdateCartShipping = z.infer<typeof UpdateCartShippingSchema>;

// Cart item output
export const CartItemSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  selectedShipping: SelectedShippingSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  product: z
    .object({
      _id: z.string(),
      title: z.string(),
      price: z.number(),
      images: z.array(z.string()),
      quantity: z.number(),
      status: z.string(),
      sellerId: z.string(),
      sellerName: z.string(),
    })
    .optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

// Cart summary
export const CartSummarySchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  shippingTotal: z.number(),
  total: z.number(),
  itemCount: z.number(),
});
export type CartSummary = z.infer<typeof CartSummarySchema>;
