import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useSupabase() {
  const { getToken } = useAuth()
  
  const getSupabaseClient = async () => {
    const token = await getToken()
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
  }
  
  return { getSupabaseClient }
}