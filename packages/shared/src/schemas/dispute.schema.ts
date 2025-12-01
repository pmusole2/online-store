import { z } from "zod";

// Dispute category
export const DisputeCategorySchema = z.enum([
  "not_received",
  "defective",
  "not_as_described",
  "other",
]);
export type DisputeCategory = z.infer<typeof DisputeCategorySchema>;

// Dispute status
export const DisputeStatusSchema = z.enum([
  "open",
  "in_discussion",
  "moderator_review",
  "resolved",
  "closed",
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

// Resolution type
export const ResolutionTypeSchema = z.enum([
  "full_refund",
  "partial_refund",
  "no_refund",
  "mutual_agreement",
]);
export type ResolutionType = z.infer<typeof ResolutionTypeSchema>;

// Evidence
export const EvidenceSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url("Invalid URL"),
  uploadedAt: z.number(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// Resolution
export const ResolutionSchema = z.object({
  type: ResolutionTypeSchema,
  refundAmount: z.number().optional(),
  resolvedBy: z.string().optional(),
  notes: z.string(),
  resolvedAt: z.number(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

// Create dispute
export const CreateDisputeSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category: DisputeCategorySchema,
  evidence: z.array(EvidenceSchema).max(10, "Maximum 10 evidence items"),
});
export type CreateDispute = z.infer<typeof CreateDisputeSchema>;

// Resolve dispute
export const ResolveDisputeSchema = z.object({
  disputeId: z.string().min(1, "Dispute ID is required"),
  resolutionType: ResolutionTypeSchema,
  refundAmount: z.number().min(0).optional(),
  notes: z.string().min(1, "Resolution notes are required").max(1000),
});
export type ResolveDispute = z.infer<typeof ResolveDisputeSchema>;

// Add evidence
export const AddEvidenceSchema = z.object({
  disputeId: z.string().min(1, "Dispute ID is required"),
  evidence: EvidenceSchema,
});
export type AddEvidence = z.infer<typeof AddEvidenceSchema>;

// Dispute output
export const DisputeSchema = z.object({
  _id: z.string(),
  orderId: z.string(),
  escrowId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  title: z.string(),
  description: z.string(),
  category: DisputeCategorySchema,
  evidence: z.array(EvidenceSchema),
  status: DisputeStatusSchema,
  resolution: ResolutionSchema.optional().nullable(),
  aiSummary: z.string().optional().nullable(),
  aiSuggestions: z.array(z.string()).optional().nullable(),
  moderatorId: z.string().optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Dispute = z.infer<typeof DisputeSchema>;

// Dispute statistics
export const DisputeStatsSchema = z.object({
  total: z.number(),
  open: z.number(),
  inDiscussion: z.number(),
  moderatorReview: z.number(),
  resolved: z.number(),
  closed: z.number(),
  fullRefunds: z.number(),
  partialRefunds: z.number(),
  noRefunds: z.number(),
});
export type DisputeStats = z.infer<typeof DisputeStatsSchema>;
