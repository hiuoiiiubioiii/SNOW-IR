import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { motion, useInView } from 'framer-motion'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet'
import { Satellite, Mountain, Activity, Cpu, Globe, Snowflake, Droplets, Wind, ChevronDown } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

import ShaderTerrain from './ShaderTerrain'
import SpectralSimulator from './SpectralSimulator'
import SimulationPanel from './SimulationPanel'
import NIMStatusPanel from './NIMStatusPanel'
import { REMOTE_SENSING_GLOSSARY } from './lib/glossary'
// API client available at ./lib/api for backend integration

/* ═══════════════════════════════════════════
   CHENAB BASIN DANGER ZONES
   ═══════════════════════════════════════════ */
const DANGER_ZONES = [
  { id: 'pangi', name: 'Pangi Valley', lat: 33.0, lon: 76.5, risk: 'High', type: 'Avalanche', snow: '78%', temp: '-8°C', elevation: 4200, desc: 'Extreme avalanche corridor with steep slopes >40°. Seismic Zone IV amplifies risk during heavy snowfall.' },
  { id: 'lahaul', name: 'Lahaul (Bara Shigri)', lat: 32.47, lon: 77.62, risk: 'Critical', type: 'GLOF', snow: '91%', temp: '-12°C', elevation: 4800, desc: 'Largest glacier in Himachal Pradesh. Moraine-dammed proglacial lake poses GLOF risk to downstream Chenab.' },
  { id: 'bhaga', name: 'Bhaga River Head', lat: 32.6, lon: 77.1, risk: 'Medium', type: 'Snowmelt', snow: '45%', temp: '-3°C', elevation: 3900, desc: 'Major tributary headwater. Rapid spring melt feeds directly into Chenab, stressing hydroelectric dams.' },
  { id: 'kishtwar', name: 'Kishtwar High Altitude', lat: 33.3, lon: 75.8, risk: 'High', type: 'Seismic Avalanche', snow: '95%', temp: '-18°C', elevation: 5100, desc: 'Zone IV seismicity + extreme snow loading. 2021 Kishtwar flash flood killed 7, destroyed infrastructure.' },
  { id: 'chamba', name: 'Chamba Valley Floor', lat: 32.5, lon: 76.1, risk: 'Low', type: 'Flash Flood', snow: '12%', temp: '4°C', elevation: 2100, desc: 'Low elevation valley receiving meltwater from upper basin. Monsoon cloudbursts cause urban flooding.' },
  { id: 'chhota_shigri', name: 'Chhota Shigri Glacier', lat: 32.28, lon: 77.58, risk: 'Critical', type: 'Glacial Retreat', snow: '88%', temp: '-14°C', elevation: 4600, desc: 'WGMS benchmark glacier. Retreating at 30m/yr. Mass balance data critical for Chenab water budget.' },
  { id: 'miyar', name: 'Miyar Glacier', lat: 32.75, lon: 76.95, risk: 'Medium', type: 'GLOF', snow: '72%', temp: '-9°C', elevation: 4400, desc: 'Second largest glacier in Lahaul. Supraglacial lake formation detected via Sentinel-2 time series.' },
]

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'map', label: 'Danger Zones' },
  { id: 'pipeline', label: 'Processing' },
  { id: 'simulation', label: 'Digital Twin' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'footer', label: 'About' },
]

const DATA_SOURCES = [
  { name: 'NASA / NSIDC', role: 'MODIS snow cover, ICESat-2 LiDAR elevation', icon: Satellite },
  { name: 'ESA Copernicus', role: 'Sentinel-1 SAR, Sentinel-2 multispectral', icon: Globe },
  { name: 'ISRO MOSDAC', role: 'INSAT-3D thermal, Resourcesat, RISAT', icon: Satellite },
  { name: 'IMD', role: 'Ground AWS stations, Doppler radar, forecasts', icon: Wind },
  { name: 'ICIMOD', role: 'Hindu Kush Himalayan cryosphere datasets', icon: Mountain },
  { name: 'GRDC', role: 'Global river discharge, Chenab gauge data', icon: Droplets },
  { name: 'ECMWF', role: 'ERA5 reanalysis, Western Disturbance forecasts', icon: Activity },
  { name: 'NVIDIA NIM', role: 'Earth-2 climate downscaling, LLM hazard alerts', icon: Cpu },
]

