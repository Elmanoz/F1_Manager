import React, { useState } from 'react';
import { DRIVERS_2026 } from '../services/geminiService';
import { Driver } from '../types';

interface TeamSetupProps {
  onComplete: (name: string, principal: string, colors: { primary: string; secondary: string }, drivers?: Driver[]) => void;
}

const CUSTOM_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#1e293b', // Slate
  '#ffffff', // White
  '#000000', // Black
];

const OFFICIAL_TEAMS = [
  { name: 'Red Bull Racing', principal: 'Christian Horner', primary: '#1e3a8a', secondary: '#fbbf24', drivers: ['ver', 'law'] },
  { name: 'Mercedes', principal: 'Toto Wolff', primary: '#e5e7eb', secondary: '#06b6d4', drivers: ['rus', 'ant'] },
  { name: 'Ferrari', principal: 'Frédéric Vasseur', primary: '#dc2626', secondary: '#fef08a', drivers: ['lec', 'ham'] },
  { name: 'McLaren', principal: 'Andrea Stella', primary: '#f97316', secondary: '#0f172a', drivers: ['nor', 'pia'] },
  { name: 'Aston Martin', principal: 'Mike Krack', primary: '#047857', secondary: '#d9f99d', drivers: ['alo', 'str'] },
  { name: 'Alpine', principal: 'Oliver Oakes', primary: '#2563eb', secondary: '#f472b6', drivers: ['gas', 'doo'] },
  { name: 'Williams', principal: 'James Vowles', primary: '#1d4ed8', secondary: '#000000', drivers: ['sai', 'alb'] },
  { name: 'RB', principal: 'Laurent Mekies', primary: '#3b82f6', secondary: '#ef4444', drivers: ['tsu', 'had'] },
  { name: 'Audi', principal: 'Jonathan Wheatley', primary: '#0f172a', secondary: '#ef4444', drivers: ['hul', 'bor'] },
  { name: 'Haas', principal: 'Ayao Komatsu', primary: '#000000', secondary: '#ffffff', drivers: ['oco', 'bea'] },
  { name: 'Cadillac', principal: 'Mario Andretti', primary: '#000000', secondary: '#eab308', drivers: ['bot', 'per'] },
];

