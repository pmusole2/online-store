import { z } from "zod";

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable().optional(),
    total: z.number().optional(),
  });

// ID parameter
export const IdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
export type IdParam = z.infer<typeof IdParamSchema>;

// Success response
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  details: z.array(z.string()).optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// File upload
export const FileUploadSchema = z.object({
  filename: z.string(),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});
export type FileUpload = z.infer<typeof FileUploadSchema>;

// Image dimensions
export const ImageDimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ImageDimensions = z.infer<typeof ImageDimensionsSchema>;
