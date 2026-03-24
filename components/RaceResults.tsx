import React, { useState } from 'react';
import { RaceSimulationResponse, Driver } from '../types';

interface RaceResultsProps {
  results: RaceSimulationResponse;
  myDrivers: Driver[];
  onNextRace: () => void;
}

const RaceResults: React.FC<RaceResultsProps> = ({ results, myDrivers, onNextRace }) => {
  const [activeTab, setActiveTab] = useState<'class' | 'feed'>('class');

  const myDriverNames = myDrivers.map(d => d.name);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-display font-bold text-white uppercase italic tracking-tighter">Race De-Brief</h2>
           <p className="text-slate-400 max-w-2xl mt-2">{results.summary}</p>
        </div>
        <button
          onClick={onNextRace}
          className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-racing-neon hover:scale-[1.02] transition-all uppercase tracking-widest shadow-xl"
        >
          Return to HQ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-black/40 p-1 rounded-lg w-fit border border-slate-800 shadow-inner">
        <button
          onClick={() => setActiveTab('class')}
          className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'class' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Classification
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'feed' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Live Feed Replay
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden glass-panel rounded-xl border-t-4 border-racing-red shadow-2xl">
        {activeTab === 'class' ? (
          <div className="overflow-y-auto h-full p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-black/80 backdrop-blur z-10">
                <tr className="text-slate-600 border-b border-slate-800">
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Pos</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Driver</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Team</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-right">Gap</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.classification.map((row) => {
                  const isMyDriver = myDriverNames.includes(row.driverName);
                  return (
                    <tr 
                      key={row.position} 
                      className={`
                        group transition-colors
                        ${isMyDriver ? 'bg-racing-gold/5' : 'hover:bg-white/5'}
                      `}
                    >
                      <td className="p-4 font-mono font-black text-2xl italic text-slate-700 group-hover:text-white transition-colors">{row.position}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border border-slate-700 bg-black overflow-hidden shrink-0 transition-transform group-hover:scale-110 flex items-center justify-center text-[10px] font-bold text-racing-neon ${isMyDriver ? 'ring-2 ring-racing-gold' : ''}`}>
                             {getInitials(row.driverName)}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-black uppercase italic tracking-tighter ${isMyDriver ? 'text-racing-gold' : 'text-white'}`}>
                              {row.driverName}
                            </span>
                            {isMyDriver && <span className="text-[8px] font-bold text-racing-gold uppercase tracking-widest">Player Controlled</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 text-xs font-bold uppercase tracking-wider">{row.team}</td>
                      <td className="p-4 font-mono text-xs text-right text-slate-400">{row.gap}</td>
                      <td className="p-4 font-mono font-black text-racing-neon text-right">+{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-y-auto h-full p-6 space-y-4 scrollbar-hide">
            {results.commentary.map((log, idx) => (
              <div key={idx} className="flex gap-4 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="w-12 font-mono text-racing-neon text-[10px] font-bold pt-1">L{log.lap}</div>
                <div className="flex-1">
                  <div className={`
                    p-3 rounded-lg border-l-2 glass-panel shadow-sm
                    ${log.type === 'overtake' ? 'border-green-500 bg-green-500/5' : 
                      log.type === 'crash' ? 'border-red-500 bg-red-500/5' :
                      log.type === 'pitstop' ? 'border-racing-gold bg-racing-gold/5' :
                      'border-slate-700 bg-slate-800/20'}
                  `}>
                    <span className="text-[8px] uppercase font-black tracking-widest opacity-40 mb-1 block">{log.type}</span>
                    <p className="text-sm text-slate-300 tracking-wide">{log.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceResults;