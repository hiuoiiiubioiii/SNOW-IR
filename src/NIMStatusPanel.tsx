import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getNIMStatus } from './lib/api';

export default function NIMStatusPanel() {
  const [nimData, setNimData] = useState<any>(null);

  useEffect(() => {
    getNIMStatus().then(data => setNimData(data));
    const interval = setInterval(() => {
      getNIMStatus().then(data => setNimData(data));
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!nimData) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/20">
        <p className="text-xs text-gray-500 font-mono">Connecting to NVIDIA NIM...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 rounded-2xl border border-purple-500/20"
    >
      <h3 className="text-[10px] text-purple-400 uppercase tracking-widest mb-3 font-semibold flex items-center justify-between">
        <span>NVIDIA NIM</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-green-400">{nimData.status}</span>
        </span>
      </h3>

      <div className="text-[10px] font-mono text-gray-400 mb-3">
        Latency: <span className="text-purple-300">{nimData.latency_ms}ms</span>
      </div>

      <div className="space-y-2">
        {nimData.active_microservices?.map((svc: any, i: number) => (
          <div key={i} className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-[10px] text-purple-300 font-mono font-bold truncate">{svc.model}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">{svc.task}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
