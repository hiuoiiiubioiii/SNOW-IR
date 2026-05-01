import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If keys are not provided, we export a null client to allow local mock rendering
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock data fallback if Supabase is not configured yet
export const mockTelemetryData = [
  { id: 1, name: "Upper Chenab", risk: "High", temp: "-12°C", snow: "84%" },
  { id: 2, name: "Middle Reaches", risk: "Medium", temp: "-4°C", snow: "45%" },
  { id: 3, name: "Lower Basin", risk: "Low", temp: "2°C", snow: "12%" }
];
