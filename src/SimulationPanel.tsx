import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateGLOF, simulateAvalanche, simulateSnowmelt, runPipeline, runAgents } from './lib/api';

type SimResult = Record<string, any> | null;

export default function SimulationPanel() {
  const [activeTab, setActiveTab] = useState<'glof' | 'avalanche' | 'snowmelt' | 'pipeline' | 'agents'>('pipeline');
  const [result, setResult] = useState<SimResult>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'pipeline' as const, label: 'Pipeline', icon: '🛰️' },
    { id: 'glof' as const, label: 'GLOF', icon: '🌊' },
    { id: 'avalanche' as const, label: 'Avalanche', icon: '🏔️' },
    { id: 'snowmelt' as const, label: 'Snowmelt', icon: '🌡️' },
    { id: 'agents' as const, label: 'Agents', icon: '🤖' },
  ];

  const runSim = async () => {
    setLoading(true);
    setResult(null);
    let data: SimResult = null;
    try {
      switch (activeTab) {
        case 'glof': data = await simulateGLOF(); break;
        case 'avalanche': data = await simulateAvalanche(); break;
        case 'snowmelt': data = await simulateSnowmelt(); break;
        case 'pipeline': data = await runPipeline(); break;
        case 'agents': data = await runAgents(); break;
      }
    } catch (e) {
      console.warn('Simulation failed:', e);
    }
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#ff5e00]/20">
      <h3 className="text-sm text-[#ff5e00] uppercase tracking-widest mb-4 font-semibold flex items-center gap-2">
        <span>Digital Twin & Simulations</span>
      </h3>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`text-[10px] px-2 py-1 rounded-full transition-all font-mono ${
              activeTab === tab.id
                ? 'bg-[#ff5e00]/20 text-[#ff5e00] border border-[#ff5e00]/40'
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Run Button */}
      <button
        onClick={runSim}
        disabled={loading}
        className="w-full py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all mb-4 border border-[#ff5e00]/30 hover:bg-[#ff5e00]/10 text-[#ff5e00] disabled:opacity-50"
      >
        {loading ? '⏳ Processing...' : `▶ Run ${activeTab.toUpperCase()}`}
      </button>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-black/40 rounded-lg p-3 border border-white/5 max-h-64 overflow-y-auto custom-scrollbar"
          >
            <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <div className="text-center text-xs text-gray-500 py-4 font-mono">
          Select a simulation and press Run
        </div>
      )}
    </div>
  );
}
