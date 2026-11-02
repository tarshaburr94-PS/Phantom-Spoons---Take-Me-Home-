import React, { useState, useEffect } from 'react';
import { Pill, Radio, Sparkles, Check, ArrowRight, Maximize2, ShieldCheck, RefreshCw, Droplets } from 'lucide-react';
import { Item, HomeLocation } from '../types';
import { medTimerService, MedTimerState } from '../services/medTimerService';
import { waterTrackerService, WaterTrackerState } from '../services/waterTrackerService';
import { sounds } from '../services/soundEffects';

interface HomeScreenWidgetViewProps {
  items: Item[];
  homes: HomeLocation[];
  spoonsSaved: number;
  onOpenScanner: () => void;
  onSelectItem: (item: Item) => void;
  onExpandToFullApp: () => void;
  onAddSpoon?: () => void;
}

export const HomeScreenWidgetView: React.FC<HomeScreenWidgetViewProps> = ({
  items,
  homes,
  spoonsSaved,
  onOpenScanner,
  onSelectItem,
  onExpandToFullApp,
}) => {
  const [medState, setMedState] = useState<MedTimerState>(() => medTimerService.getState());
  const [waterState, setWaterState] = useState<WaterTrackerState>(() => waterTrackerService.getState());
  const [formattedRemaining, setFormattedRemaining] = useState<string>('3h 00m');
  const [isDue, setIsDue] = useState<boolean>(false);
  const [isTappedRing, setIsTappedRing] = useState<boolean>(false);
  const [isTappedWater, setIsTappedWater] = useState<boolean>(false);
  const [widgetSize, setWidgetSize] = useState<'medium' | 'small'>('medium');

  useEffect(() => {
    const unsubMed = medTimerService.subscribe((s) => setMedState(s));
    const unsubWater = waterTrackerService.subscribe((w) => setWaterState(w));
    return () => {
      unsubMed();
      unsubWater();
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      if (!medState.isActive) {
        setFormattedRemaining('Paused');
        setIsDue(false);
        return;
      }
      const remaining = medState.nextDueAt - Date.now();
      if (remaining <= 0) {
        setFormattedRemaining('Due Now!');
        setIsDue(true);
      } else {
        setIsDue(false);
        const totalSec = Math.floor(remaining / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        setFormattedRemaining(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [medState.nextDueAt, medState.isActive]);

  const handleTapMedRing = () => {
    sounds.playCheckInChime();
    sounds.triggerHaptic(50);
    medTimerService.completeDoseWithNFC('widget-nfc-ring-tap', 'NFC Med Ring (Widget)');
    setIsTappedRing(true);
    setTimeout(() => setIsTappedRing(false), 2000);
  };

  const handleTapWaterBottle = () => {
    sounds.playWaterChime();
    sounds.triggerHaptic(40);
    waterTrackerService.logIntake(250, 'widget', 'Quick Sip (Widget)');
    setIsTappedWater(true);
    setTimeout(() => setIsTappedWater(false), 2000);
  };

  // Find 4 priority items
  const priorityItems = items.filter((i) => i.spoonImpact === 'critical' || i.spoonImpact === 'high').slice(0, 4);

  return (
    <div className="bg-stone-900/90 text-stone-100 rounded-2xl p-4 sm:p-5 shadow-2xl border border-stone-700/60 backdrop-blur-xl relative overflow-hidden max-w-xl mx-auto">
      {/* Background ambient warmth */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400/40 shrink-0 shadow-xs">
            <img
              src="/assets/aistudio/unnamed__5__11efe0ac.jpg"
              alt="Phantom Spoons"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-amber-200/90 font-display">
              Phantom Spoons NFC
            </span>
            <span className="ml-2 text-[10px] text-stone-400 font-mono">Mobile Home Widget</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex bg-stone-800/80 p-0.5 rounded-lg border border-stone-700/60 text-[10px]">
            <button
              onClick={() => setWidgetSize('medium')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                widgetSize === 'medium' ? 'bg-amber-800/80 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              4x2
            </button>
            <button
              onClick={() => setWidgetSize('small')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                widgetSize === 'small' ? 'bg-amber-800/80 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2x2
            </button>
          </div>
          <button
            onClick={onExpandToFullApp}
            title="Expand to Full App"
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {widgetSize === 'small' ? (
        /* Small 2x2 Widget Representation */
        <div className="bg-stone-800/90 rounded-xl p-3.5 border border-stone-700/70 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <Pill size={12} className="text-amber-400" />
              <span>3h Meds</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                isDue ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-stone-700 text-stone-300'
              }`}
            >
              {formattedRemaining}
            </span>
          </div>

          <button
            onClick={handleTapMedRing}
            className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isTappedRing
                ? 'bg-emerald-600 text-white scale-98'
                : isDue
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 animate-bounce'
                : 'bg-stone-700 hover:bg-stone-600 text-amber-200'
            }`}
          >
            {isTappedRing ? (
              <>
                <Check size={14} className="animate-spin" />
                <span>Logged!</span>
              </>
            ) : (
              <>
                <Radio size={13} className="text-amber-300" />
                <span>Tap NFC Ring</span>
              </>
            )}
          </button>

          {/* Quick Water Row */}
          <div className="mt-2 pt-2 border-t border-stone-700/60 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-sky-300">
              <Droplets size={11} className="text-sky-400" />
              <span>{waterState.currentMlToday} / {waterState.dailyGoalMl}ml</span>
            </span>
            <button
              onClick={handleTapWaterBottle}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                isTappedWater
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-900/80 hover:bg-sky-800 text-sky-200'
              }`}
            >
              {isTappedWater ? '💧 +250ml' : '+ Sip'}
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-stone-700/60 flex items-center justify-between text-[10px] text-stone-400">
            <span>Spoons: {spoonsSaved}</span>
            <button
              onClick={onOpenScanner}
              className="text-amber-300 hover:text-amber-200 font-medium flex items-center gap-0.5"
            >
              Scan <ArrowRight size={10} />
            </button>
          </div>
        </div>
      ) : (
        /* Medium 4x2 Widget Representation */
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative z-10">
          {/* Left Column: 3h Meds Card */}
          <div className="sm:col-span-7 bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-amber-400/30">
                    <img
                      src="/assets/aistudio/an_isolated_standalone_whimsical_illustrated_die_cut_sticker_of_a_work_meds_355e0b79.png"
                      alt="Meds"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-semibold text-stone-200 truncate">{medState.medName}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isDue ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse' : 'bg-stone-700/80 text-stone-300'
                  }`}
                >
                  {isDue ? 'DUE NOW' : 'NEXT DOSE'}
                </span>
              </div>

              {/* Large countdown */}
              <div className="my-1.5">
                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white flex items-baseline gap-1">
                  <span>{formattedRemaining}</span>
                  {medState.dosesLoggedToday > 0 && (
                    <span className="text-[10px] text-stone-400 font-normal font-sans ml-1">
                      ({medState.dosesLoggedToday} taken today)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 1-Tap NFC Med Ring action */}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleTapMedRing}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  isTappedRing
                    ? 'bg-emerald-600 text-white scale-98'
                    : isDue
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/40 animate-pulse'
                    : 'bg-amber-900/70 hover:bg-amber-900 text-amber-100 border border-amber-700/50'
                }`}
              >
                {isTappedRing ? (
                  <>
                    <Check size={14} />
                    <span>Dose Logged (+3h Timer Reset)</span>
                  </>
                ) : (
                  <>
                    <Radio size={13} className="text-amber-300 animate-ping" />
                    <span>Tap NFC Med Ring</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Fast Retrieval & NFC Scanner */}
          <div className="sm:col-span-5 flex flex-col justify-between gap-2">
            <div className="bg-stone-800/80 rounded-xl p-3 border border-stone-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-stone-300 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Where is it?</span>
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono">⚡ {spoonsSaved} spoons</span>
              </div>

              {/* Priority quick-find chips */}
              <div className="space-y-1.5">
                {priorityItems.map((item) => {
                  const home = homes.find((h) => h.id === item.homeLocationId);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="w-full text-left px-2 py-1.5 rounded-lg bg-stone-900/60 hover:bg-stone-700/80 transition-colors flex items-center justify-between text-xs group border border-stone-800"
                    >
                      <span className="font-medium text-stone-200 group-hover:text-amber-200 truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono truncate max-w-[80px]">
                        {home?.name || 'Home'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Water Bar */}
            <div className="bg-stone-800/80 rounded-xl p-2.5 border border-stone-700/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-sky-400/40">
                  <img
                    src="/assets/tiles/tile_water_bottle.png"
                    alt="Water"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-semibold text-stone-200 flex items-center gap-1.5">
                    <span>Hydration</span>
                    <span className="text-sky-400 font-mono text-[10px] font-bold">
                      {Math.min(100, Math.round((waterState.currentMlToday / waterState.dailyGoalMl) * 100))}%
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {waterState.currentMlToday} / {waterState.dailyGoalMl} ml
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleTapWaterBottle}
                  className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                    isTappedWater
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-900/90 hover:bg-sky-800 text-sky-200 border border-sky-700/50'
                  }`}
                >
                  <Droplets size={11} className="text-sky-300" />
                  <span>{isTappedWater ? '+250ml Logged!' : '+250ml Sip'}</span>
                </button>
              </div>
            </div>

            {/* Quick NFC tap button */}
            <button
              onClick={() => {
                sounds.triggerHaptic(30);
                onOpenScanner();
              }}
              className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 hover:text-white flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
            >
              <Radio size={13} className="text-amber-400" />
              <span>Quick NFC Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* Widget Footer Helper */}
      <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Home screen ready (PWA + Shortcuts)</span>
        </span>
        <button
          onClick={onExpandToFullApp}
          className="text-amber-300 hover:text-amber-200 font-medium flex items-center gap-1 hover:underline"
        >
          <span>Open Full App</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
};