const PIPELINE_STEPS = [
  { step: 1, title: 'Multispectral Optical', subtitle: 'NDSI / NDVI', equation: 'NDSI = (Green − SWIR) / (Green + SWIR)', desc: 'Analyzing visible, NIR, and SWIR bands from Sentinel-2 to perform Fractional Snow Cover mapping and separate sky pixels from snow pixels.', color: '#00f3ff' },
  { step: 2, title: 'Microwave & SAR', subtitle: 'InSAR', equation: 'Δφ = (4π/λ) · d', desc: 'Synthetic Aperture Radar penetrates clouds. Interferometric SAR measures millimeter-scale surface displacement to detect glacial crevasses.', color: '#ff5e00' },
  { step: 3, title: 'Thermal Radiometry', subtitle: 'Land Surface Temperature', equation: 'E = ε · σ · T⁴', desc: 'Processing thermal infrared bands to calculate LST using Stefan-Boltzmann law. Critical for predicting rapid snowmelt.', color: '#ff3366' },
  { step: 4, title: 'LiDAR & 3D Spatial', subtitle: 'ICESat-2', equation: 'SWE = ρ_snow · d_snow', desc: 'Computing volumetric Snow Water Equivalent using spaceborne LiDAR point clouds — actual physical volume, not just 2D area.', color: '#33ff88' },
  { step: 5, title: 'Computer Vision', subtitle: 'Optical Flow', equation: 'v = Δx / Δt', desc: 'Vision Transformers via NVIDIA NIM track Chhota Shigri and Bara Shigri glacier flow velocity from time-lapse satellite imagery.', color: '#aa66ff' },
  { step: 6, title: 'Hydrological Stream', subtitle: 'GRDC Correlation', equation: 'Q = C · I · A', desc: 'Correlating satellite snowmelt predictions against actual GRDC river discharge data to predict downstream dam impacts.', color: '#ffaa00' },
]

/* ═══════════════════════════════════════════
   ANIMATED SECTION WRAPPER
   ═══════════════════════════════════════════ */
