import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new product listing
export const createProduct = mutation({
  args: {
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    subcategoryId: v.optional(v.id("categories")),
    images: v.array(v.string()),
    condition: v.union(
      v.literal("new"),
      v.literal("like_new"),
      v.literal("good"),
      v.literal("fair")
    ),
    quantity: v.number(),
    specifications: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() }))
    ),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.object({ city: v.string(), province: v.string() })),
    shippingOptions: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        estimatedDays: v.string(),
      })
    ),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"))
    ),
  },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) throw new Error("Seller not found");
    if (seller.isBanned) throw new Error("User is banned from selling");

    return await ctx.db.insert("products", {
      ...args,
      status: args.status ?? "active",
      views: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const seller = await ctx.db.get(product.sellerId);
    const category = await ctx.db.get(product.categoryId);
    const subcategory = product.subcategoryId
      ? await ctx.db.get(product.subcategoryId)
      : null;

    return {
      ...product,
      seller: seller
        ? {
            _id: seller._id,
            firstName: seller.firstName,
            lastName: seller.lastName,
            avatar: seller.avatar,
            rating: seller.rating,
            totalSales: seller.totalSales,
          }
        : null,
      category,
      subcategory,
    };
  },
});

// Get products by seller
export const getProductsBySeller = query({
  args: {
    sellerId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sold"),
        v.literal("suspended")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.order("desc").collect();
  },
});

// Get products by category
export const getProductsByCategory = query({
  args: {
    categoryId: v.id("categories"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .take(limit + 1);

    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, -1) : products;

    const lastItem = items[items.length - 1];
    return {
      items,
      hasMore,
      nextCursor: hasMore && lastItem ? lastItem._id : null,
    };
  },
});

// Get products by subcategory
export const getProductsBySubcategory = query({
  args: {
    subcategoryId: v.id("categories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("products")
      .withIndex("by_subcategory", (q) => q.eq("subcategoryId", args.subcategoryId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .take(limit);
  },
});

// Search products
export const searchProducts = query({
  args: {
    query: v.string(),
    categoryId: v.optional(v.id("categories")),
    condition: v.optional(
      v.union(
        v.literal("new"),
        v.literal("like_new"),
        v.literal("good"),
        v.literal("fair")
      )
    ),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let searchQuery = ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => {
        let search = q.search("title", args.query);
        if (args.categoryId) {
          search = search.eq("categoryId", args.categoryId);
        }
        if (args.condition) {
          search = search.eq("condition", args.condition);
        }
        return search.eq("status", "active");
      });

    let results = await searchQuery.take(limit * 2); // Get more to filter

    // Apply price filters
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      results = results.filter((product) => {
        if (args.minPrice !== undefined && product.price < args.minPrice) {
          return false;
        }
        if (args.maxPrice !== undefined && product.price > args.maxPrice) {
          return false;
        }
        return true;
      });
    }

    return results.slice(0, limit);
  },
});

// Get recent products
export const getRecentProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("products")
      .withIndex("by_status_created", (q) => q.eq("status", "active"))
      .order("desc")
      .take(limit);
  },
});

// Get popular products (most views)
export const getPopularProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return products
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },
});

// Update product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    subcategoryId: v.optional(v.id("categories")),
    images: v.optional(v.array(v.string())),
    condition: v.optional(
      v.union(
        v.literal("new"),
        v.literal("like_new"),
        v.literal("good"),
        v.literal("fair")
      )
    ),
    quantity: v.optional(v.number()),
    specifications: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() }))
    ),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.object({ city: v.string(), province: v.string() })),
    shippingOptions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          price: v.number(),
          estimatedDays: v.string(),
        })
      )
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sold"),
        v.literal("suspended")
      )
    ),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== args.sellerId) {
      throw new Error("Unauthorized: You can only edit your own products");
    }

    const { productId, sellerId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(productId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(productId);
  },
});

// Delete product
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== args.sellerId) {
      throw new Error("Unauthorized: You can only delete your own products");
    }

    await ctx.db.delete(args.productId);
  },
});

// Increment view count
export const incrementViews = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return;

    await ctx.db.patch(args.productId, {
      views: product.views + 1,
    });
  },
});

// Mark product as sold
export const markAsSold = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== args.sellerId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.productId, {
      status: "sold",
      updatedAt: Date.now(),
    });
  },
});

// Suspend product (admin/moderator)
export const suspendProduct = mutation({
  args: {
    productId: v.id("products"),
    moderatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || (moderator.role !== "admin" && moderator.role !== "moderator")) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.productId, {
      status: "suspended",
      updatedAt: Date.now(),
    });
  },
});

// Decrease product quantity
export const decreaseQuantity = mutation({
  args: {
    productId: v.id("products"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const newQuantity = product.quantity - args.amount;
    if (newQuantity < 0) throw new Error("Insufficient quantity");

    await ctx.db.patch(args.productId, {
      quantity: newQuantity,
      status: newQuantity === 0 ? "sold" : product.status,
      updatedAt: Date.now(),
    });
  },
});

// Get products by their IDs (for AI recommendations)
export const getProductsByIds = query({
  args: {
    productIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.productIds.map(async (id) => {
        try {
          // Query products table directly to ensure proper typing
          const product = await ctx.db
            .query("products")
            .filter((q) => q.eq(q.field("_id"), id))
            .first();
          return product;
        } catch {
          return null;
        }
      })
    );

    // Filter out null values and inactive products
    return products.filter(
      (p) => p !== null && p.status === "active"
    );
  },
});

// Get products for recommendations (by category IDs)
export const getProductsByCategories = query({
  args: {
    categoryIds: v.array(v.id("categories")),
    excludeProductIds: v.optional(v.array(v.id("products"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const excludeIds = new Set(args.excludeProductIds ?? []);

    const allProducts: any[] = [];

    for (const categoryId of args.categoryIds) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(limit);

      allProducts.push(...products);
    }

    // Filter out excluded products and deduplicate
    const seen = new Set<string>();
    const uniqueProducts = allProducts.filter((p) => {
      if (excludeIds.has(p._id) || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    // Shuffle and return limited results
    return uniqueProducts
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  },
});
