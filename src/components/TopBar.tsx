import React, { useState, useEffect } from 'react';
import { Plus, Radio, Volume2, VolumeX, Pill, Smartphone } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { medTimerService, MedTimerState } from '../services/medTimerService';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  onOpenWidgetModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddItem,
  onOpenScanner,
  onOpenWidgetModal,
  soundEnabled,
  onToggleSound,
}) => {
  const [medState, setMedState] = useState<MedTimerState>(() => medTimerService.getState());
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isDue, setIsDue] = useState<boolean>(false);

  useEffect(() => {
    const unsub = medTimerService.subscribe((s) => {
      setMedState(s);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const update = () => {
      if (!medState.isActive) {
        setTimeRemaining('Paused');
        setIsDue(false);
        return;
      }
      const remaining = medState.nextDueAt - Date.now();
      if (remaining <= 0) {
        setTimeRemaining('Due Now');
        setIsDue(true);
      } else {
        setIsDue(false);
        const totalMinutes = Math.ceil(remaining / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [medState.nextDueAt, medState.isActive]);
  return (
    <header className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (Single text element with subtle jar badge) */}
        <button
          onClick={() => onSelectTab('retrieve')}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-lg p-0.5"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-900/20 shrink-0 bg-amber-50">
            <img
              src="/assets/aistudio/unnamed__5__11efe0ac.jpg"
              alt="Phantom Spoons"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-lg font-bold font-display tracking-tight text-stone-900 whitespace-nowrap shrink-0">
            Phantom Spoons <span className="text-xs font-normal text-stone-500 font-sans tracking-normal hidden sm:inline">NFC</span>
          </span>
        </button>

        {/* Zone 2: Navigation links (single line, clean text with hover/active) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <button
            onClick={() => onSelectTab('retrieve')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'retrieve'
                ? 'text-amber-900 font-semibold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            Find Item
          </button>
          <button
            onClick={() => onSelectTab('items')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'items'
                ? 'text-amber-900 font-semibold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => onSelectTab('homes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'homes'
                ? 'text-amber-900 font-semibold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            Designated Homes
          </button>
          <button
            onClick={() => onSelectTab('stickers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'stickers'
                ? 'text-amber-900 font-semibold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            Sticker Sheet
          </button>
          <button
            onClick={() => onSelectTab('routine')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'routine'
                ? 'text-amber-900 font-semibold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            Evening Reset
          </button>
        </nav>

        {/* Zone 3: 1 primary action + sensory sound toggle & NFC tap trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Med Reminder Status */}
          <button
            onClick={() => {
              onSelectTab('retrieve');
              sounds.playScanChime();
            }}
            title={`3-Hour Med Timer: ${medState.medName}. Click to view med tracker.`}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap ${
              isDue
                ? 'bg-amber-100 border-amber-800 text-amber-950 font-bold animate-pulse'
                : 'bg-stone-100/90 hover:bg-stone-200/80 border-stone-200 text-stone-700'
            }`}
          >
            <Pill size={13} className={isDue ? 'text-amber-800' : 'text-stone-500'} />
            <span>Meds: {timeRemaining}</span>
          </button>

          <button
            onClick={onOpenWidgetModal}
            title="Phone Home Screen Widget & Shortcuts"
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors whitespace-nowrap shrink-0 border border-stone-200"
          >
            <Smartphone size={14} className="text-amber-800" />
            <span className="hidden sm:inline">Phone Widget</span>
          </button>

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Sensory sounds active (click to mute)' : 'Sensory sounds muted'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="w-9 h-9 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => {
              sounds.triggerHaptic(30);
              onOpenScanner();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors whitespace-nowrap shrink-0 border border-stone-200"
          >
            <Radio size={14} className="text-amber-700 animate-pulse" />
            <span>NFC Tap</span>
          </button>

          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </header>
  );
};
