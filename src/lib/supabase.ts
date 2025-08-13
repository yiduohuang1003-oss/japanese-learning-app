import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if we have valid Supabase configuration
const hasValidConfig = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl.startsWith('https://') &&
                      supabaseUrl.includes('supabase.co')

// Create mock client for when Supabase is not configured
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Authentication disabled - Supabase not configured' } }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Authentication disabled - Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null })
  }
})

export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()

export const isSupabaseConfigured = hasValidConfig

if (!hasValidConfig) {
  console.warn('Supabase configuration is missing or invalid. Authentication features will be disabled.')
}
