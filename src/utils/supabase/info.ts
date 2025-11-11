/**
 * Supabase Configuration
 * Centralized configuration for Supabase connection
 */

// Get configuration from environment variables with fallbacks
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "hebruzjorytvlxquacxe"
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYnJ1empvcnl0dmx4cXVhY3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODA3NDMsImV4cCI6MjA3NzM1Njc0M30.bz02LZq73iy5Id1k4cuq2hNcjM8yMEFREAQpXtZGYLQ"

// Construct Supabase URL
export const supabaseUrl = `https://${projectId}.supabase.co`

// Backend API base URL
export const backendUrl = `${supabaseUrl}/functions/v1/make-server-b9ff1a07`

// Validate configuration
if (!projectId || !publicAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.')
}
