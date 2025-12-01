import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("order_placed"),
      v.literal("order_status_update"),
      v.literal("new_message"),
      v.literal("dispute_update"),
      v.literal("funds_released"),
      v.literal("new_review"),
      v.literal("product_sold"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId));

    if (args.unreadOnly) {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", args.userId).eq("isRead", false)
        );
    }

    return await notificationsQuery.order("desc").take(limit);
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return { marked: unreadNotifications.length };
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.notificationId);
  },
});

// Delete all notifications for user
export const deleteAllNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { deleted: notifications.length };
  },
});

// Helper: Create order notification for seller
export const notifyOrderPlaced = mutation({
  args: {
    sellerId: v.id("users"),
    orderNumber: v.string(),
    orderId: v.id("orders"),
    buyerName: v.string(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "order_placed",
      title: "New Order Received",
      message: `${args.buyerName} placed an order #${args.orderNumber} for ZMW ${args.totalAmount.toFixed(2)}`,
      data: { orderId: args.orderId, orderNumber: args.orderNumber },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create order status notification for buyer
export const notifyOrderStatusUpdate = mutation({
  args: {
    buyerId: v.id("users"),
    orderNumber: v.string(),
    orderId: v.id("orders"),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const statusMessages: Record<string, string> = {
      paid: "Your payment has been confirmed",
      processing: "Your order is being processed",
      shipped: "Your order has been shipped",
      delivered: "Your order has been delivered",
      completed: "Your order is complete. Thank you!",
      cancelled: "Your order has been cancelled",
    };

    return await ctx.db.insert("notifications", {
      userId: args.buyerId,
      type: "order_status_update",
      title: `Order #${args.orderNumber} Update`,
      message: statusMessages[args.newStatus] || `Status changed to ${args.newStatus}`,
      data: { orderId: args.orderId, orderNumber: args.orderNumber, status: args.newStatus },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create dispute notification
export const notifyDisputeUpdate = mutation({
  args: {
    userId: v.id("users"),
    disputeId: v.id("disputes"),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "dispute_update",
      title: args.title,
      message: args.message,
      data: { disputeId: args.disputeId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create new message notification
export const notifyNewMessage = mutation({
  args: {
    userId: v.id("users"),
    disputeId: v.id("disputes"),
    senderName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "new_message",
      title: "New Message",
      message: `${args.senderName} sent you a message`,
      data: { disputeId: args.disputeId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create funds released notification
export const notifyFundsReleased = mutation({
  args: {
    sellerId: v.id("users"),
    orderId: v.id("orders"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "funds_released",
      title: "Payment Released",
      message: `ZMW ${args.amount.toFixed(2)} has been released to your account`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create new review notification
export const notifyNewReview = mutation({
  args: {
    sellerId: v.id("users"),
    reviewerName: v.string(),
    rating: v.number(),
    productTitle: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "new_review",
      title: "New Review",
      message: `${args.reviewerName} left a ${args.rating}-star review for "${args.productTitle}"`,
      data: { rating: args.rating },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper: Create product sold notification
export const notifyProductSold = mutation({
  args: {
    sellerId: v.id("users"),
    productTitle: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "product_sold",
      title: "Product Sold",
      message: `${args.quantity}x "${args.productTitle}" has been sold`,
      data: { productId: args.productId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
