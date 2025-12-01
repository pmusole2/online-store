import { z } from "zod";

// Create review
export const CreateReviewSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),
  title: z.string().max(100, "Title must be less than 100 characters").optional(),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional(),
});
export type CreateReview = z.infer<typeof CreateReviewSchema>;

// Review output
export const ReviewSchema = z.object({
  _id: z.string(),
  orderId: z.string(),
  reviewerId: z.string(),
  revieweeId: z.string(),
  productId: z.string(),
  rating: z.number(),
  title: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  createdAt: z.number(),
});
export type Review = z.infer<typeof ReviewSchema>;

// Review with reviewer info
export const ReviewWithReviewerSchema = ReviewSchema.extend({
  reviewer: z
    .object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      avatar: z.string().optional().nullable(),
    })
    .nullable(),
});
export type ReviewWithReviewer = z.infer<typeof ReviewWithReviewerSchema>;

// Review statistics
export const ReviewStatsSchema = z.object({
  totalReviews: z.number(),
  averageRating: z.number(),
  ratingDistribution: z.object({
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number(),
  }),
});
export type ReviewStats = z.infer<typeof ReviewStatsSchema>;
