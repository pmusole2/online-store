import { z } from "zod";

// Escrow status
export const EscrowStatusSchema = z.enum([
  "held",
  "released",
  "refunded",
  "partially_refunded",
  "disputed",
]);
export type EscrowStatus = z.infer<typeof EscrowStatusSchema>;

// Create escrow
export const CreateEscrowSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  buyerId: z.string().min(1, "Buyer ID is required"),
  sellerId: z.string().min(1, "Seller ID is required"),
  amount: z.number().positive("Amount must be positive"),
});
export type CreateEscrow = z.infer<typeof CreateEscrowSchema>;

// Partial refund
export const PartialRefundSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  refundAmount: z.number().positive("Refund amount must be positive"),
});
export type PartialRefund = z.infer<typeof PartialRefundSchema>;

// Escrow output
export const EscrowSchema = z.object({
  _id: z.string(),
  orderId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  amount: z.number(),
  status: EscrowStatusSchema,
  refundAmount: z.number().optional().nullable(),
  releasedAt: z.number().optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Escrow = z.infer<typeof EscrowSchema>;

// Escrow statistics
export const EscrowStatsSchema = z.object({
  totalHeld: z.number(),
  totalReleased: z.number(),
  totalRefunded: z.number(),
  heldCount: z.number(),
  releasedCount: z.number(),
  refundedCount: z.number(),
  disputedCount: z.number(),
});
export type EscrowStats = z.infer<typeof EscrowStatsSchema>;
