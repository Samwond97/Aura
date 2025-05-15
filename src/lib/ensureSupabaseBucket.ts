import { supabase } from './supabase';
import { SUPABASE_CONFIG } from './env';

/**
 * Ensures that the user bucket exists in Supabase storage
 * This should be called during app initialization
 */
export async function ensureUserBucketExists(): Promise<boolean> {
  try {
    console.log('Checking if storage bucket exists:', SUPABASE_CONFIG.storageBucket);
    
    // First, check if the bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    // Check if our bucket is in the list
    const bucketExists = buckets.some(bucket => bucket.name === SUPABASE_CONFIG.storageBucket);
    
    if (bucketExists) {
      console.log('Storage bucket already exists:', SUPABASE_CONFIG.storageBucket);
      return true;
    }
    
    // If the bucket doesn't exist, create it
    console.log('Creating storage bucket:', SUPABASE_CONFIG.storageBucket);
    const { data, error } = await supabase
      .storage
      .createBucket(SUPABASE_CONFIG.storageBucket, {
        public: true, // Make files publicly accessible
        fileSizeLimit: SUPABASE_CONFIG.maxFileSizeBytes
      });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
    
    console.log('Successfully created storage bucket:', SUPABASE_CONFIG.storageBucket);
    return true;
  } catch (error) {
    console.error('Exception in ensureUserBucketExists:', error);
    return false;
  }
} 