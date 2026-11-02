import React, { useState, useMemo } from 'react';
import { Search, MapPin, Check, AlertCircle, Compass, ArrowRight, CornerDownRight } from 'lucide-react';
import { Item, HomeLocation } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface QuickFinderProps {
  items: Item[];
  homes: HomeLocation[];
  onSelectItem: (item: Item) => void;
  onUpdateStatus: (itemId: string, newStatus: Item['currentStatus'], logNote?: string) => void;
  onOpenWidgetModal?: () => void;
}

export const QuickFinder: React.FC<QuickFinderProps> = ({
  items,
  homes,
  onSelectItem,
  onUpdateStatus,
  onOpenWidgetModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string>('item-house-keys');

  const homeMap = useMemo(() => {
    const map = new Map<string, HomeLocation>();
    homes.forEach((h) => map.set(h.id, h));
    return map;
  }, [homes]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.notes?.toLowerCase().includes(q) ||
        homeMap.get(item.homeLocationId)?.name.toLowerCase().includes(q) ||
        homeMap.get(item.homeLocationId)?.room.toLowerCase().includes(q)
    );
  }, [items, searchQuery, homeMap]);

  const activeItem = useMemo(() => {
    return items.find((i) => i.id === activeItemId) || filteredItems[0] || items[0];
  }, [items, activeItemId, filteredItems]);

  const activeHome = activeItem ? homeMap.get(activeItem.homeLocationId) : null;

  const handleReturnHome = (item: Item) => {
    sounds.playHomeChime();
    sounds.triggerHaptic([30, 40, 60]);
    onUpdateStatus(
      item.id,
      'at_home',
      `Returned safely to designated home: ${activeHome?.name || 'Home'}`
    );
  };

  const handleMarkMisplaced = (item: Item) => {
    sounds.playMisplacedTone();
    sounds.triggerHaptic([70, 50, 70]);
    onUpdateStatus(
      item.id,
      'misplaced',
      `Marked misplaced. Activating guided recovery protocol.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Input & Fast Selection Row */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="max-w-2xl">
          <label htmlFor="item-retriever-search" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Where is my...
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              id="item-retriever-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keys, work meds, water bottle, runners, headphones..."
              className="w-full pl-10 pr-4 py-3 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-amber-700 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Item Select Chips */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
            >
              <span>📱</span>
              <span>Phone Widget</span>
            </button>
          )}
          <span className="text-xs text-stone-400 shrink-0 font-medium mr-1">Quick Select:</span>
          {items.slice(0, 7).map((item) => {
            const isSelected = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItemId(item.id);
                  sounds.triggerHaptic(20);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-900 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus: The Designated Home Card */}
      {activeItem && activeHome && (
        <div className="bg-[#FAF7EE] border border-amber-900/15 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle background copper ring watermark */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-4 border-amber-800/10 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
            <div className="flex items-center gap-4">
              <ItemArtwork
                illustration={activeItem.stickerIllustration}
                name={activeItem.name}
                photoUrl={activeItem.photoUrl}
                size="lg"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  {activeItem.category && (
                    <>
                      <span>{activeItem.category}</span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span className="font-mono text-[11px] text-stone-400">UID: {activeItem.nfcTagUid}</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-stone-900">
                  {activeItem.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <span className="flex items-center gap-1 font-medium">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        activeItem.currentStatus === 'at_home'
                          ? 'bg-emerald-600'
                          : activeItem.currentStatus === 'with_me'
                          ? 'bg-sky-600'
                          : 'bg-rose-600'
                      }`}
                    />
                    {activeItem.currentStatus === 'at_home' && 'Resting at Designated Home'}
                    {activeItem.currentStatus === 'with_me' && 'Currently In Active Use (With You)'}
                    {activeItem.currentStatus === 'misplaced' && 'Marked Misplaced / Searching'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeItem.totalRetrievals} gentle returns logged</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {activeItem.currentStatus !== 'at_home' && (
                <button
                  onClick={() => handleReturnHome(activeItem)}
                  className="flex-1 lg:flex-initial px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Check size={14} />
                  <span>I Put It Back Home!</span>
                </button>
              )}
              {activeItem.currentStatus === 'at_home' && (
                <button
                  onClick={() => {
                    sounds.playScanChime();
                    onUpdateStatus(activeItem.id, 'with_me', 'Checked out into use');
                  }}
                  className="flex-1 lg:flex-initial px-4 py-2.5 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight size={14} className="text-stone-500" />
                  <span>Taking With Me</span>
                </button>
              )}
              {activeItem.currentStatus !== 'misplaced' && (
                <button
                  onClick={() => handleMarkMisplaced(activeItem)}
                  className="flex-1 lg:flex-initial px-3.5 py-2.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200/60 flex items-center justify-center gap-1.5"
                >
                  <AlertCircle size={14} />
                  <span>Can't Find It</span>
                </button>
              )}
              <button
                onClick={() => onSelectItem(activeItem)}
                className="px-3.5 py-2.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                Item Details
              </button>
            </div>
          </div>

          {/* Designated Home Spotlight */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 bg-white/90 backdrop-blur-xs rounded-xl p-5 border border-stone-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                <MapPin size={15} />
                <span>Designated Home Location</span>
              </div>
              <div className="text-base font-semibold text-stone-900 mb-1">
                {activeHome.room} <span className="text-stone-400 font-normal">→</span> {activeHome.name}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                {activeHome.specificSpot}
              </p>
              {activeHome.notes && (
                <div className="mt-3 text-xs text-stone-500 italic bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  "{activeHome.notes}"
                </div>
              )}
            </div>

            {/* Guided Recovery: Search Tips (No Panic Checklist) */}
            <div className="md:col-span-6 bg-white/90 backdrop-blur-xs rounded-xl p-5 border border-stone-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                <Compass size={15} className="text-stone-500" />
                <span>Misplaced? Check These Usual Spots First:</span>
              </div>
              <ul className="space-y-2 mt-2">
                {activeItem.searchTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 leading-snug">
                    <CornerDownRight size={13} className="text-amber-700 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Other Items for Quick Browsing */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-stone-900 font-display">
            All Monitored Essentials ({filteredItems.length})
          </h3>
          <span className="text-xs text-stone-500">
            Tap any item to view its designated home
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const home = homeMap.get(item.homeLocationId);
            const isSelected = item.id === activeItem?.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveItemId(item.id);
                  sounds.triggerHaptic(20);
                }}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-amber-800/40 ring-2 ring-amber-700/10 shadow-xs'
                    : 'border-stone-200/80 hover:border-stone-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ItemArtwork
                    illustration={item.stickerIllustration}
                    name={item.name}
                    photoUrl={item.photoUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <div className="text-xs text-stone-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-stone-600">{home?.room}</span>
                      <span className="text-stone-300">·</span>
                      <span className="truncate">{home?.name}</span>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.currentStatus === 'at_home'
                        ? 'bg-emerald-500'
                        : item.currentStatus === 'with_me'
                        ? 'bg-sky-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
