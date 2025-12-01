import { z } from "zod";

/**
 * Validate data against a Zod schema
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Validated data or throws error
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safely validate data against a Zod schema
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Result object with success status and data or error
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Get formatted error messages from Zod error
 * @param error - The Zod error
 * @returns Array of error messages
 */
export function getValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Get first error message from Zod error
 * @param error - The Zod error
 * @returns First error message
 */
export function getFirstValidationError(error: z.ZodError): string {
  const errors = getValidationErrors(error);
  return errors[0] || "Validation error";
}

/**
 * Create a validation error response
 * @param error - The Zod error
 * @returns Error response object
 */
export function createValidationErrorResponse(error: z.ZodError) {
  return {
    error: "Validation Error",
    message: getFirstValidationError(error),
    statusCode: 400,
    details: getValidationErrors(error),
  };
}

/**
 * Zambian phone number regex
 * Matches: +260XXXXXXXXX, 260XXXXXXXXX, 0XXXXXXXXX
 */
export const zambianPhoneRegex = /^(\+?260|0)?[0-9]{9}$/;

/**
 * Validate Zambian phone number
 * @param phone - The phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidZambianPhone(phone: string): boolean {
  return zambianPhoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Format Zambian phone number to international format
 * @param phone - The phone number to format
 * @returns Formatted phone number (+260XXXXXXXXX)
 */
export function formatZambianPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "").replace(/^0/, "");
  if (cleaned.startsWith("+260")) return cleaned;
  if (cleaned.startsWith("260")) return `+${cleaned}`;
  return `+260${cleaned}`;
}

/**
 * Custom Zod schema for Zambian phone
 */
export const zambianPhoneSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, ""))
  .refine(isValidZambianPhone, "Invalid Zambian phone number");

/**
 * Zambian provinces
 */
export const ZAMBIAN_PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
] as const;

export type ZambianProvince = (typeof ZAMBIAN_PROVINCES)[number];

/**
 * Zod schema for Zambian province
 */
export const zambianProvinceSchema = z.enum(ZAMBIAN_PROVINCES);
