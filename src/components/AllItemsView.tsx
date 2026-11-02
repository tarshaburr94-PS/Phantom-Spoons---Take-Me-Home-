import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Check, ArrowRight, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { Item, HomeLocation } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface AllItemsViewProps {
  items: Item[];
  homes: HomeLocation[];
  onSelectItem: (item: Item) => void;
  onOpenAddItem: () => void;
  onUpdateStatus: (itemId: string, newStatus: Item['currentStatus'], logNote?: string) => void;
}

export const AllItemsView: React.FC<AllItemsViewProps> = ({
  items,
  homes,
  onSelectItem,
  onOpenAddItem,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [selectedHomeFilter, setSelectedHomeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const homeMap = useMemo(() => {
    const map = new Map<string, HomeLocation>();
    homes.forEach((h) => map.set(h.id, h));
    return map;
  }, [homes]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category && i.category.trim()) {
        set.add(i.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const hasUncategorized = useMemo(() => {
    return items.some((i) => !i.category || i.category.trim() === '');
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        homeMap.get(item.homeLocationId)?.name.toLowerCase().includes(q) ||
        homeMap.get(item.homeLocationId)?.room.toLowerCase().includes(q);

      const matchesHome =
        selectedHomeFilter === 'all' || item.homeLocationId === selectedHomeFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' || item.currentStatus === selectedStatusFilter;

      const matchesCategory =
        selectedCategoryFilter === 'all'
          ? true
          : selectedCategoryFilter === 'uncategorized'
          ? !item.category || item.category.trim() === ''
          : item.category === selectedCategoryFilter;

      return matchesSearch && matchesHome && matchesStatus && matchesCategory;
    });
  }, [items, search, selectedHomeFilter, selectedStatusFilter, selectedCategoryFilter, homeMap]);

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-stone-900">
            Catalog of Tracked Essentials ({items.length})
          </h2>
          <p className="text-xs text-stone-500">
            Every item has a locked-in home to reduce decision fatigue and morning panic.
          </p>
        </div>

        <button
          onClick={onOpenAddItem}
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Category Quick Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-stone-400 font-medium mr-1 shrink-0">Category:</span>
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            selectedCategoryFilter === 'all'
              ? 'bg-amber-900 text-white font-semibold shadow-2xs'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
        {hasUncategorized && (
          <button
            onClick={() => setSelectedCategoryFilter('uncategorized')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategoryFilter === 'uncategorized'
                ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Uncategorized ({items.filter((i) => !i.category).length})
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, category, room, or note..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-amber-700 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Status filter buttons (interactive segmented buttons) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setSelectedStatusFilter('at_home')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatusFilter === 'at_home'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              At Home
            </button>
            <button
              onClick={() => setSelectedStatusFilter('with_me')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatusFilter === 'with_me'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              With Me
            </button>
            <button
              onClick={() => setSelectedStatusFilter('misplaced')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatusFilter === 'misplaced'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Misplaced
            </button>
          </div>

          {/* Home filter dropdown */}
          <select
            value={selectedHomeFilter}
            onChange={(e) => setSelectedHomeFilter(e.target.value)}
            aria-label="Filter by designated home"
            className="px-2.5 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-amber-700"
          >
            <option value="all">All Designated Homes</option>
            {homes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.room ? `${h.room} - ${h.name}` : h.name}
              </option>
            ))}
          </select>

          {(selectedHomeFilter !== 'all' || selectedStatusFilter !== 'all' || selectedCategoryFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedHomeFilter('all');
                setSelectedStatusFilter('all');
                setSelectedCategoryFilter('all');
              }}
              className="text-xs text-amber-800 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Items List / Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 space-y-2">
          <p className="text-sm font-medium">No items matched your current filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedHomeFilter('all');
              setSelectedStatusFilter('all');
              setSelectedCategoryFilter('all');
            }}
            className="text-xs text-amber-800 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const home = homeMap.get(item.homeLocationId);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:border-amber-800/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ItemArtwork
                        illustration={item.stickerIllustration}
                        name={item.name}
                        photoUrl={item.photoUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        {item.category && (
                          <span className="text-[11px] text-stone-400 font-medium block">
                            {item.category}
                          </span>
                        )}
                        <h3
                          onClick={() => onSelectItem(item)}
                          className="text-sm font-bold text-stone-900 font-display hover:text-amber-900 cursor-pointer truncate"
                        >
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                        item.currentStatus === 'at_home'
                          ? 'text-emerald-700'
                          : item.currentStatus === 'with_me'
                          ? 'text-sky-700'
                          : 'text-rose-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.currentStatus === 'at_home'
                            ? 'bg-emerald-600'
                            : item.currentStatus === 'with_me'
                            ? 'bg-sky-600'
                            : 'bg-rose-600'
                        }`}
                      />
                      {item.currentStatus === 'at_home' && 'At Home'}
                      {item.currentStatus === 'with_me' && 'With Me'}
                      {item.currentStatus === 'misplaced' && 'Misplaced'}
                    </span>
                  </div>

                  {/* Home Location Landmark */}
                  <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-950 font-semibold mb-0.5">
                      <MapPin size={13} className="text-amber-700 shrink-0" />
                      <span className="truncate">Home: {home?.room} → {home?.name}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {home?.specificSpot}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-stone-400 truncate max-w-[120px]">
                    {item.nfcTagUid}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.currentStatus !== 'at_home' && (
                      <button
                        onClick={() => {
                          sounds.playHomeChime();
                          onUpdateStatus(
                            item.id,
                            'at_home',
                            `Returned home to ${home?.name || 'Home'}`
                          );
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check size={12} />
                        <span>Dock Home</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectItem(item)}
                      className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
