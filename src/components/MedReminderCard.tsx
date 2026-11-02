import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  Radio, 
  Check, 
  RotateCcw, 
  Pause, 
  Play, 
  Sparkles, 
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { medTimerService, MedTimerState } from '../services/medTimerService';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface MedReminderCardProps {
  onOpenScanner?: () => void;
}

export const MedReminderCard: React.FC<MedReminderCardProps> = ({ onOpenScanner }) => {
  const [state, setState] = useState<MedTimerState>(() => medTimerService.getState());
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [justLoggedMessage, setJustLoggedMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = medTimerService.subscribe((s) => {
      setState(s);
    });
    return unsub;
  }, []);

  // Update countdown every second
  useEffect(() => {
    const update = () => {
      if (!state.isActive) {
        setTimeLeftMs(0);
        return;
      }
      const remaining = Math.max(0, state.nextDueAt - Date.now());
      setTimeLeftMs(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [state.nextDueAt, state.isActive]);

  const isDue = timeLeftMs === 0 && state.isActive;

  // Format time left
  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      100 - (timeLeftMs / (state.cycleHours * 3600 * 1000)) * 100
    )
  );

  const handleSimulateNfcTap = () => {
    const res = medTimerService.completeViaNfc('04:88:1A:2B:3C:4D:11'); // Work Meds Tag UID
    if (res) {
      setJustLoggedMessage(`✨ NFC Med Ring scanned! Dose logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Next 3hr cycle scheduled.`);
      setTimeout(() => setJustLoggedMessage(null), 5000);
    }
  };

  const handleSwitchInterval = (hours: number) => {
    medTimerService.start3HourTimer(hours, state.medItemId, state.medName);
    sounds.playScanChime();
  };

  const dosesToday = state.history.filter((h) => {
    const d = new Date(h.timestamp);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden shadow-xs ${
        isDue
          ? 'bg-amber-100/70 border-amber-800/40 ring-2 ring-amber-800/20'
          : 'bg-[#FAF7EE] border-stone-200/90'
      }`}
    >
      {/* Background copper coil watermark */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-4 border-amber-800/10 pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="flex items-center gap-3.5">
          <ItemArtwork
            illustration={state.medItemId === 'item-work-meds' ? 'work-meds' : 'pill-tower'}
            name={state.medName}
            size="md"
            showNfcCoil={true}
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-amber-900 font-display flex items-center gap-1">
                <Clock size={13} />
                {state.cycleHours}-Hour Med Interval
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-600 font-mono tabular-nums">{dosesToday} logged today</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-display mt-0.5">
              {state.medName}
            </h3>
            <p className="text-xs text-stone-600 italic">
              "Daily Dose: Rest & Gentleness. Tap your NFC med ring to complete."
            </p>
          </div>
        </div>

        {/* Live Timer Countdown & Pause Button */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-right">
            <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              {isDue ? 'Dose Due Now' : 'Next Dose In'}
            </div>
            <div
              className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${
                isDue ? 'text-amber-900 animate-pulse' : 'text-stone-900'
              }`}
            >
              {isDue ? '00:00:00' : formatCountdown(timeLeftMs)}
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              Due: {new Date(state.nextDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <button
            onClick={() => {
              medTimerService.togglePause();
              sounds.triggerHaptic(20);
            }}
            title={state.isActive ? 'Pause Timer' : 'Resume Timer'}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors shrink-0"
          >
            {state.isActive ? <Pause size={15} /> : <Play size={15} className="text-emerald-700" />}
          </button>
        </div>
      </div>

      {/* Progress Bar through 3-Hour Cycle */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
          <span>Cycle: {state.cycleHours} hours</span>
          <span>{Math.round(progressPercent)}% elapsed</span>
        </div>
        <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isDue ? 'bg-amber-600 animate-pulse' : 'bg-amber-800'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* NFC Completion Action Area */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Tap NFC Button */}
          <button
            onClick={handleSimulateNfcTap}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-all shadow-2xs flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Radio size={16} className="text-amber-300 animate-pulse" />
            <span>Tap NFC Med Ring (Log Dose)</span>
          </button>

          {/* Quick Hardware Scanner Link */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors"
            >
              Open NFC Scanner
            </button>
          )}

          <button
            onClick={() => medTimerService.completeManual()}
            className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline"
          >
            Log Manually
          </button>
        </div>

        {/* Interval Selector Buttons */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-stone-200 text-xs">
          <span className="text-[11px] text-stone-400 font-medium px-2">Cycle:</span>
          {[2, 3, 4].map((hrs) => (
            <button
              key={hrs}
              onClick={() => handleSwitchInterval(hrs)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                state.cycleHours === hrs
                  ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {hrs}h
            </button>
          ))}
        </div>
      </div>

      {/* Just logged celebration feedback */}
      {justLoggedMessage && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2 animate-in fade-in duration-300">
          <Check size={15} className="text-emerald-700 shrink-0" />
          <span className="font-medium">{justLoggedMessage}</span>
        </div>
      )}

      {/* Dose History Accordion */}
      {state.history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-200/60">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Pill size={13} className="text-amber-800" />
              <span>Medication Dose Log ({state.history.length} logged)</span>
            </span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {state.history.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-white/90 border border-stone-200/80 flex items-center justify-between text-xs text-stone-600"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.method === 'nfc_tap' ? 'bg-amber-600' : 'bg-stone-400'
                      }`}
                    />
                    <span className="font-medium text-stone-800">{log.itemName}</span>
                    <span className="text-[11px] text-stone-400">({log.method === 'nfc_tap' ? 'NFC Ring Tap' : 'Manual'})</span>
                  </div>
                  <span className="font-mono text-[11px] text-stone-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
