import React, { useEffect, useState } from 'react';
import { Driver } from '../types';
import { fetchRealDrivers } from '../services/geminiService';

interface DriverMarketProps {
  onHire: (drivers: Driver[]) => void;
  budget: number;
}

const DriverMarket: React.FC<DriverMarketProps> = ({ onHire, budget }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarket = async () => {
      setLoading(true);
      const data = await fetchRealDrivers();
      setDrivers(data);
      setLoading(false);
    };
    loadMarket();
  }, []);

  const toggleSelect = (driver: Driver) => {
    if (selected.find(d => d.id === driver.id)) {
      setSelected(selected.filter(d => d.id !== driver.id));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, driver]);
      }
    }
  };

  const totalCost = selected.reduce((sum, d) => sum + d.cost, 0);
  const canAfford = totalCost <= budget;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-racing-neon"></div>
        <p className="text-racing-neon font-mono text-lg animate-pulse">Scouting Global Databases via Google Search...</p>
      </div>
    );
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-tighter">Driver Market</h2>
          <p className="text-slate-400">Select 2 drivers for your team.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 font-mono">Budget: ${budget}M</p>
          <p className={`text-xl font-bold font-mono ${canAfford ? 'text-green-400' : 'text-red-500'}`}>
            Cost: ${totalCost}M
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
        {drivers.map(driver => {
          const isSelected = selected.find(d => d.id === driver.id);
          return (
            <div 
              key={driver.id}
              onClick={() => toggleSelect(driver)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between
                ${isSelected 
                  ? 'border-racing-neon bg-racing-neon/10' 
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{driver.team}</span>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-black text-racing-gold border border-racing-gold/20">
                    {driver.rating} OVR
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-black border border-slate-700 overflow-hidden shrink-0 shadow-lg flex items-center justify-center text-xl font-bold text-racing-neon">
                      {getInitials(driver.name)}
                  </div>
                  <div className="min-w-0">
                      <h3 className="text-lg font-bold leading-tight text-white uppercase italic truncate">{driver.name}</h3>
                      <p className="text-xs text-slate-400 mb-1">{driver.nationality}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-mono font-bold text-racing-neon">${driver.cost}M</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Exp: {driver.contractExpiryYear}</div>
                      </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-slate-700/50 relative z-10">
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Wins</div>
                    <div className="text-xs font-mono font-bold text-white">{driver.stats.wins}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Poles</div>
                    <div className="text-xs font-mono font-bold text-white">{driver.stats.poles}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Podiums</div>
                    <div className="text-xs font-mono font-bold text-white">{driver.stats.podiums}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Titles</div>
                    <div className="text-xs font-mono font-bold text-racing-gold">{driver.stats.championships}</div>
                  </div>
                </div>
              </div>

              {/* Background accent */}
              <div className="absolute -bottom-4 -right-4 text-6xl font-black text-white/5 italic select-none pointer-events-none">
                {driver.id.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          onClick={() => onHire(selected)}
          disabled={selected.length !== 2 || !canAfford}
          className={`
            px-8 py-3 rounded-lg font-bold uppercase tracking-wider transition-all
            ${selected.length === 2 && canAfford
              ? 'bg-racing-red text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }
          `}
        >
          Sign Drivers
        </button>
      </div>
    </div>
  );
};

export default DriverMarket;