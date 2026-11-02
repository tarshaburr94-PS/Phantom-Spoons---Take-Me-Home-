import React, { useState } from 'react';
import { X, Plus, Sparkles, MapPin, Radio, Package } from 'lucide-react';
import { Item, HomeLocation, SpoonImpact } from '../types';
import { sounds } from '../services/soundEffects';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  homes: HomeLocation[];
  onAddItem: (item: Omit<Item, 'id' | 'totalRetrievals'>) => void;
  onAddHome: (home: Omit<HomeLocation, 'id'>) => string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  homes,
  onAddItem,
  onAddHome,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Keys');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [homeLocationId, setHomeLocationId] = useState(homes[0]?.id || '');
  const [spoonImpact, setSpoonImpact] = useState<SpoonImpact>('high');
  const [stickerIllustration, setStickerIllustration] = useState('house-keys');
  const [searchTip1, setSearchTip1] = useState('');
  const [searchTip2, setSearchTip2] = useState('');
  const [notes, setNotes] = useState('');

  // Inline location creator states
  const [showInlineHome, setShowInlineHome] = useState(false);
  const [inlineHomeName, setInlineHomeName] = useState('');
  const [inlineHomeSpot, setInlineHomeSpot] = useState('');

  const handleSaveInlineHome = () => {
    if (!inlineHomeName.trim()) return;
    const parts = inlineHomeName.split('-');
    let roomPart = 'General';
    let namePart = inlineHomeName.trim();
    if (parts.length > 1) {
      roomPart = parts[0].trim();
      namePart = parts.slice(1).join('-').trim();
    }
    const newId = onAddHome({
      name: namePart,
      room: roomPart,
      specificSpot: inlineHomeSpot.trim() || `Designated spot in ${inlineHomeName}`,
      color: 'amber',
      icon: 'MapPin',
      nfcTagUid: `04:E1:${Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
      ).join(':')}`,
    });
    setHomeLocationId(newId);
    setShowInlineHome(false);
    setInlineHomeName('');
    setInlineHomeSpot('');
    sounds.playScanChime();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !homeLocationId) return;

    const chosenHome = homes.find((h) => h.id === homeLocationId);

    const tips = [
      searchTip1.trim(),
      searchTip2.trim(),
      'Check current jacket or trousers pockets',
      'Check bag or backpack compartments',
    ].filter(Boolean);

    // Auto-generate standard 7-byte UID for NTAG213
    const generatedUid = `04:${Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    ).join(':')}`;

    onAddItem({
      name: name.trim(),
      category: category.trim() ? category.trim() : undefined,
      homeLocationId,
      currentStatus: 'at_home',
      lastKnownLocation: `${chosenHome?.name || 'Home'} (${chosenHome?.room || 'Designated Home'})`,
      lastUpdated: new Date().toISOString(),
      nfcTagUid: generatedUid,
      stickerIllustration,
      spoonImpact,
      searchTips: tips,
      notes: notes.trim(),
    });

    sounds.playHomeChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-bold">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Add Essential to "Things Have Homes"
              </h3>
              <p className="text-xs text-stone-500">
                Designate a permanent storage home so it won't become lost in the future
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work Laptop Charger, Sunglasses, Passport, Gym Bottle"
              required
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-600">
                  Category (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-xs text-amber-900 hover:underline"
                >
                  {isCustomCategory ? 'Choose Preset' : '+ Custom Category'}
                </button>
              </div>
              {isCustomCategory ? (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Electronics, Documents, Keys, Tools..."
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
                >
                  <option value="">(None / Uncategorized)</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Documents">Documents</option>
                  <option value="Keys">Keys</option>
                  <option value="Medication">Medication</option>
                  <option value="Everyday Carry">Everyday Carry</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Hydration">Hydration</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Tools">Tools</option>
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-600">
                  Designated Home *
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineHome(!showInlineHome)}
                  className="text-xs text-amber-900 hover:underline font-semibold"
                >
                  {showInlineHome ? 'Select Existing' : '+ Create New Location'}
                </button>
              </div>

              {!showInlineHome ? (
                <select
                  value={homeLocationId}
                  onChange={(e) => setHomeLocationId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
                >
                  {homes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.room ? `${h.room} - ${h.name}` : h.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-800/20 space-y-2 mt-1">
                  <span className="text-[11px] font-semibold text-amber-950 uppercase tracking-wide block">
                    Quick Create Custom Location
                  </span>
                  <input
                    type="text"
                    value={inlineHomeName}
                    onChange={(e) => setInlineHomeName(e.target.value)}
                    placeholder="e.g. Living Room - Top Shelf or Toolbox - Compartment A"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                  />
                  <input
                    type="text"
                    value={inlineHomeSpot}
                    onChange={(e) => setInlineHomeSpot(e.target.value)}
                    placeholder="Specific spot / landmarks (e.g. Upper shelf next to bookends)"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInlineHome(false)}
                      className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInlineHome}
                      disabled={!inlineHomeName.trim()}
                      className="px-3 py-1 text-xs font-semibold bg-amber-900 text-white rounded-lg hover:bg-amber-950 disabled:bg-stone-300 transition-colors"
                    >
                      Save & Select
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticker Illustration icon selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              25mm Coin Sticker Illustration Style
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[
                { id: 'house-keys', label: 'Keys' },
                { id: 'car-keys', label: 'Car Key' },
                { id: 'work-meds', label: 'Work Meds' },
                { id: 'pill-tower', label: 'Pill Tower' },
                { id: 'headphones', label: 'Headphones' },
                { id: 'water-bottle', label: 'Bottle' },
                { id: 'spring-water', label: 'Water' },
                { id: 'running-shoes', label: 'Shoes' },
                { id: 'slide-sandals', label: 'Sandals' },
                { id: 'street-runners', label: 'Runners' },
                { id: 'wicker-hamper', label: 'Hamper' },
              ].map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setStickerIllustration(style.id)}
                  className={`p-2 rounded-lg text-center text-xs font-medium border transition-colors ${
                    stickerIllustration === style.id
                      ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spoon impact */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Executive Cost if Misplaced (Spoon Theory)
            </label>
            <select
              value={spoonImpact}
              onChange={(e) => setSpoonImpact(e.target.value as SpoonImpact)}
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            >
              <option value="critical">Critical (Losing this ruins the entire morning/day)</option>
              <option value="high">High (Major stress and disruption)</option>
              <option value="medium">Medium (Annoying delay)</option>
              <option value="low">Low (Minor inconvenience)</option>
            </select>
          </div>

          {/* Usual Misplaced Spots / Search Tips */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-600">
              Guided Recovery Tips (Where do you usually leave it?)
            </label>
            <input
              type="text"
              value={searchTip1}
              onChange={(e) => setSearchTip1(e.target.value)}
              placeholder="e.g. Check kitchen island next to fruit bowl"
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
            <input
              type="text"
              value={searchTip2}
              onChange={(e) => setSearchTip2(e.target.value)}
              placeholder="e.g. Check inside daily work tote bag front pocket"
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Item Visual Notes / Reminders
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Black cable with white label, keep rolled up"
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:border-amber-700 focus:outline-none"
            />
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Designate Home & Bind NFC Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
