import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's cart with product details
export const getCart = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;

        const seller = await ctx.db.get(product.sellerId);

        // Use product's current shipping options instead of stored selectedShipping
        // This ensures cart reflects any updates the seller made to shipping
        const currentShipping = product.shippingOptions?.[0] || { name: 'Free Delivery', price: 0 };
        const actualShipping = {
          name: currentShipping.name,
          price: currentShipping.price,
        };

        return {
          ...item,
          // Override stored shipping with product's current shipping
          selectedShipping: actualShipping,
          product: {
            _id: product._id,
            title: product.title,
            price: product.price,
            images: product.images,
            quantity: product.quantity,
            status: product.status,
            sellerId: product.sellerId,
            sellerName: seller
              ? `${seller.firstName} ${seller.lastName}`
              : "Unknown",
            shippingOptions: product.shippingOptions,
          },
        };
      })
    );

    // Filter out null items (products that no longer exist)
    const validItems = itemsWithProducts.filter((item) => item !== null);

    // Calculate totals
    const subtotal = validItems.reduce(
      (sum, item) => sum + item!.product.price * item!.quantity,
      0
    );
    const shippingTotal = validItems.reduce(
      (sum, item) => sum + item!.selectedShipping.price,
      0
    );

    return {
      items: validItems,
      subtotal,
      shippingTotal,
      total: subtotal + shippingTotal,
      itemCount: validItems.length,
    };
  },
});

// Add item to cart
export const addToCart = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    selectedShipping: v.object({
      name: v.string(),
      price: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if product exists and is active
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.status !== "active") throw new Error("Product is not available");
    if (product.quantity < args.quantity) throw new Error("Insufficient stock");

    // Check if user is trying to buy their own product
    if (product.sellerId === args.userId) {
      throw new Error("You cannot add your own product to cart");
    }

    // Check if item already in cart
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .first();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + args.quantity;
      if (newQuantity > product.quantity) {
        throw new Error("Cannot add more than available stock");
      }

      await ctx.db.patch(existingItem._id, {
        quantity: newQuantity,
        selectedShipping: args.selectedShipping,
        updatedAt: Date.now(),
      });

      return existingItem._id;
    }

    // Add new item
    return await ctx.db.insert("cartItems", {
      userId: args.userId,
      productId: args.productId,
      quantity: args.quantity,
      selectedShipping: args.selectedShipping,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update cart item quantity
export const updateCartQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    userId: v.id("users"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Cart item not found");
    if (cartItem.userId !== args.userId) throw new Error("Unauthorized");

    if (args.quantity <= 0) {
      // Remove item if quantity is 0 or less
      await ctx.db.delete(args.cartItemId);
      return null;
    }

    // Check stock
    const product = await ctx.db.get(cartItem.productId);
    if (!product) throw new Error("Product not found");
    if (args.quantity > product.quantity) {
      throw new Error("Cannot add more than available stock");
    }

    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.cartItemId);
  },
});

// Update cart item shipping option
export const updateCartShipping = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    userId: v.id("users"),
    selectedShipping: v.object({
      name: v.string(),
      price: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Cart item not found");
    if (cartItem.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.cartItemId, {
      selectedShipping: args.selectedShipping,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.cartItemId);
  },
});

// Remove item from cart
export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Cart item not found");
    if (cartItem.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.cartItemId);
  },
});

// Clear user's cart
export const clearCart = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});

// Get cart item count
export const getCartCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return cartItems.length;
  },
});

// Validate cart items (check stock and status before checkout)
export const validateCart = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const issues: { productId: string; issue: string }[] = [];

    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);

      if (!product) {
        issues.push({ productId: item.productId, issue: "Product no longer exists" });
        continue;
      }

      if (product.status !== "active") {
        issues.push({ productId: item.productId, issue: "Product is no longer available" });
        continue;
      }

      if (product.quantity < item.quantity) {
        issues.push({
          productId: item.productId,
          issue: `Only ${product.quantity} items available`,
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      itemCount: cartItems.length,
    };
  },
});

// Get cart items grouped by seller (for checkout)
export const getCartBySeller = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sellerGroups: Record<
      string,
      {
        sellerId: string;
        sellerName: string;
        items: Array<{
          _id: string;
          productId: string;
          quantity: number;
          selectedShipping: { name: string; price: number };
          product: {
            _id: string;
            title: string;
            price: number;
            images: string[];
            quantity: number;
          };
        }>;
        subtotal: number;
        shippingTotal: number;
      }
    > = {};

    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product || product.status !== "active") continue;

      const sellerId = product.sellerId;

      // Use product's current shipping options
      const currentShipping = product.shippingOptions?.[0] || { name: 'Free Delivery', price: 0 };

      if (!sellerGroups[sellerId]) {
        const seller = await ctx.db.get(sellerId);
        sellerGroups[sellerId] = {
          sellerId,
          sellerName: seller ? `${seller.firstName} ${seller.lastName}` : "Unknown",
          items: [],
          subtotal: 0,
          shippingTotal: 0,
        };
      }

      sellerGroups[sellerId].items.push({
        ...item,
        selectedShipping: { name: currentShipping.name, price: currentShipping.price },
        product: {
          _id: product._id,
          title: product.title,
          price: product.price,
          images: product.images,
          quantity: product.quantity,
        },
      });
      sellerGroups[sellerId].subtotal += product.price * item.quantity;
      sellerGroups[sellerId].shippingTotal += currentShipping.price;
    }

    return Object.values(sellerGroups);
  },
});
