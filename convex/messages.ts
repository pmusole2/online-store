import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send message in dispute conversation
export const sendMessage = mutation({
  args: {
    disputeId: v.id("disputes"),
    senderId: v.id("users"),
    content: v.string(),
    originalContent: v.optional(v.string()), // if AI suggested rephrasing
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video")),
          url: v.string(),
        })
      )
    ),
    aiRephraseAccepted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    // Verify sender is participant or moderator
    const sender = await ctx.db.get(args.senderId);
    if (!sender) throw new Error("Sender not found");

    const isParticipant =
      dispute.buyerId === args.senderId || dispute.sellerId === args.senderId;
    const isModerator =
      sender.role === "moderator" || sender.role === "admin";
    const isAssignedModerator = dispute.moderatorId === args.senderId;

    if (!isParticipant && !isModerator) {
      throw new Error("Unauthorized: You are not a participant in this dispute");
    }

    // Don't allow messages in resolved/closed disputes
    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("Cannot send messages to resolved or closed disputes");
    }

    // If it's the first message from either party after opening, update status
    if (dispute.status === "open") {
      await ctx.db.patch(args.disputeId, {
        status: "in_discussion",
        updatedAt: Date.now(),
      });
    }

    const messageId = await ctx.db.insert("messages", {
      disputeId: args.disputeId,
      senderId: args.senderId,
      content: args.content,
      originalContent: args.originalContent,
      attachments: args.attachments,
      isSystemMessage: false,
      aiRephraseAccepted: args.aiRephraseAccepted,
      createdAt: Date.now(),
    });

    // Update dispute updatedAt
    await ctx.db.patch(args.disputeId, {
      updatedAt: Date.now(),
    });

    // Notify the other party about the new message
    const senderName = `${sender.firstName} ${sender.lastName}`;
    const recipientId = args.senderId === dispute.buyerId
      ? dispute.sellerId
      : dispute.buyerId;

    // Don't notify if sender is moderator messaging (they'll see it)
    if (isParticipant) {
      await ctx.db.insert("notifications", {
        userId: recipientId,
        type: "new_message",
        title: "New Dispute Message",
        message: `${senderName} sent a message in your dispute`,
        data: { disputeId: args.disputeId },
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return messageId;
  },
});

// Get messages for a dispute (realtime subscription)
export const getMessages = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_dispute_created", (q) => q.eq("disputeId", args.disputeId))
      .order("asc")
      .collect();

    // Add sender info to each message
    return await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender
            ? {
                _id: sender._id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                avatar: sender.avatar,
                role: sender.role,
              }
            : null,
        };
      })
    );
  },
});

// Get messages with pagination
export const getMessagesPaginated = query({
  args: {
    disputeId: v.id("disputes"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_dispute_created", (q) => q.eq("disputeId", args.disputeId))
      .order("desc")
      .take(limit + 1);

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    // Reverse to get chronological order
    items.reverse();

    // Add sender info
    const messagesWithSenders = await Promise.all(
      items.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender
            ? {
                _id: sender._id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                avatar: sender.avatar,
                role: sender.role,
              }
            : null,
        };
      })
    );

    const firstItem = items[0];
    return {
      messages: messagesWithSenders,
      hasMore,
      nextCursor: hasMore && firstItem ? firstItem._id : null,
    };
  },
});

// Get message count for dispute
export const getMessageCount = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .collect();

    return messages.length;
  },
});

// Get last message for dispute (for preview in list)
export const getLastMessage = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_dispute_created", (q) => q.eq("disputeId", args.disputeId))
      .order("desc")
      .take(1);

    const message = messages[0];
    if (!message) return null;

    const sender = await ctx.db.get(message.senderId);

    return {
      ...message,
      sender: sender
        ? {
            _id: sender._id,
            firstName: sender.firstName,
            lastName: sender.lastName,
          }
        : null,
    };
  },
});

// Add system message
export const addSystemMessage = mutation({
  args: {
    disputeId: v.id("disputes"),
    content: v.string(),
    senderId: v.id("users"), // Usually the system/moderator
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      disputeId: args.disputeId,
      senderId: args.senderId,
      content: args.content,
      isSystemMessage: true,
      createdAt: Date.now(),
    });
  },
});

// Get all messages for AI analysis
export const getMessagesForAnalysis = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_dispute_created", (q) => q.eq("disputeId", args.disputeId))
      .order("asc")
      .collect();

    const buyer = await ctx.db.get(dispute.buyerId);
    const seller = await ctx.db.get(dispute.sellerId);

    return {
      dispute: {
        title: dispute.title,
        description: dispute.description,
        category: dispute.category,
        status: dispute.status,
      },
      participants: {
        buyer: buyer
          ? { _id: buyer._id, name: `${buyer.firstName} ${buyer.lastName}` }
          : null,
        seller: seller
          ? { _id: seller._id, name: `${seller.firstName} ${seller.lastName}` }
          : null,
      },
      messages: messages.map((msg) => ({
        senderId: msg.senderId,
        senderRole:
          msg.senderId === dispute.buyerId
            ? "buyer"
            : msg.senderId === dispute.sellerId
            ? "seller"
            : "moderator",
        content: msg.content,
        isSystemMessage: msg.isSystemMessage,
        timestamp: msg.createdAt,
      })),
      evidenceCount: dispute.evidence.length,
    };
  },
});

// Mark messages as sent with AI rephrase
export const updateMessageWithRephrase = mutation({
  args: {
    messageId: v.id("messages"),
    aiRephraseAccepted: v.boolean(),
    originalContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      aiRephraseAccepted: args.aiRephraseAccepted,
      originalContent: args.originalContent,
    });

    return await ctx.db.get(args.messageId);
  },
});
