import React, { useState, useEffect } from 'react';
import {
  Droplets,
  GlassWater,
  Sparkles,
  Radio,
  Check,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings2,
  Bell,
  BellOff,
  Flame,
  Award
} from 'lucide-react';
import { waterTrackerService, WaterTrackerState } from '../services/waterTrackerService';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface WaterTrackerCardProps {
  onOpenScanner?: () => void;
  onSpoonBonus?: (spoons: number) => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  onOpenScanner,
  onSpoonBonus,
}) => {
  const [state, setState] = useState<WaterTrackerState>(() => waterTrackerService.getState());
  const [showHistory, setShowHistory] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [justLoggedToast, setJustLoggedToast] = useState<string | null>(null);
  const [timeSinceSip, setTimeSinceSip] = useState<string>('No sips yet today');
  const [isOverdueSip, setIsOverdueSip] = useState(false);

  useEffect(() => {
    const unsub = waterTrackerService.subscribe((s) => {
      setState(s);
    });
    return unsub;
  }, []);

  // Update time since last sip every 30 seconds
  useEffect(() => {
    const calculateTime = () => {
      if (!state.lastSipTimestamp) {
        setTimeSinceSip('No sips yet today');
        setIsOverdueSip(false);
        return;
      }

      const diffMs = Date.now() - state.lastSipTimestamp;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        setTimeSinceSip('Just now');
        setIsOverdueSip(false);
      } else if (diffMins < 60) {
        setTimeSinceSip(`${diffMins}m ago`);
        setIsOverdueSip(diffMins >= state.reminderIntervalMinutes);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeSinceSip(`${hours}h ${mins}m ago`);
        setIsOverdueSip(true);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000);
    return () => clearInterval(interval);
  }, [state.lastSipTimestamp, state.reminderIntervalMinutes]);

  const percentage = Math.min(100, Math.round((state.currentMlToday / state.dailyGoalMl) * 100));
  const isGoalReached = state.currentMlToday >= state.dailyGoalMl;

  const handleQuickAdd = (amount: number, label: string) => {
    const res = waterTrackerService.logIntake(amount, 'manual', label);
    setJustLoggedToast(`+${amount}ml logged! (${res.currentTotal} / ${state.dailyGoalMl} ml)`);
    if (res.spoonsEarned > 0 && onSpoonBonus) {
      onSpoonBonus(res.spoonsEarned);
    }
    setTimeout(() => setJustLoggedToast(null), 3500);
  };

  const handleSimulateBottleNfc = () => {
    const res = waterTrackerService.logViaNfc('04:88:1A:2B:3C:4D:08'); // Insulated Water Bottle tag
    if (res) {
      setJustLoggedToast(`✨ NFC Bottle Tap recognized! +${res.amountMl}ml (24oz) logged.`);
      setTimeout(() => setJustLoggedToast(null), 4000);
    }
  };

  const handleSimulateCarafeNfc = () => {
    const res = waterTrackerService.logViaNfc('04:88:1A:2B:3C:4D:09'); // Carafe tag
    if (res) {
      setJustLoggedToast(`✨ NFC Carafe Pour recognized! +${res.amountMl}ml glass logged.`);
      setTimeout(() => setJustLoggedToast(null), 4000);
    }
  };

  const handleUndo = () => {
    const undone = waterTrackerService.undoLastLog();
    if (undone) {
      setJustLoggedToast('Last sip log undone.');
      setTimeout(() => setJustLoggedToast(null), 3000);
    }
  };

  const todayStr = new Date().toDateString();
  const todaysLogs = state.history.filter(
    (l) => new Date(l.timestamp).toDateString() === todayStr
  );

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden shadow-xs ${
        isGoalReached
          ? 'bg-gradient-to-br from-sky-50/90 via-cyan-50/70 to-emerald-50/60 border-sky-300'
          : 'bg-[#F6FAF9] border-stone-200/90'
      }`}
    >
      {/* Background aquatic flow watermark */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-sky-200/20 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-teal-200/15 blur-2xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <ItemArtwork
            illustration="water-bottle"
            name="Insulated Water Bottle"
            size="md"
            showNfcCoil={true}
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-sky-900 font-display flex items-center gap-1">
                <Droplets size={13} className="text-sky-600" />
                ADHD Hydration Rhythm
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-600 font-mono tabular-nums">
                {todaysLogs.length} sips logged today
              </span>
              <span aria-hidden="true">·</span>
              <span className={`font-medium ${isOverdueSip ? 'text-amber-700 font-semibold' : 'text-stone-500'}`}>
                Last sip: {timeSinceSip}
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-display mt-0.5 flex items-center gap-2">
              <span>Kitchen Hydration & Bottle Tracker</span>
              {isGoalReached && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Award size={12} /> Target Met!
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-600">
              Tap your 25mm NFC bottle sticker (<code className="font-mono text-[11px] bg-stone-100 px-1 rounded">04:88:1A:2B:3C:4D:08</code>) or quick-log below.
            </p>
          </div>
        </div>

        {/* Target display & spoons */}
        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-right">
            <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              Daily Target
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-sky-950 flex items-baseline justify-end gap-1">
              <span>{state.currentMlToday.toLocaleString()}</span>
              <span className="text-xs font-normal text-stone-500">/ {state.dailyGoalMl.toLocaleString()} ml</span>
            </div>
            <div className="text-[11px] text-teal-800 font-medium">
              ⚡ +{state.spoonsRestoredToday} Spoons Preserved
            </div>
          </div>

          <button
            onClick={() => setShowGoalModal(!showGoalModal)}
            title="Adjust hydration goal"
            className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center transition-colors"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Goal Adjustment Mini Dropdown */}
      {showGoalModal && (
        <div className="my-3 p-3.5 bg-white rounded-xl border border-sky-200 shadow-sm animate-in fade-in duration-150 relative z-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-stone-800 font-display block">Custom Daily Hydration Target</span>
              <span className="text-stone-500">Select standard target based on daily physical movement and sensory needs:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1500, 2000, 2500, 3000].map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    waterTrackerService.setDailyGoal(goal);
                    setShowGoalModal(false);
                    sounds.playScanChime();
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    state.dailyGoalMl === goal
                      ? 'bg-sky-700 text-white font-semibold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {goal} ml ({Math.round(goal / 250)} cups)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gentle Overdue Sip Warning (Non-punitive, ADHD gentle prompt) */}
      {isOverdueSip && (
        <div className="mt-3.5 px-3.5 py-2.5 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-700 shrink-0" />
            <span>
              <strong>Brain fog check:</strong> It has been {timeSinceSip} since your last sip. Take a quick sip now to restore executive functioning!
            </span>
          </div>
          <button
            onClick={() => handleQuickAdd(250, 'Overdue Sip Swig')}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-lg shrink-0 transition-colors"
          >
            Sip +250ml
          </button>
        </div>
      )}

      {/* Visual Water Fill Meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-stone-600 flex items-center gap-1">
            <GlassWater size={13} className="text-sky-600" />
            <span>Fluid Reservoir Level</span>
          </span>
          <span className="font-mono text-sky-900 font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-3.5 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-300/60 relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
              isGoalReached
                ? 'bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500'
                : 'bg-gradient-to-r from-sky-400 via-sky-500 to-teal-500'
            }`}
            style={{ width: `${percentage}%` }}
          >
            {/* Water surface shimmer */}
            <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Logging Buttons & NFC Tap */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
        <button
          onClick={() => handleQuickAdd(250, 'Glass of Water (8oz)')}
          className="p-2.5 rounded-xl bg-white hover:bg-sky-50/80 border border-stone-200 hover:border-sky-300 text-stone-800 transition-all flex flex-col items-center justify-center gap-1 text-center group shadow-2xs"
        >
          <span className="text-sm">💧</span>
          <span className="text-xs font-semibold group-hover:text-sky-800">
            +250 ml Glass
          </span>
          <span className="text-[10px] text-stone-400 font-mono">1 Standard Cup (8oz)</span>
        </button>

        <button
          onClick={() => handleQuickAdd(500, 'Tall Glass / Carafe Pour')}
          className="p-2.5 rounded-xl bg-white hover:bg-sky-50/80 border border-stone-200 hover:border-sky-300 text-stone-800 transition-all flex flex-col items-center justify-center gap-1 text-center group shadow-2xs"
        >
          <span className="text-sm">🚰</span>
          <span className="text-xs font-semibold group-hover:text-sky-800">
            +500 ml Tall
          </span>
          <span className="text-[10px] text-stone-400 font-mono">Pint / Mug (16oz)</span>
        </button>

        <button
          onClick={() => handleQuickAdd(750, 'Insulated Flask Refill')}
          className="p-2.5 rounded-xl bg-white hover:bg-sky-50/80 border border-stone-200 hover:border-sky-300 text-stone-800 transition-all flex flex-col items-center justify-center gap-1 text-center group shadow-2xs"
        >
          <span className="text-sm">🧊</span>
          <span className="text-xs font-semibold group-hover:text-sky-800">
            +750 ml Bottle
          </span>
          <span className="text-[10px] text-stone-400 font-mono">Full Flask (24oz)</span>
        </button>

        {/* Tap Physical NFC Bottle Tag shortcut */}
        <button
          onClick={handleSimulateBottleNfc}
          className="p-2.5 rounded-xl bg-gradient-to-br from-sky-600 to-teal-700 hover:from-sky-700 hover:to-teal-800 text-white font-medium transition-all flex flex-col items-center justify-center gap-1 text-center shadow-xs group"
        >
          <div className="flex items-center gap-1">
            <Radio size={14} className="text-sky-200 animate-pulse" />
            <span className="text-xs font-bold font-display">Tap Bottle NFC</span>
          </div>
          <span className="text-[10px] text-sky-100 font-mono">NTAG 25mm Sticker</span>
        </button>
      </div>

      {/* Success Notification Feedback */}
      {justLoggedToast && (
        <div className="mt-3 px-3.5 py-2 bg-sky-900 text-sky-100 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span className="font-medium">{justLoggedToast}</span>
          </div>
          <button
            onClick={handleUndo}
            className="text-[11px] font-semibold text-sky-300 hover:text-white underline ml-2"
          >
            Undo
          </button>
        </div>
      )}

      {/* Bottom Accordion: History & Gentle Reminder Settings */}
      <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 hover:text-stone-800 transition-colors font-medium text-stone-700"
        >
          <span>Today's Drinks ({todaysLogs.length})</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateCarafeNfc}
            title="Simulate NFC Carafe Pour"
            className="hover:text-sky-900 text-[11px] text-sky-700 transition-colors flex items-center gap-1"
          >
            <span>Carafe Tap (+250ml)</span>
          </button>

          {todaysLogs.length > 0 && (
            <button
              onClick={handleUndo}
              className="hover:text-stone-800 transition-colors flex items-center gap-1 text-stone-500"
              title="Undo last log"
            >
              <RotateCcw size={12} />
              <span>Undo Last</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded History List */}
      {showHistory && (
        <div className="mt-3 space-y-2 border-t border-stone-200/60 pt-3 animate-in fade-in duration-150">
          {todaysLogs.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-2 text-center">
              No hydration logs recorded yet today. Take a sip and tap a button above!
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {todaysLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-stone-200/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-stone-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-medium text-stone-800">{log.itemName || 'Water'}</span>
                    {log.method === 'nfc_tap' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        NFC Tag
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-sky-900">+{log.amountMl} ml</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
