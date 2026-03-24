import React, { useState, useEffect } from 'react';
import { Driver, CarSetup, Track, RaceScenario } from '../types';

interface PracticeSessionProps {
  drivers: Driver[];
  track: Track;
  scenario: RaceScenario;
  onComplete: (setups: Record<string, CarSetup>, confidence: Record<string, number>) => void;
}

const DEFAULT_SETUP: CarSetup = {
  frontWing: 50,
  rearWing: 50,
  suspension: 50,
  gearing: 50
};

const PracticeSession: React.FC<PracticeSessionProps> = ({ drivers, track, scenario, onComplete }) => {
  const [activeDriverId, setActiveDriverId] = useState<string>(drivers[0].id);
  const [setups, setSetups] = useState<Record<string, CarSetup>>({
    [drivers[0].id]: { ...DEFAULT_SETUP },
    [drivers[1].id]: { ...DEFAULT_SETUP }
  });
  
  const [feedback, setFeedback] = useState<Record<string, string[]>>({
    [drivers[0].id]: ["Telemetry standby..."],
    [drivers[1].id]: ["Telemetry standby..."]
  });

  const [confidence, setConfidence] = useState<Record<string, number>>({
    [drivers[0].id]: 0,
    [drivers[1].id]: 0
  });

  const [runsRemaining, setRunsRemaining] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeSetup = setups[activeDriverId];

  const updateSetup = (key: keyof CarSetup, value: number) => {
    setSetups(prev => ({
      ...prev,
      [activeDriverId]: {
        ...prev[activeDriverId],
        [key]: value
      }
    }));
  };

  const getFeedbackMessage = (current: number, optimal: number, type: string) => {
    const diff = current - optimal;
    if (Math.abs(diff) <= 5) return `Perfect ${type} balance.`;
    if (diff > 20) return `${type} is way too high!`;
    if (diff > 5) return `Slightly too much ${type}.`;
    if (diff < -20) return `${type} is way too low!`;
    if (diff < -5) return `Need a bit more ${type}.`;
    return `Unknown ${type} feeling.`;
  };

  const handleSimulateRun = () => {
    if (runsRemaining <= 0) return;
    setIsSimulating(true);

    setTimeout(() => {
      const newConfidence: Record<string, number> = {};
      const newFeedback: Record<string, string[]> = {};

      drivers.forEach(d => {
        const s = setups[d.id];
        const opt = scenario.optimalSetup;
        const error = Math.abs(s.frontWing - opt.frontWing) +
                      Math.abs(s.rearWing - opt.rearWing) +
                      Math.abs(s.suspension - opt.suspension) +
                      Math.abs(s.gearing - opt.gearing);
        
        const conf = Math.max(50, Math.min(100, 100 - (error * 0.4)));
        newConfidence[d.id] = Math.floor(conf);

        const msgs = [];
        msgs.push(getFeedbackMessage(s.frontWing, opt.frontWing, "Front Wing"));
        msgs.push(getFeedbackMessage(s.rearWing, opt.rearWing, "Rear Wing"));
        msgs.push(getFeedbackMessage(s.suspension, opt.suspension, "Suspension Stiffness"));
        msgs.push(getFeedbackMessage(s.gearing, opt.gearing, "Gearing Ratio"));
        newFeedback[d.id] = msgs;
      });

      setConfidence(newConfidence);
      setFeedback(newFeedback);
      setRunsRemaining(prev => prev - 1);
      setIsSimulating(false);
    }, 1500);
  };

  const finishPractice = () => {
    onComplete(setups, confidence);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-black/60 p-6 rounded-xl border-b-2 border-racing-neon shadow-2xl">
        <div>
          <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter text-white">Engineering <span className="text-racing-neon">FP1</span></h2>
          <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-1">{track.name} • Setup Calibration</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest font-black">Session Capacity</div>
          <div className={`text-3xl font-mono font-bold ${runsRemaining === 0 ? 'text-f1-red' : 'text-white'}`}>
            {runsRemaining * 20} <span className="text-sm uppercase font-normal text-slate-600">min</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 border border-slate-900 shadow-2xl">
          <div className="flex bg-black p-1 rounded-lg border border-slate-800 gap-1">
             {drivers.map(d => (
               <button
                 key={d.id}
                 onClick={() => setActiveDriverId(d.id)}
                 className={`flex-1 py-2 flex items-center justify-center gap-2 rounded transition-all border ${activeDriverId === d.id ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent text-slate-600 border-transparent hover:text-white'}`}
               >
                 <div className={`w-8 h-8 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-[10px] font-bold text-racing-neon ${activeDriverId === d.id ? 'border-slate-300' : ''}`}>
                    {getInitials(d.name)}
                 </div>
                 <span className="font-black uppercase text-[11px] tracking-widest">
                   {d.name.split(' ').pop()}
                 </span>
               </button>
             ))}
          </div>

          <div className="flex-1 bg-black/40 rounded-lg p-4 border border-slate-900 overflow-y-auto scrollbar-hide">
             <h3 className="text-[9px] font-black uppercase text-slate-600 mb-4 tracking-widest border-b border-slate-900 pb-2">Driver Audio Log</h3>
             {feedback[activeDriverId].map((msg, i) => (
               <div key={i} className="mb-3 p-3 bg-black/60 rounded border-l-2 border-racing-neon text-xs text-slate-400 italic">
                 "{msg}"
               </div>
             ))}
          </div>

          <div className="text-center pt-4 border-t border-slate-900">
             <div className="text-[10px] uppercase text-slate-600 font-black tracking-widest mb-2">Confidence Level</div>
             <div className="text-5xl font-mono font-bold text-racing-neon">{confidence[activeDriverId]}%</div>
             <div className="w-full bg-slate-900 h-1 rounded-full mt-4 overflow-hidden border border-slate-800">
                <div className="bg-racing-neon h-full transition-all duration-1000 shadow-[0_0_10px_#06b6d4]" style={{ width: `${confidence[activeDriverId]}%` }}></div>
             </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-xl flex flex-col justify-center gap-10 relative border border-slate-900 shadow-2xl">
           {isSimulating && (
             <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center rounded-xl">
                <div className="text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-racing-neon mx-auto mb-4"></div>
                   <p className="text-racing-neon font-mono uppercase text-xs tracking-[0.3em] animate-pulse">Drivers Active On Track...</p>
                </div>
             </div>
           )}

           <div className="text-center border-b border-slate-900 pb-6">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Aerodynamic & Mechanical Settings</h3>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mt-1">Optimize for max performance output</p>
           </div>

           {[
             { key: 'frontWing', label: 'Front Wing Angle', min: 'Downforce -', max: 'Downforce +' },
             { key: 'rearWing', label: 'Rear Wing Angle', min: 'Drag -', max: 'Grip +' },
             { key: 'suspension', label: 'Suspension Stiffness', min: 'Soft', max: 'Stiff' },
             { key: 'gearing', label: 'Gear Ratio', min: 'Short', max: 'Long' },
           ].map((item) => (
             <div key={item.key}>
                <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">
                   <span>{item.label}</span>
                   <span className="font-mono text-racing-neon text-lg leading-none">{activeSetup[item.key as keyof CarSetup]}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={activeSetup[item.key as keyof CarSetup]}
                  onChange={(e) => updateSetup(item.key as keyof CarSetup, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-racing-neon"
                  disabled={runsRemaining === 0}
                />
                <div className="flex justify-between text-[9px] text-slate-700 uppercase mt-2 font-black tracking-widest">
                   <span>{item.min}</span>
                   <span>{item.max}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="flex flex-col gap-4">
           <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col items-center justify-center text-center bg-black/40 border border-slate-900 shadow-2xl">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">Live Run</h3>
              <p className="text-slate-500 text-xs mb-8 tracking-wide">Perform a 5-lap qualifying simulation to collect real-time data.</p>
              
              <button
                onClick={handleSimulateRun}
                disabled={runsRemaining === 0 || isSimulating}
                className={`
                  w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all border
                  ${runsRemaining > 0 
                    ? 'bg-white text-black border-white hover:bg-racing-neon hover:border-racing-neon shadow-2xl' 
                    : 'bg-transparent text-slate-800 border-slate-900 cursor-not-allowed'}
                `}
              >
                {runsRemaining > 0 ? 'Initiate Session' : 'No Runs Left'}
              </button>
           </div>

           <button
             onClick={finishPractice}
             className="w-full py-4 bg-f1-red text-white font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-700 transition-all shadow-2xl border border-f1-red text-sm"
           >
             Proceed to Quali Session
           </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;