function Section({ children, id, className = '' }: { children: React.ReactNode, id: string, className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      {children}
    </motion.section>
  )
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [activeNav, setActiveNav] = useState('hero')


  useEffect(() => {
    const handleScroll = () => {
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveNav(item.id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const riskColor = (risk: string) => {
    if (risk === 'Critical') return '#ff3366'
    if (risk === 'High') return '#ff5e00'
    if (risk === 'Medium') return '#ffaa00'
    return '#33ff88'
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ STICKY NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0b0f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Snowflake className="w-5 h-5 text-[#00f3ff]" />
            <span className="font-bold text-lg tracking-tight">SNOW IR</span>
          </div>
          <div className="flex gap-1">
            {NAV_ITEMS.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  activeNav === n.id
                    ? 'bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
            <ambientLight intensity={0.15} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} color="#fff" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.3} enableZoom={false} />
            <ShaderTerrain />
            <EffectComposer>
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.2} />
            </EffectComposer>
          </Canvas>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}>
            <p className="text-[#00f3ff] text-sm uppercase tracking-[0.3em] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Satellite Intelligence · Chenab River Basin
            </p>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6" style={{ textShadow: '0 0 60px rgba(0,243,255,0.3)' }}>
              SNOW IR
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              7 Dangerous Chenab Basin Hazard Zones monitored via federated satellite data from NASA, ESA, ISRO, and IMD.
              Real-time NDSI spectral unmixing separates snow from sky using Earth physics.
            </p>
            <div className="flex gap-4 justify-center mb-12">
              <a href="#map" className="px-6 py-3 bg-[#00f3ff]/10 border border-[#00f3ff]/30 rounded-full text-sm text-[#00f3ff] hover:bg-[#00f3ff]/20 transition-all flex items-center gap-2">
                Explore Danger Zones <ChevronDown className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Built by Hitesh Meher
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-6 h-6 text-gray-500" />
        </motion.div>
      </section>

      {/* ═══ SECTION 2: INTERACTIVE MAP ═══ */}
      <Section id="map" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-3">7 Dangerous Chenab Basin Hazard Zones</h2>
          <p className="text-gray-400 max-w-3xl mb-10 leading-relaxed">
            Interactive satellite map of the Chenab River Basin — from Lahaul-Spiti to Kishtwar.
            Click any danger zone marker for elevation data, hazard type, and real-time snow metrics.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 h-[500px]">
              <MapContainer
                center={[32.8, 76.8]}
                zoom={8}
                className="h-full w-full"
                style={{ background: '#0a0b0f' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                {DANGER_ZONES.map(zone => (
                  <CircleMarker
                    key={zone.id}
                    center={[zone.lat, zone.lon]}
                    radius={zone.risk === 'Critical' ? 14 : zone.risk === 'High' ? 11 : 8}
                    pathOptions={{
                      color: riskColor(zone.risk),
                      fillColor: riskColor(zone.risk),
                      fillOpacity: 0.3,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#000', fontFamily: 'Inter, sans-serif', minWidth: 220 }}>
                        <strong style={{ fontSize: 14 }}>{zone.name}</strong>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{zone.desc}</div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          <div>⚠️ Risk: <strong style={{ color: riskColor(zone.risk) }}>{zone.risk}</strong></div>
                          <div>🏔️ Elevation: {zone.elevation}m</div>
                          <div>❄️ Snow: {zone.snow} | 🌡️ {zone.temp}</div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Zone Cards */}
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
              {DANGER_ZONES.map((zone, i) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{zone.name}</h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ color: riskColor(zone.risk), background: `${riskColor(zone.risk)}15`, border: `1px solid ${riskColor(zone.risk)}30` }}
                    >
                      {zone.risk}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">{zone.desc}</p>
                  <div className="flex gap-4 text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>❄️ {zone.snow}</span>
                    <span>🌡️ {zone.temp}</span>
                    <span>⛰️ {zone.elevation}m</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 3: PROCESSING PIPELINE ═══ */}
      <Section id="pipeline" className="py-20 px-6 bg-gradient-to-b from-transparent to-[#0d0e14]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-3">Geospatial Processing Pipeline</h2>
          <p className="text-gray-400 max-w-3xl mb-12 leading-relaxed">
            6-step Cryospheric processing chain — from raw satellite bands to actionable hazard intelligence.
            Each step shows the governing physics equation and data flow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {PIPELINE_STEPS.map((p, i) => (
              <motion.div
                key={p.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}
                  >
                    {p.step}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-[10px] text-gray-500">{p.subtitle}</div>
                  </div>
                </div>
                <div
                  className="text-xs py-2 px-3 rounded-lg mb-3 text-center"
                  style={{ background: `${p.color}08`, color: p.color, fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${p.color}15` }}
                >
                  {p.equation}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Data Sources */}
          <h3 className="text-xl font-semibold mb-6">Federated Data Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DATA_SOURCES.map((ds, i) => (
              <motion.div
                key={ds.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.05] transition-all"
              >
                <ds.icon className="w-4 h-4 text-[#00f3ff] mb-2" />
                <div className="text-xs font-semibold mb-1">{ds.name}</div>
                <div className="text-[10px] text-gray-500 leading-relaxed">{ds.role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 4: DIGITAL TWIN & SIMULATIONS ═══ */}
      <Section id="simulation" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-3">Digital Twin Simulations</h2>
          <p className="text-gray-400 max-w-3xl mb-12 leading-relaxed">
            Physics-based Digital Twin of the Chenab Basin. Run CFD flood simulations, Monte Carlo avalanche risk assessments,
            and thermodynamic snowmelt models — all connected to the live FastAPI backend.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimulationPanel />
            <div className="flex flex-col gap-4">
              <SpectralSimulator />
              <NIMStatusPanel />
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 5: GLOSSARY ═══ */}
      <Section id="glossary" className="py-20 px-6 bg-gradient-to-b from-transparent to-[#0d0e14]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-3">Remote Sensing Glossary</h2>
          <p className="text-gray-400 max-w-3xl mb-10 leading-relaxed">
            Standard abbreviations from meteorological and remote sensing reference materials.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {REMOTE_SENSING_GLOSSARY.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-lg p-3 hover:bg-white/[0.05] transition-all"
              >
                <div className="text-xs text-[#ff5e00] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.acronym}</div>
                <div className="text-[10px] text-gray-400 mt-1">{item.meaning}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer id="footer" className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">SNOW IR</h3>
          <p className="text-sm text-gray-400 mb-1">
            Physics-Informed Satellite Intelligence · Chenab River Basin Hazard Prediction
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Built by <strong className="text-white">Hitesh Meher</strong>
          </p>
          <p className="text-[10px] text-gray-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 · Data: ISRO MOSDAC, NASA NSIDC, ESA Copernicus · Map: CARTO Dark · Sheryians Coding School Aesthetic
          </p>
        </div>
      </footer>
    </div>
  )
}
