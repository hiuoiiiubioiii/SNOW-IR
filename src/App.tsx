import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import ShaderTerrain from './ShaderTerrain'
import { supabase, mockTelemetryData } from './lib/supabase'

function App() {
  const [zones, setZones] = useState(mockTelemetryData);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  useEffect(() => {
    async function fetchTelemetry() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('telemetry').select('*');
          if (data && !error) {
            setZones(data);
            setIsCloudConnected(true);
          }
        } catch (e) {
          console.warn("Supabase fetch failed, falling back to mock data");
        }
      }
    }
    fetchTelemetry();
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0b0c10] text-white overflow-hidden relative font-sans">
      {/* 3D Map Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#fff" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} />
          <ShaderTerrain />
        </Canvas>
      </div>

      {/* Overlay UI - Sheryians Style */}
      <div className="relative z-10 p-8 h-full flex flex-col pointer-events-none">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter neon-glow">SNOW IR</h1>
            <p className="text-[#00f3ff] text-sm uppercase tracking-widest mt-1 opacity-80">Chenab River Basin Intelligence</p>
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isCloudConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              Live Telemetry
            </span>
            <div className="w-px h-4 bg-white/20"></div>
            <span className="text-xs font-mono text-gray-400">
              {isCloudConnected ? 'CLOUD.CONNECTED' : 'LOCAL.MOCK'}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-8">
          
          {/* Left Sidebar - Prediction Zones */}
          <aside className="w-80 flex flex-col gap-4 pointer-events-auto">
            <div className="glass-panel p-6 rounded-2xl flex-1 border border-[#00f3ff]/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ff5e00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Prediction Zones
              </h2>
              
              <div className="flex flex-col gap-3">
                {zones.map(zone => (
                  <ZoneCard key={zone.id} name={zone.name} risk={zone.risk} temp={zone.temp} snow={zone.snow} />
                ))}
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl h-48 border border-[#00f3ff]/20">
               <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Mixed Pixel Analysis</h3>
               <div className="flex justify-between items-end h-24 pb-2 border-b border-white/10">
                 <div className="w-1/3 bg-white/10 h-[60%] rounded-t-sm relative group cursor-pointer hover:bg-white/20 transition-all"></div>
                 <div className="w-1/3 bg-[#00f3ff]/80 h-[90%] rounded-t-sm relative group cursor-pointer hover:bg-[#00f3ff] transition-all glow-box"></div>
                 <div className="w-1/3 bg-[#ff5e00]/80 h-[30%] rounded-t-sm relative group cursor-pointer hover:bg-[#ff5e00] transition-all"></div>
               </div>
               <div className="flex justify-between mt-2 text-xs font-mono text-gray-400">
                 <span>Rock</span>
                 <span className="text-[#00f3ff]">Snow</span>
                 <span>Veg</span>
               </div>
            </div>
          </aside>

          {/* Center Map Reticle / Controls */}
          <main className="flex-1 flex flex-col items-center justify-end pb-8">
            <div className="glass-panel px-8 py-4 rounded-full flex gap-8 pointer-events-auto border border-white/10">
              <button className="text-sm hover:text-[#00f3ff] transition-colors uppercase tracking-widest font-semibold">NDSI View</button>
              <button className="text-sm text-[#00f3ff] neon-glow transition-colors uppercase tracking-widest font-semibold">Optical (Clouds Removed)</button>
              <button className="text-sm hover:text-[#00f3ff] transition-colors uppercase tracking-widest font-semibold">Thermal</button>
            </div>
          </main>
          
        </div>
      </div>
    </div>
  )
}

function ZoneCard({ name, risk, temp, snow }: { name: string, risk: string, temp: string, snow: string }) {
  const riskColor = risk === 'High' ? 'text-[#ff5e00]' : risk === 'Medium' ? 'text-yellow-400' : 'text-green-400';
  const riskBg = risk === 'High' ? 'bg-[#ff5e00]/10' : risk === 'Medium' ? 'bg-yellow-400/10' : 'bg-green-400/10';

  return (
    <div className="bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl cursor-pointer border border-transparent hover:border-white/10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-white">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${riskColor} ${riskBg}`}>{risk}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-400 font-mono mt-3">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {temp}
        </span>
        <span className="flex items-center gap-1 text-[#00f3ff]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {snow} Cover
        </span>
      </div>
    </div>
  )
}

export default App
