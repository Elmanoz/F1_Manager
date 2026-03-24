import React, { useState, useEffect } from 'react';
import { Driver, Track, CarSetup } from '../types';

interface QualiResult {
  driver: Driver;
  sector1: number;
  sector2: number;
  sector3: number;
  total: number;
  gap: number;
  isPlayer: boolean;
}

interface QualifyingSessionProps {
  drivers: Driver[];
  opponents: Driver[];
  track: Track;
  setupConfidence: Record<string, number>;
  onComplete: (grid: Driver[]) => void;
}

const QualifyingSession: React.FC<QualifyingSessionProps> = ({ drivers, opponents, track, setupConfidence, onComplete }) => {
  const [results, setResults] = useState<QualiResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [phase, setPhase] = useState<'READY' | 'RUNNING' | 'FINISHED'>('READY');

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor((ms % 1000));
    return `${min}:${sec.toString().padStart(2, '0')}.${milli.toString().padStart(3, '0')}`;
  };

  const simulateLap = () => {
    setIsSimulating(true);
    setPhase('RUNNING');

    const allDrivers = [...drivers.map(d => ({ ...d, isPlayer: true })), ...opponents.map(d => ({ ...d, isPlayer: false }))];
    const simulatedResults: QualiResult[] = [];
    const baseSector = 30000;

    allDrivers.forEach(d => {
       let performance = d.rating;
       if (d.isPlayer) {
          const conf = setupConfidence[d.id] || 50;
          const setupMult = 0.96 + (conf * 0.0008); 
          performance *= setupMult;
       } else {
          const aiSetupMult = 0.97 + (Math.random() * 0.06);
          performance *= aiSetupMult;
       }
       const performanceFactor = 1 + ((100 - performance) * 0.0007);
       const getSectorTime = () => {
          const rng = 0.997 + (Math.random() * 0.006);
          return baseSector * performanceFactor * rng;
       };

       const s1 = getSectorTime();
       const s2 = getSectorTime();
       const s3 = getSectorTime();

       simulatedResults.push({
         driver: d,
         sector1: s1,
         sector2: s2,
         sector3: s3,
         total: s1 + s2 + s3,
         gap: 0,
         isPlayer: !!d.isPlayer
       });
    });

    simulatedResults.sort((a, b) => a.total - b.total);
    const poleTime = simulatedResults[0].total;
    simulatedResults.forEach(r => r.gap = r.total - poleTime);

    setTimeout(() => {
       setResults(simulatedResults);
       setIsSimulating(false);
       setPhase('FINISHED');
    }, 3000);
  };

  const handleFinish = () => {
    onComplete(results.map(r => r.driver));
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
       <div className="flex justify-between items-center bg-black/60 p-6 rounded-xl border-b-2 border-racing-neon shadow-2xl">
        <div>
          <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter text-white">Grid <span className="text-racing-red">Shootout</span></h2>
          <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-1">{track.name} • Final Qualifying Results</p>
        </div>
        <div className="text-right">
           {phase === 'READY' && (
              <button 
                onClick={simulateLap}
                className="px-8 py-3 bg-white text-black font-black uppercase rounded-lg hover:bg-racing-neon transition-all text-sm tracking-widest shadow-lg"
              >
                Run Fast Lap
              </button>
           )}
           {phase === 'FINISHED' && (
              <button 
                onClick={handleFinish}
                className="px-8 py-3 bg-f1-red text-white font-black uppercase rounded-lg hover:bg-red-700 transition-all text-sm tracking-widest shadow-lg"
              >
                Accept Grid
              </button>
           )}
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-slate-900 shadow-2xl">
         <div className="grid grid-cols-12 bg-black p-4 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] border-b border-slate-900 px-6">
            <div className="col-span-1">P</div>
            <div className="col-span-4">Driver</div>
            <div className="col-span-2 text-right">Sector 1</div>
            <div className="col-span-2 text-right">Sector 2</div>
            <div className="col-span-2 text-right">Sector 3</div>
            <div className="col-span-1 text-right">Delta</div>
         </div>

         <div className="flex-1 overflow-y-auto p-2 scrollbar-hide relative bg-black/20">
            {isSimulating && results.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
                  <div className="text-center space-y-6">
                     <div className="text-4xl md:text-6xl font-display font-black text-white italic animate-pulse tracking-tighter">SIMULATING FAST LAPS</div>
                     <div className="w-80 h-1.5 bg-slate-900 rounded-full overflow-hidden mx-auto border border-slate-800">
                        <div className="h-full bg-racing-neon animate-[width_3s_ease-in-out] shadow-[0_0_15px_#06b6d4]"></div>
                     </div>
                  </div>
               </div>
            )}

            {results.map((r, idx) => (
               <div 
                 key={r.driver.id}
                 className={`
                   grid grid-cols-12 items-center p-3 px-6 mb-1 rounded border-l-2 transition-all animate-slide-in-right
                   ${r.isPlayer ? 'bg-racing-gold/5 border-racing-gold shadow-[inset_0_0_20px_rgba(251,191,36,0.02)]' : 'bg-transparent border-transparent hover:bg-white/5'}
                   ${idx === 0 ? 'text-racing-neon' : 'text-slate-300'}
                 `}
                 style={{ animationDelay: `${idx * 50}ms` }}
               >
                  <div className="col-span-1 font-mono font-black text-xl italic text-slate-700">{idx + 1}</div>
                  <div className="col-span-4 flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full border border-slate-800 bg-black shrink-0 flex items-center justify-center text-[10px] font-bold text-racing-neon ${r.isPlayer ? 'ring-1 ring-racing-gold' : ''}`}>
                        {getInitials(r.driver.name)}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className={`font-black uppercase italic text-[13px] tracking-tight truncate ${r.isPlayer ? 'text-white' : ''}`}>{r.driver.name}</span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{r.driver.team}</span>
                     </div>
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-500 text-[11px]">{(r.sector1 / 1000).toFixed(3)}</div>
                  <div className="col-span-2 text-right font-mono text-slate-500 text-[11px]">{(r.sector2 / 1000).toFixed(3)}</div>
                  <div className="col-span-2 text-right font-mono text-slate-500 text-[11px]">{(r.sector3 / 1000).toFixed(3)}</div>
                  <div className="col-span-1 text-right font-mono font-black text-[12px] whitespace-nowrap">
                     {idx === 0 ? formatTime(r.total).split(':').slice(1).join(':') : `+${(r.gap / 1000).toFixed(3)}`}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default QualifyingSession;