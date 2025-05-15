import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './env';

// Initialize the Supabase client with the credentials from environment config
export const supabase = createClient(
  SUPABASE_CONFIG.supabaseUrl, 
  SUPABASE_CONFIG.supabaseAnonKey
);

/**
 * Uploads a file to the Supabase storage 'user' bucket
 * @param file The file to upload
 * @param path Optional path inside the bucket (e.g., 'avatars/user123')
 * @returns The full path of the uploaded file if successful, or null if failed
 */
export async function uploadFile(file: File, path?: string): Promise<string | null> {
  try {
    // Validate file size
    if (file.size > SUPABASE_CONFIG.maxFileSizeBytes) {
      throw new Error(`File too large. Maximum size is ${SUPABASE_CONFIG.maxFileSizeBytes / (1024 * 1024)}MB`);
    }
    
    // Create a unique file name to avoid collisions
    const uniquePrefix = Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    const fileName = uniquePrefix + '_' + file.name.replace(/\s+/g, '_');
    
    // Construct full path
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    // Upload the file to the 'user' bucket
    const { data, error } = await supabase.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Return the full path of the file
    return data.path;
  } catch (error) {
    console.error('Exception during file upload:', error);
    return null;
  }
}

/**
 * Gets a public URL for a file in the 'user' bucket
 * @param path The path of the file in the bucket
 * @returns A public URL to the file
 */
export function getFileUrl(path: string): string {
  try {
    const { data } = supabase.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .getPublicUrl(path);
    
    console.log('Generated public URL for path:', path, data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating public URL:', error);
      return '';
    }
}

/**
 * Downloads a file from the 'user' bucket
 * @param path The path of the file in the bucket
 * @returns The file data as a blob if successful, or null if failed
 */
export async function downloadFile(path: string): Promise<Blob | null> {
  try {
    console.log('Downloading file from path:', path);
    const { data, error } = await supabase.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .download(path);
    
    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }
    
    console.log('Successfully downloaded file');
    return data;
  } catch (error) {
    console.error('Exception during file download:', error);
    return null;
  }
}

/**
 * Deletes a file from the 'user' bucket
 * @param path The path of the file in the bucket
 * @returns true if successfully deleted, false otherwise
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception during file deletion:', error);
    return false;
  }
} 