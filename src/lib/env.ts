/**
 * Environment Configuration
 * Contains all environment-specific configuration including API keys
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  // Supabase URL and anonymous key (public)
  supabaseUrl: 'https://xogbnpeveokuyjiprqgr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ2JucGV2ZW9rdXlqaXBycWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NTk3NDcsImV4cCI6MjA2MjUzNTc0N30.5VRDx4NyWnroTm2R0OMeHuTZ_q9JYyLwfVjOeXx_jR8',
  
  // Storage bucket for user files
  storageBucket: 'user',
  
  // File size limits and settings
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  imageFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videoFileTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  audioFileTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  documentFileTypes: ['application/pdf']
};

// Database connection strings (never exposed to frontend)
// These are here for documentation but should be used in server environments only
export const DATABASE_CONFIG = {
  // Main connection via connection pooling
  databaseUrl: "postgresql://postgres.xogbnpeveokuyjiprqgr:[Samuel1029384756$$$]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  
  // Direct connection used for migrations
  directUrl: "postgresql://postgres.xogbnpeveokuyjiprqgr:[Samuel1029384756$$$]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
};

// API Endpoints
export const API_ENDPOINTS = {
  enhanceJournalEntry: '/api/enhance-journal',
};

// Feature flags
export const FEATURES = {
  enableSupabaseStorage: true,
  enableAutoSave: true,
  enableSpellCheck: true
}; 