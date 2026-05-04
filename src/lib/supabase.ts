/**
 * SNOW IR: Supabase Schema & Real-time Client
 * ---------------------------------------------
 * Connects to Supabase PostgreSQL for persistent storage of:
 *   - telemetry (prediction zone metrics)
 *   - pipeline_runs (processing pipeline execution logs)
 *   - simulations (GLOF/avalanche/snowmelt results)
 *   - agent_logs (autonomous agent workflow history)
 *   - glacier_observations (long-term glacier tracking)
 *
 * SQL Schema (execute in Supabase SQL Editor):
 *
 * CREATE TABLE telemetry (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   zone_id TEXT NOT NULL,
 *   zone_name TEXT NOT NULL,
 *   lat DOUBLE PRECISION,
 *   lon DOUBLE PRECISION,
 *   elevation_m INTEGER,
 *   risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
 *   temperature_c DOUBLE PRECISION,
 *   snow_cover_pct DOUBLE PRECISION,
 *   ndsi DOUBLE PRECISION,
 *   hazards TEXT[],
 *   satellite_source TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE pipeline_runs (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   ndsi DOUBLE PRECISION,
 *   ndvi DOUBLE PRECISION,
 *   is_snow BOOLEAN,
 *   backscatter_db DOUBLE PRECISION,
 *   coherence DOUBLE PRECISION,
 *   wet_snow BOOLEAN,
 *   lst_celsius DOUBLE PRECISION,
 *   energy_flux DOUBLE PRECISION,
 *   melt_rate DOUBLE PRECISION,
 *   snow_depth_m DOUBLE PRECISION,
 *   swe_mm DOUBLE PRECISION,
 *   discharge_m3s DOUBLE PRECISION,
 *   dam_stress_pct DOUBLE PRECISION,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE simulations (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   sim_type TEXT NOT NULL CHECK (sim_type IN ('glof', 'avalanche', 'snowmelt')),
 *   result JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE agent_logs (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   agent_name TEXT NOT NULL,
 *   task TEXT,
 *   result TEXT,
 *   status TEXT CHECK (status IN ('COMPLETE', 'PAUSED', 'ERROR')),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE glacier_observations (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   glacier_name TEXT NOT NULL,
 *   lat DOUBLE PRECISION,
 *   lon DOUBLE PRECISION,
 *   velocity_m_yr DOUBLE PRECISION,
 *   retreat_m_yr DOUBLE PRECISION,
 *   area_km2 DOUBLE PRECISION,
 *   observation_date DATE,
 *   source TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Enable Row Level Security
 * ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE glacier_observations ENABLE ROW LEVEL SECURITY;
 *
 * -- Public read access policies
 * CREATE POLICY "Public read" ON telemetry FOR SELECT USING (true);
 * CREATE POLICY "Public read" ON pipeline_runs FOR SELECT USING (true);
 * CREATE POLICY "Public read" ON simulations FOR SELECT USING (true);
 * CREATE POLICY "Public read" ON agent_logs FOR SELECT USING (true);
 * CREATE POLICY "Public read" ON glacier_observations FOR SELECT USING (true);
 *
 * -- Enable Realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
 * ALTER PUBLICATION supabase_realtime ADD TABLE simulations;
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Graceful: If keys not set, export null — app falls back to FastAPI backend or mock data
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock data fallback if neither backend nor Supabase are configured
export const mockTelemetryData = [
  { id: 1, name: "Pangi Valley", risk: "High", temp: "-8°C", snow: "78%" },
  { id: 2, name: "Lahaul (Bara Shigri)", risk: "Critical", temp: "-12°C", snow: "91%" },
  { id: 3, name: "Bhaga River Head", risk: "Medium", temp: "-3°C", snow: "45%" },
  { id: 4, name: "Kishtwar High Alt", risk: "High", temp: "-18°C", snow: "95%" },
  { id: 5, name: "Chamba Valley Floor", risk: "Low", temp: "4°C", snow: "12%" },
];

/**
 * Subscribe to real-time telemetry updates via Supabase Realtime.
 * Falls back silently if Supabase is not configured.
 */
export function subscribeToTelemetry(callback: (payload: any) => void) {
  if (!supabase) return null;

  const channel = supabase
    .channel('telemetry-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'telemetry' }, callback)
    .subscribe();

  return channel;
}

/**
 * Write a pipeline run result to Supabase for historical tracking.
 */
export async function savePipelineRun(result: any) {
  if (!supabase) {
    console.warn('[Supabase] Not configured. Skipping save.');
    return null;
  }
  const { data, error } = await supabase.from('pipeline_runs').insert(result);
  if (error) console.error('[Supabase] Save error:', error);
  return data;
}

/**
 * Fetch all historical pipeline runs.
 */
export async function getPipelineHistory() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}
