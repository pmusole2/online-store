import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface UploadedImage {
  uri: string;
  storageId: string;
}

interface UseImageUploadReturn {
  images: UploadedImage[];
  isUploading: boolean;
  progress: number;
  pickImages: (maxImages?: number) => Promise<void>;
  pickFromCamera: () => Promise<void>;
  removeImage: (index: number) => void;
  clearImages: () => void;
  uploadSingleImage: (uri: string) => Promise<string | null>;
}

export function useImageUpload(initialImages: UploadedImage[] = []): UseImageUploadReturn {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const uploadImage = async (uri: string): Promise<UploadedImage | null> => {
    try {
      // Compress image first
      const compressedUri = await compressImage(uri);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the image as blob
      const response = await fetch(compressedUri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await uploadResponse.json();

      // Get the public URL
      // Note: The URL will be fetched when needed via getUrl query
      return {
        uri: compressedUri,
        storageId,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const pickImages = async (maxImages: number = 5) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    setIsUploading(true);
    setProgress(0);

    const uploadedImages: UploadedImage[] = [];
    const totalImages = result.assets.length;

    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      const uploaded = await uploadImage(asset.uri);
      if (uploaded) {
        uploadedImages.push(uploaded);
      }
      setProgress(((i + 1) / totalImages) * 100);
    }

    setImages((prev) => [...prev, ...uploadedImages]);
    setIsUploading(false);
    setProgress(0);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    setIsUploading(true);
    setProgress(0);

    const uploaded = await uploadImage(result.assets[0].uri);
    if (uploaded) {
      setImages((prev) => [...prev, uploaded]);
    }

    setIsUploading(false);
    setProgress(0);
  };

  const uploadSingleImage = async (uri: string): Promise<string | null> => {
    const uploaded = await uploadImage(uri);
    return uploaded?.storageId || null;
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    isUploading,
    progress,
    pickImages,
    pickFromCamera,
    removeImage,
    clearImages,
    uploadSingleImage,
  };
}
