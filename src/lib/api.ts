/**
 * SNOW IR: Backend API Client
 * ----------------------------
 * Connects the React frontend to the FastAPI backend.
 * Falls back to mock data if backend is unreachable.
 */

const API_BASE = 'http://localhost:8000';

export async function fetchFromBackend(endpoint: string, method: 'GET' | 'POST' = 'GET') {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Backend unreachable at ${API_BASE}${endpoint}, using mock data.`);
    return null;
  }
}

export async function fetchTelemetry() {
  return fetchFromBackend('/api/telemetry');
}

export async function runPipeline() {
  return fetchFromBackend('/api/pipeline/run', 'POST');
}

export async function simulateGLOF() {
  return fetchFromBackend('/api/simulation/glof');
}

export async function simulateAvalanche() {
  return fetchFromBackend('/api/simulation/avalanche');
}

export async function simulateSnowmelt() {
  return fetchFromBackend('/api/simulation/snowmelt');
}

export async function runAgents() {
  return fetchFromBackend('/api/agents/run', 'POST');
}

export async function getNIMStatus() {
  return fetchFromBackend('/api/nim/status');
}
