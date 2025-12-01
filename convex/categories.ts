import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all parent categories (no parentId)
export const getParentCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", undefined))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get all categories (including inactive, for admin)
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Get subcategories by parent ID
export const getSubcategories = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get category by slug
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get category by ID
export const getCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

// Get category with subcategories
export const getCategoryWithSubcategories = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) return null;

    const subcategories = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.categoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...category,
      subcategories,
    };
  },
});

// Get all categories with their subcategories (for navigation)
export const getCategoriesTree = query({
  args: {},
  handler: async (ctx) => {
    const allCategories = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get parent categories
    const parents = allCategories
      .filter((cat) => !cat.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Build tree structure
    return parents.map((parent) => ({
      ...parent,
      subcategories: allCategories
        .filter((cat) => cat.parentId === parent._id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  },
});

// Create category (admin only)
export const createCategory = mutation({
  args: {
    adminId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create categories");
    }

    // Check if slug already exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Category with this slug already exists");
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      image: args.image,
      parentId: args.parentId,
      isActive: true,
      sortOrder: args.sortOrder ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update category (admin only)
export const updateCategory = mutation({
  args: {
    adminId: v.id("users"),
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update categories");
    }

    const { adminId, categoryId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // If updating slug, check it doesn't already exist
    if (updates.slug) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();

      if (existing && existing._id !== categoryId) {
        throw new Error("Category with this slug already exists");
      }
    }

    await ctx.db.patch(categoryId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(categoryId);
  },
});

// Delete category (admin only)
export const deleteCategory = mutation({
  args: {
    adminId: v.id("users"),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete categories");
    }

    // Check for subcategories
    const subcategories = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.categoryId))
      .first();

    if (subcategories) {
      throw new Error("Cannot delete category with subcategories");
    }

    // Check for products in this category
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .first();

    if (products) {
      throw new Error("Cannot delete category with products");
    }

    await ctx.db.delete(args.categoryId);
  },
});

// Seed initial categories
export const seedCategories = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can seed categories");
    }

    // Check if categories already exist
    const existing = await ctx.db.query("categories").first();
    if (existing) {
      throw new Error("Categories already seeded");
    }

    const categoriesData = [
      {
        name: "Auto Parts",
        slug: "auto-parts",
        description: "Vehicle parts and components",
        subcategories: [
          { name: "Engine Parts", slug: "engine-parts", description: "Engine components and accessories" },
          { name: "Suspension", slug: "suspension", description: "Suspension systems and parts" },
          { name: "Brakes", slug: "brakes", description: "Brake systems and components" },
          { name: "Electrical", slug: "electrical", description: "Electrical systems and parts" },
          { name: "Body Parts", slug: "body-parts", description: "Vehicle body panels and parts" },
          { name: "Oils & Lubricants", slug: "oils-lubricants", description: "Engine oils, transmission fluids, and lubricants" },
          { name: "Filters", slug: "filters", description: "Air, oil, fuel, and cabin filters" },
          { name: "Transmission", slug: "transmission", description: "Transmission parts and components" },
        ],
      },
      {
        name: "Car Accessories",
        slug: "car-accessories",
        description: "Vehicle accessories and add-ons",
        subcategories: [
          { name: "Interior", slug: "interior", description: "Interior accessories and upgrades" },
          { name: "Exterior", slug: "exterior", description: "Exterior accessories and styling" },
          { name: "Car Electronics", slug: "car-electronics", description: "Audio, GPS, and electronic accessories" },
          { name: "Car Care", slug: "car-care", description: "Cleaning and maintenance products" },
        ],
      },
      {
        name: "Tech & Electronics",
        slug: "tech-electronics",
        description: "Technology and electronic devices",
        subcategories: [
          { name: "Phones", slug: "phones", description: "Mobile phones and smartphones" },
          { name: "Laptops", slug: "laptops", description: "Laptops and notebooks" },
          { name: "Tablets", slug: "tablets", description: "Tablets and e-readers" },
          { name: "Tech Accessories", slug: "tech-accessories", description: "Chargers, cases, and accessories" },
          { name: "Gaming", slug: "gaming", description: "Gaming consoles and accessories" },
        ],
      },
      {
        name: "General",
        slug: "general",
        description: "General items and miscellaneous",
        subcategories: [
          { name: "Home & Garden", slug: "home-garden", description: "Home improvement and garden items" },
          { name: "Fashion", slug: "fashion", description: "Clothing and fashion accessories" },
          { name: "Sports", slug: "sports", description: "Sports equipment and gear" },
          { name: "Other", slug: "other", description: "Other items" },
        ],
      },
    ];

    const now = Date.now();
    let sortOrder = 0;

    for (const category of categoriesData) {
      const parentId = await ctx.db.insert("categories", {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: true,
        sortOrder: sortOrder++,
        createdAt: now,
        updatedAt: now,
      });

      let subSortOrder = 0;
      for (const sub of category.subcategories) {
        await ctx.db.insert("categories", {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          parentId,
          isActive: true,
          sortOrder: subSortOrder++,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true, message: "Categories seeded successfully" };
  },
});
