import { z } from "zod";

// Notification type
export const NotificationTypeSchema = z.enum([
  "order_placed",
  "order_status_update",
  "new_message",
  "dispute_update",
  "funds_released",
  "new_review",
  "product_sold",
  "system",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// Create notification
export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: NotificationTypeSchema,
  title: z.string().min(1, "Title is required").max(100),
  message: z.string().min(1, "Message is required").max(500),
  data: z.record(z.any()).optional(),
});
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;

// Notification output
export const NotificationSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.any().optional().nullable(),
  isRead: z.boolean(),
  createdAt: z.number(),
});
export type Notification = z.infer<typeof NotificationSchema>;
