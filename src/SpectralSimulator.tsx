import { useState } from 'react';

// Pure Endmember Reflectance Signatures (Visible, NIR, SWIR)
const ENDMEMBERS = {
  snow: [0.9, 0.8, 0.05],
  rock: [0.3, 0.35, 0.4],
  veg: [0.1, 0.8, 0.2],
};

export default function SpectralSimulator() {
  const [snow, setSnow] = useState(40);
  const [rock, setRock] = useState(40);
  const [veg, setVeg] = useState(20);

  // Normalize to ensure they sum to 1.0 (100%)
  const total = snow + rock + veg || 1;
  const fSnow = snow / total;
  const fRock = rock / total;
  const fVeg = veg / total;

  // Linear Spectral Unmixing Equation: R_mixed = sum(f_i * R_i)
  const mixedVis = (fSnow * ENDMEMBERS.snow[0]) + (fRock * ENDMEMBERS.rock[0]) + (fVeg * ENDMEMBERS.veg[0]);
  const mixedNir = (fSnow * ENDMEMBERS.snow[1]) + (fRock * ENDMEMBERS.rock[1]) + (fVeg * ENDMEMBERS.veg[1]);
  const mixedSwir = (fSnow * ENDMEMBERS.snow[2]) + (fRock * ENDMEMBERS.rock[2]) + (fVeg * ENDMEMBERS.veg[2]);

  // Calculate NDSI
  const ndsi = (mixedVis - mixedSwir) / (mixedVis + mixedSwir);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[#00f3ff]/20 pointer-events-auto">
      <h3 className="text-sm text-[#00f3ff] uppercase tracking-widest mb-4 font-semibold flex justify-between">
        <span>Spectral Unmixing Simulator</span>
        <span className="text-xs bg-[#00f3ff]/10 px-2 py-1 rounded">Interactive</span>
      </h3>
      
      {/* Sliders */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white">Snow Fraction</span>
            <span className="font-mono">{(fSnow * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0" max="100" value={snow} onChange={(e) => setSnow(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00f3ff]" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Rock Fraction</span>
            <span className="font-mono">{(fRock * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0" max="100" value={rock} onChange={(e) => setRock(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gray-400" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Vegetation Fraction</span>
            <span className="font-mono">{(fVeg * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0" max="100" value={veg} onChange={(e) => setVeg(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400" />
        </div>
      </div>

      {/* Simulated Satellite Reading */}
      <div className="bg-black/40 rounded-lg p-4 border border-white/5">
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Simulated Satellite Sensor Reading</h4>
        
        <div className="flex items-end justify-between h-20 gap-2">
          {/* Visible Band */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-blue-400/80 rounded-t-sm transition-all duration-300 relative group" style={{ height: `${mixedVis * 100}%` }}>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">{mixedVis.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">VIS</span>
          </div>
          
          {/* NIR Band */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-red-400/80 rounded-t-sm transition-all duration-300 relative group" style={{ height: `${mixedNir * 100}%` }}>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">{mixedNir.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">NIR</span>
          </div>
          
          {/* SWIR Band */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-orange-400/80 rounded-t-sm transition-all duration-300 relative group" style={{ height: `${mixedSwir * 100}%` }}>
               <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">{mixedSwir.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">SWIR</span>
          </div>
        </div>

        {/* Output metrics */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
           <span className="text-xs text-gray-400">Mixed NDSI Output:</span>
           <span className={`text-sm font-mono font-bold ${ndsi > 0.4 ? 'text-[#00f3ff]' : 'text-gray-400'}`}>
             {ndsi.toFixed(3)}
           </span>
        </div>
      </div>
    </div>
  );
}
