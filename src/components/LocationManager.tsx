import React, { useState } from 'react';
import { Plus, MapPin, Radio, Package, Trash2, Edit2, Sparkles, Check } from 'lucide-react';
import { HomeLocation, Item } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';

interface LocationManagerProps {
  homes: HomeLocation[];
  items: Item[];
  onAddHome: (home: Omit<HomeLocation, 'id'>) => void;
  onUpdateHome: (home: HomeLocation) => void;
  onDeleteHome: (homeId: string) => void;
  onSelectItem: (item: Item) => void;
  onOpenScanner: () => void;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  homes,
  items,
  onAddHome,
  onUpdateHome,
  onDeleteHome,
  onSelectItem,
  onOpenScanner,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('Entryway');
  const [specificSpot, setSpecificSpot] = useState('');
  const [notes, setNotes] = useState('');

  const roomsList = ['Entryway', 'Bedroom', 'Home Office', 'Kitchen', 'Living Room', 'Bathroom', 'Laundry Room', 'Vehicle'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specificSpot.trim()) return;

    onAddHome({
      name: name.trim(),
      room,
      specificSpot: specificSpot.trim(),
      notes: notes.trim(),
      color: 'amber',
      icon: 'MapPin',
      nfcTagUid: `04:E1:${Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
      ).join(':')}`,
    });

    setName('');
    setSpecificSpot('');
    setNotes('');
    setShowAddForm(false);
    sounds.playHomeChime();
  };

  // Group items by home
  const itemsByHome = new Map<string, Item[]>();
  homes.forEach((h) => itemsByHome.set(h.id, []));
  items.forEach((item) => {
    const list = itemsByHome.get(item.homeLocationId) || [];
    list.push(item);
    itemsByHome.set(item.homeLocationId, list);
  });

  return (
    <div className="space-y-6">
      {/* Title & Add Home Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-stone-900">
            Designated Home Locations
          </h2>
          <p className="text-xs text-stone-500">
            Every item has exactly one designated sanctuary where it rests when not in active use.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Designate New Home</span>
        </button>
      </div>

      {/* Add Home Form Card */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 font-display">
              Add New Designated Home
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Home Name / Vessel
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wooden Key Bowl, Ceramic Catchall Tray"
                required
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Room / Zone
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
              >
                {roomsList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Exact Spot & Visual Landmarks
            </label>
            <input
              type="text"
              value={specificSpot}
              onChange={(e) => setSpecificSpot(e.target.value)}
              placeholder="e.g. On entryway console table to the left of the front door next to brass lamp"
              required
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Gentle Habit Reminder / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Empty bowl weekly so essentials are always in clear view"
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-900 text-white rounded-lg hover:bg-amber-950 transition-colors"
            >
              Save Designated Home
            </button>
          </div>
        </form>
      )}

      {/* Homes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {homes.map((home) => {
          const homeItems = itemsByHome.get(home.id) || [];
          const atHomeCount = homeItems.filter((i) => i.currentStatus === 'at_home').length;

          return (
            <div
              key={home.id}
              className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:border-amber-800/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </span>
                    <div>
                      <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                        {home.room}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 font-display">
                        {home.name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs text-stone-500 font-mono tabular-nums">
                    {atHomeCount}/{homeItems.length} at home
                  </span>
                </div>

                <p className="mt-3 text-xs text-stone-600 leading-relaxed">
                  {home.specificSpot}
                </p>

                {home.notes && (
                  <p className="mt-2 text-[11px] text-stone-500 italic bg-[#FAF7EE] p-2 rounded-lg border border-amber-900/10">
                    "{home.notes}"
                  </p>
                )}

                {/* Assigned Items Badges */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    Designated Items ({homeItems.length}):
                  </div>

                  {homeItems.length === 0 ? (
                    <div className="text-xs text-stone-400 italic">
                      No items designated here yet.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {homeItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSelectItem(item)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors flex items-center gap-1.5"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.currentStatus === 'at_home'
                                ? 'bg-emerald-600'
                                : 'bg-stone-400'
                            }`}
                          />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Station NFC details & Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                <span className="font-mono">Station Tag: {home.nfcTagUid || 'No UID'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenScanner}
                    className="text-amber-800 hover:underline font-medium"
                  >
                    Tap Station
                  </button>
                  {homeItems.length === 0 && (
                    <button
                      onClick={() => onDeleteHome(home.id)}
                      className="text-rose-500 hover:text-rose-700"
                      title="Delete Home"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
