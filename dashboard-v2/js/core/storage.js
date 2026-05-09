// Storage upload helper (blueprint §6) — shared by Products / Banners / Settings.

import { getSB } from './supabase.js';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload an image file to a Supabase Storage bucket using the §6 pattern:
 *   filename = `${folder}/${Date.now()}.${ext}`
 * Returns the publicUrl.
 */
export async function uploadImage(file, bucket, folder) {
  if (!file) throw new Error('No file selected');
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Image must be jpg, png, webp, or gif');
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — max 5MB`);
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const filename = `${folder}/${Date.now()}.${ext}`;
  const sb = getSB();

  const { error } = await sb.storage.from(bucket).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = sb.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

/** Convenience wrappers per bucket (folder pattern from blueprint §6 table). */
export const uploadProductImage = (file) => uploadImage(file, 'product-images', 'products');
export const uploadBannerImage  = (file) => uploadImage(file, 'banners', 'banners');
export const uploadStoreLogo    = (file) => uploadImage(file, 'store-banners', 'store');
export const uploadQR           = (file) => uploadImage(file, 'qr-images', 'qr');