const TeamSetup: React.FC<TeamSetupProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'CUSTOM' | 'OFFICIAL'>('CUSTOM');
  
  // Custom State
  const [teamName, setTeamName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  const [secondaryColor, setSecondaryColor] = useState('#1e293b');

  // Official State
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number | null>(null);

  // Derived Display Values
  const displayPrimary = mode === 'OFFICIAL' && selectedTeamIdx !== null ? OFFICIAL_TEAMS[selectedTeamIdx].primary : primaryColor;
  const displaySecondary = mode === 'OFFICIAL' && selectedTeamIdx !== null ? OFFICIAL_TEAMS[selectedTeamIdx].secondary : secondaryColor;
  const displayName = mode === 'OFFICIAL' && selectedTeamIdx !== null ? OFFICIAL_TEAMS[selectedTeamIdx].name : (teamName || 'YOUR TEAM');

  const handleSubmit = () => {
    if (mode === 'CUSTOM') {
      if (teamName && principalName) {
        onComplete(teamName, principalName, { primary: primaryColor, secondary: secondaryColor });
      }
    } else {
      if (selectedTeamIdx !== null) {
        const t = OFFICIAL_TEAMS[selectedTeamIdx];
        // Find actual driver objects
        const drivers = DRIVERS_2026.filter(d => t.drivers.includes(d.id));
        onComplete(t.name, t.principal, { primary: t.primary, secondary: t.secondary }, drivers);
      }
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Simplified Top-Down F1 Car SVG
  const CarPreview = () => (
    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={displayPrimary} stopOpacity="0.8" />
          <stop offset="50%" stopColor={displayPrimary} />
          <stop offset="100%" stopColor={displayPrimary} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d="M60,80 L140,80 L150,250 L140,360 L60,360 L50,250 Z" fill="black" opacity="0.4" filter="url(#glow)" transform="translate(5, 5)" />

      {/* Rear Wing */}
      <rect x="50" y="340" width="100" height="20" rx="2" fill={displaySecondary} />
      
      {/* Front Wing */}
      <path d="M40,50 L160,50 L150,70 L50,70 Z" fill={displaySecondary} />

      {/* Wheels */}
      <rect x="20" y="80" width="25" height="50" rx="4" fill="#111" /> {/* Front Left */}
      <rect x="155" y="80" width="25" height="50" rx="4" fill="#111" /> {/* Front Right */}
      <rect x="20" y="280" width="30" height="60" rx="4" fill="#111" /> {/* Rear Left */}
      <rect x="150" y="280" width="30" height="60" rx="4" fill="#111" /> {/* Rear Right */}

      {/* Main Body */}
      <path 
        d="M90,40 L110,40 L115,100 L135,160 L135,280 L120,340 L80,340 L65,280 L65,160 L85,100 Z" 
        fill="url(#bodyGrad)" 
        stroke={displaySecondary}
        strokeWidth="1"
      />

      {/* Nose Cone */}
      <path d="M90,40 L110,40 L100,20 Z" fill={displaySecondary} />

      {/* Sidepods */}
      <path d="M135,160 L155,170 L155,250 L135,260 Z" fill={displayPrimary} opacity="0.9" />
      <path d="M65,160 L45,170 L45,250 L65,260 Z" fill={displayPrimary} opacity="0.9" />

      {/* Cockpit / Halo */}
      <circle cx="100" cy="190" r="12" fill="#333" />
      <path d="M95,170 L105,170 L105,210 L95,210 Z" fill="#111" />
      
      {/* Driver Helmet */}
      <circle cx="100" cy="190" r="6" fill={displaySecondary} />

    </svg>
  );

  return (
    <div className="h-full w-full flex flex-col lg:flex-row animate-fade-in bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      
      {/* LEFT: Configuration Panel */}
      <div className="lg:w-1/2 p-6 flex flex-col bg-slate-800/50 backdrop-blur overflow-y-auto scrollbar-hide">
        <div className="mb-6">
          <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-wider">Team Launch <span className="text-racing-red">2026</span></h2>
          <p className="text-slate-400 text-sm">Create a new legacy or take control of an existing powerhouse.</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-lg mb-6 border border-slate-700 shadow-inner">
           <button 
             onClick={() => setMode('CUSTOM')}
             className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${mode === 'CUSTOM' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             Create Custom
           </button>
           <button 
             onClick={() => setMode('OFFICIAL')}
             className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${mode === 'OFFICIAL' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             Select Real Team
           </button>
        </div>

        {mode === 'CUSTOM' ? (
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Constructor Name</label>
              <input 
                type="text" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Velocity Racing"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-xl font-bold text-white focus:outline-none focus:border-racing-neon transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Team Principal</label>
              <input 
                type="text" 
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="e.g. Christian Horner"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-lg text-white focus:outline-none focus:border-racing-neon transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div>
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 block">Primary Livery Color</label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 block">Secondary Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setSecondaryColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${secondaryColor === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
             <div className="grid grid-cols-2 gap-3">
               {OFFICIAL_TEAMS.map((t, idx) => (
                 <div 
                   key={t.name}
                   onClick={() => setSelectedTeamIdx(idx)}
                   className={`
                     p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-700/50 shadow-sm
                     ${selectedTeamIdx === idx ? 'border-racing-neon bg-slate-800' : 'border-slate-700 bg-slate-900'}
                   `}
                 >
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }}></div>
                       <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: t.secondary }}></div>
                    </div>
                    <h3 className="font-black text-[12px] text-white leading-tight uppercase italic">{t.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">{t.principal}</p>
                 </div>
               ))}
             </div>
             
             {selectedTeamIdx !== null && (
               <div className="mt-6 p-4 bg-black/40 rounded-xl border border-slate-700 shadow-2xl animate-fade-in">
                  <h4 className="text-[10px] font-black uppercase text-slate-600 mb-4 tracking-widest border-b border-slate-800 pb-2">Contracted 2026 Lineup</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {DRIVERS_2026.filter(d => OFFICIAL_TEAMS[selectedTeamIdx].drivers.includes(d.id)).map(d => (
                      <div key={d.id} className="flex flex-col items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                         <div className="w-16 h-16 rounded-full border border-slate-700 bg-black shadow-lg flex items-center justify-center text-[10px] font-bold text-racing-neon">
                           {getInitials(d.name)}
                         </div>
                         <div className="text-center">
                            <span className="block font-black uppercase italic text-[11px] text-white truncate w-24">{d.name.split(' ').pop()}</span>
                            <div className="flex justify-center gap-2 mt-1">
                               <span className="text-[9px] font-mono text-racing-gold font-bold">Lvl {d.rating}</span>
                               <span className="text-[9px] font-mono text-slate-500">Exp: {d.contractExpiryYear}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-[9px] text-center text-slate-500 italic uppercase tracking-widest opacity-60">
                    Existing driver contracts will be inherited.
                  </div>
               </div>
             )}
          </div>
        )}

        <button 
          onClick={handleSubmit}
          disabled={mode === 'CUSTOM' ? (!teamName || !principalName) : (selectedTeamIdx === null)}
          className={`
            w-full mt-6 py-4 rounded-xl font-display font-black text-xl uppercase tracking-widest transition-all italic
            ${(mode === 'CUSTOM' && teamName && principalName) || (mode === 'OFFICIAL' && selectedTeamIdx !== null)
              ? 'bg-white text-black hover:bg-racing-neon hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }
          `}
        >
          {mode === 'CUSTOM' ? 'Initialize Factory' : 'Take Operational Lead'}
        </button>
      </div>

      {/* RIGHT: Visualization Panel */}
      <div className="lg:w-1/2 bg-black relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 transition-colors duration-1000"
          style={{ backgroundColor: displayPrimary }}
        ></div>

        <div className="relative z-10 w-64 h-auto transform transition-transform duration-700 hover:scale-110">
           <CarPreview />
        </div>

        <div className="absolute bottom-8 left-8 border-l-4 border-white pl-4">
           <p className="text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest">Aero Specification V1.26</p>
           <h3 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">{displayName}</h3>
        </div>
      </div>

    </div>
  );
};

export default TeamSetup;