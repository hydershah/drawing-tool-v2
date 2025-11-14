/**
 * Cloudflare R2 Storage Service
 * Handles image uploads and retrieval from R2 bucket
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'drawing';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Convert base64 image to buffer and get metadata
 */
function processBase64Image(base64String: string): {
  buffer: Buffer;
  mimeType: string;
  extension: string;
} {
  // Remove data:image/jpeg;base64, or similar prefix
  const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);

  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  const mimeType = `image/${matches[1]}`;
  const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');

  return { buffer, mimeType, extension };
}

/**
 * Upload base64 image to R2
 */
export async function uploadBase64Image(
  base64Image: string,
  artworkId: string,
  options: {
    optimize?: boolean;
    maxWidth?: number;
    quality?: number;
  } = {}
): Promise<UploadResult> {
  try {
    const { buffer, mimeType, extension } = processBase64Image(base64Image);

    // Optimize image if requested
    let imageBuffer = buffer;
    let optimizedMimeType = mimeType;

    if (options.optimize) {
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Resize if too large
      if (metadata.width && metadata.width > (options.maxWidth || 2000)) {
        sharpInstance.resize(options.maxWidth || 2000, null, {
          withoutEnlargement: true,
        });
      }

      // Convert to WebP for better compression
      imageBuffer = await sharpInstance
        .webp({ quality: options.quality || 85 })
        .toBuffer();
      optimizedMimeType = 'image/webp';
    }

    // Generate unique key for the image
    const key = `artworks/${artworkId}/${uuidv4()}.${options.optimize ? 'webp' : extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: optimizedMimeType,
      // Note: R2 doesn't support ACL, configure bucket for public access instead
    });

    await r2Client.send(command);

    // Construct public URL (bucket name not needed in public URL)
    const url = `${PUBLIC_URL}/${key}`;

    console.log(`✅ Image uploaded to R2: ${key}`);
    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload buffer directly to R2
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  mimeType: string,
  artworkId: string
): Promise<UploadResult> {
  try {
    const extension = mimeType.split('/')[1] || 'jpg';
    const key = `artworks/${artworkId}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Note: R2 doesn't support ACL, configure bucket for public access instead
    });

    await r2Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;

    console.log(`✅ Image buffer uploaded to R2: ${key}`);
    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('Error uploading buffer to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete image from R2
 */
export async function deleteImage(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ Image deleted from R2: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

/**
 * Generate a signed URL for temporary access (if needed)
 */
export async function getSignedImageUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * List all images in a specific artwork folder
 */
export async function listArtworkImages(artworkId: string): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `artworks/${artworkId}/`,
    });

    const response = await r2Client.send(command);
    const keys = response.Contents?.map((item) => item.Key || '') || [];

    return keys.filter(key => key !== '');
  } catch (error) {
    console.error('Error listing images from R2:', error);
    return [];
  }
}

/**
 * Check if a string is an R2 URL (vs base64 data)
 */
export function isImageUrl(data: string): boolean {
  // Check if it starts with http:// or https://
  return data.startsWith('http://') || data.startsWith('https://');
}

/**
 * Extract key from R2 URL
 */
export function getKeyFromUrl(url: string): string | null {
  try {
    // Extract key from URL format: https://account.r2.cloudflarestorage.com/bucket/key
    const urlParts = url.split(`${BUCKET_NAME}/`);
    if (urlParts.length > 1) {
      return urlParts[1];
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default {
  uploadBase64Image,
  uploadImageBuffer,
  deleteImage,
  getSignedImageUrl,
  listArtworkImages,
  getKeyFromUrl,
  isImageUrl,
};