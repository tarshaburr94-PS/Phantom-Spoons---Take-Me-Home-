import React, { useState } from 'react';
import { X, Check, Moon, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { Item, HomeLocation } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface EveningRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  homes: HomeLocation[];
  onCheckInItem: (itemId: string) => void;
  onCompletedRoutine: () => void;
}

export const EveningRoutineModal: React.FC<EveningRoutineModalProps> = ({
  isOpen,
  onClose,
  items,
  homes,
  onCheckInItem,
  onCompletedRoutine,
}) => {
  const essentialItemIds = [
    'item-house-keys',
    'item-car-keys',
    'item-work-meds',
    'item-rotary-pill-tower',
    'item-headphones',
    'item-water-bottle',
    'item-running-shoes',
  ];

  const routineItems = items.filter((i) => essentialItemIds.includes(i.id));

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    routineItems.forEach((i) => {
      initial[i.id] = i.currentStatus === 'at_home';
    });
    return initial;
  });

  const [allDone, setAllDone] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (item: Item) => {
    const currentChecked = checkedItems[item.id] || false;
    const nextState = !currentChecked;

    setCheckedItems((prev) => ({
      ...prev,
      [item.id]: nextState,
    }));

    if (nextState) {
      sounds.playHomeChime();
      sounds.triggerHaptic(30);
      onCheckInItem(item.id);
    } else {
      sounds.triggerHaptic(20);
    }

    // Check if everything is now checked
    const updated = { ...checkedItems, [item.id]: nextState };
    const allChecked = routineItems.every((i) => updated[i.id]);
    if (allChecked) {
      setAllDone(true);
      sounds.playHomeChime();
      onCompletedRoutine();
    }
  };

  const handleCompleteAll = () => {
    const next: Record<string, boolean> = {};
    routineItems.forEach((i) => {
      next[i.id] = true;
      onCheckInItem(i.id);
    });
    setCheckedItems(next);
    setAllDone(true);
    sounds.playHomeChime();
    onCompletedRoutine();
  };

  const completedCount = routineItems.filter((i) => checkedItems[i.id]).length;
  const progressPercent = Math.round((completedCount / routineItems.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF7F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center">
              <Moon size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Evening Put-Away & Spoon Preservation
              </h3>
              <p className="text-xs text-stone-600">
                2-minute peace of mind: Dock tomorrow's essentials home before bed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900 font-mono tabular-nums">
              {completedCount} of {routineItems.length}
            </span>
            <span>docked home</span>
          </div>
          <div className="flex items-center gap-2 w-32">
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-800 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-stone-500 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {allDone && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <Sparkles size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold font-display">
                  Tomorrow morning is protected!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Every essential has been returned to its home. You've preserved approximately 5 spoons of mental energy for tomorrow. Sleep soundly.
                </p>
              </div>
            </div>
          )}

          {routineItems.map((item) => {
            const home = homes.find((h) => h.id === item.homeLocationId);
            const isChecked = checkedItems[item.id] || false;

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isChecked
                    ? 'bg-emerald-50/50 border-emerald-200 text-stone-900'
                    : 'bg-white border-stone-200 hover:border-amber-700/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                    isChecked
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'border-stone-300 bg-stone-50'
                  }`}
                >
                  {isChecked && <Check size={14} />}
                </div>

                <ItemArtwork
                  illustration={item.stickerIllustration}
                  name={item.name}
                  photoUrl={item.photoUrl}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-stone-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-stone-400 shrink-0" />
                    <span className="truncate">Home: {home?.room} → {home?.name}</span>
                  </div>
                </div>

                <span className="text-[11px] text-stone-400 font-mono hidden sm:inline shrink-0">
                  {isChecked ? 'Resting at Home' : 'Tap to Dock'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={handleCompleteAll}
            className="text-xs font-semibold text-amber-900 hover:underline"
          >
            Mark All as Resting Home
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors"
          >
            Finished Reset
          </button>
        </div>
      </div>
    </div>
  );
};
