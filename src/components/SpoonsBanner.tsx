import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Item } from '../types';

interface SpoonsBannerProps {
  items: Item[];
  spoonsSaved: number;
  onOpenRoutine: () => void;
  onOpenWidgetModal?: () => void;
}

export const SpoonsBanner: React.FC<SpoonsBannerProps> = ({
  items,
  spoonsSaved,
  onOpenRoutine,
  onOpenWidgetModal,
}) => {
  const atHomeCount = items.filter((i) => i.currentStatus === 'at_home').length;
  const withMeCount = items.filter((i) => i.currentStatus === 'with_me').length;
  const misplacedCount = items.filter((i) => i.currentStatus === 'misplaced').length;

  return (
    <section className="bg-[#FAF7F0] border-b border-stone-200/80 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Philosophy & Spoons counter */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-900 font-display flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-700" />
              Things Have Homes Principle
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-600 font-medium">
              Zero cognitive search friction
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="font-semibold text-amber-900 font-mono tabular-nums">
              {spoonsSaved} spoons preserved
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{atHomeCount} resting at home</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{withMeCount} in active use</span>
            {misplacedCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-rose-700 font-mono tabular-nums">
                  {misplacedCount} needing retrieval
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Gentle reassurance & Quick Evening Reset trigger & Home Widget */}
        <div className="flex items-center gap-2.5">
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>📱</span>
              <span>Phone Widget</span>
            </button>
          )}

          <button
            onClick={onOpenRoutine}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          >
            <CheckCircle2 size={13} className="text-amber-400" />
            <span>2-Min Evening Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
};
