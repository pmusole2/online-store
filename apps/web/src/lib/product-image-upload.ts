export const MAX_PRODUCT_IMAGE_COUNT = 10;
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const ACCEPTED_PRODUCT_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface ProductImageFileLike {
  name: string;
  type: string;
  size: number;
}

export interface ProductImageValidationResult<T extends ProductImageFileLike> {
  acceptedFiles: T[];
  errors: string[];
}

export function validateProductImageFiles<T extends ProductImageFileLike>(
  files: readonly T[],
  existingImageCount: number
): ProductImageValidationResult<T> {
  const remainingSlots = Math.max(MAX_PRODUCT_IMAGE_COUNT - existingImageCount, 0);

  if (remainingSlots === 0) {
    return {
      acceptedFiles: [],
      errors: [`You can upload up to ${MAX_PRODUCT_IMAGE_COUNT} images per listing.`],
    };
  }

  const acceptedFiles: T[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (acceptedFiles.length >= remainingSlots) {
      errors.push(`Only ${remainingSlots} more image(s) can be added to this listing.`);
      break;
    }

    if (!ACCEPTED_PRODUCT_IMAGE_TYPES.has(file.type)) {
      errors.push(`${file.name}: unsupported file type.`);
      continue;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      errors.push(`${file.name}: exceeds the 8 MB upload limit.`);
      continue;
    }

    acceptedFiles.push(file);
  }

  return { acceptedFiles, errors };
}
