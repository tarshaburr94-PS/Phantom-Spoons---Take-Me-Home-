import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Radio, 
  Check, 
  AlertCircle, 
  Compass, 
  Plus, 
  History, 
  Edit3, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Bell,
  Clock,
  BellRing,
  BellOff
} from 'lucide-react';
import { Item, HomeLocation, ScanEvent } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';
import { reminderService, ActiveReminder } from '../services/reminderService';

interface ItemDetailModalProps {
  item: Item | null;
  homes: HomeLocation[];
  logs: ScanEvent[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (itemId: string, newStatus: Item['currentStatus'], logNote?: string) => void;
  onOpenWriter: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem: (updatedItem: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  homes,
  logs,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenWriter,
  onDeleteItem,
  onUpdateItem,
}) => {
  const [newTipInput, setNewTipInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editHomeId, setEditHomeId] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Reminder state
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | undefined>(undefined);
  const [reminderDuration, setReminderDuration] = useState<number>(30); // default 30 min
  const [customInput, setCustomInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (!item) return;
    const update = () => {
      setActiveReminder(reminderService.getReminder(item.id));
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
    };
    update();
    const unsub = reminderService.subscribe(update);
    return unsub;
  }, [item]);

  if (!isOpen || !item) return null;

  const currentHome = homes.find((h) => h.id === item.homeLocationId);
  const itemLogs = logs.filter((l) => l.itemId === item.id);

  const startEdit = () => {
    setEditName(item.name);
    setEditCategory(item.category || '');
    setEditHomeId(item.homeLocationId);
    setEditNotes(item.notes || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    onUpdateItem({
      ...item,
      name: editName.trim() || item.name,
      category: editCategory.trim() ? editCategory.trim() : undefined,
      homeLocationId: editHomeId || item.homeLocationId,
      notes: editNotes.trim(),
    });
    setIsEditing(false);
  };

  const handleAddSearchTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTipInput.trim()) {
      onUpdateItem({
        ...item,
        searchTips: [...item.searchTips, newTipInput.trim()],
      });
      setNewTipInput('');
    }
  };

  const handleRemoveSearchTip = (index: number) => {
    const updated = item.searchTips.filter((_, idx) => idx !== index);
    onUpdateItem({
      ...item,
      searchTips: updated,
    });
  };

  const handleStatusChange = (status: Item['currentStatus']) => {
    if (status === 'at_home') {
      sounds.playHomeChime();
      reminderService.cancelReminder(item.id);
      onUpdateStatus(item.id, 'at_home', `Item docked in ${currentHome?.name || 'Home'}`);
    } else if (status === 'misplaced') {
      sounds.playMisplacedTone();
      onUpdateStatus(item.id, 'misplaced', 'Marked misplaced from detail view');
    } else {
      sounds.playScanChime();
      onUpdateStatus(item.id, status, `Status changed to ${status}`);
    }
  };

  const handleToggleReminder = async () => {
    if (activeReminder) {
      reminderService.cancelReminder(item.id);
      sounds.triggerHaptic(20);
    } else {
      const perm = await reminderService.requestPermission();
      setPermissionState(perm);
      await reminderService.setReminder({
        itemId: item.id,
        itemName: item.name,
        homeName: currentHome?.name || 'Designated Home',
        room: currentHome?.room || 'Designated Home',
        durationMinutes: reminderDuration,
      });
      sounds.playScanChime();
      sounds.triggerHaptic([30, 40]);
    }
  };

  const handleSelectDuration = async (minutes: number) => {
    setReminderDuration(minutes);
    setShowCustomInput(false);
    if (activeReminder) {
      await reminderService.setReminder({
        itemId: item.id,
        itemName: item.name,
        homeName: currentHome?.name || 'Designated Home',
        room: currentHome?.room || 'Designated Home',
        durationMinutes: minutes,
      });
      sounds.playScanChime();
    }
  };

  const handleCustomDurationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (val && val > 0) {
      await handleSelectDuration(val);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const getMinutesUntil8PM = () => {
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(20, 0, 0, 0);
    if (tonight.getTime() <= now.getTime()) {
      tonight.setDate(tonight.getDate() + 1);
    }
    return Math.max(15, Math.round((tonight.getTime() - now.getTime()) / (1000 * 60)));
  };

  const handleTestNotification = async () => {
    const perm = await reminderService.requestPermission();
    setPermissionState(perm);
    if (typeof window !== 'undefined' && 'Notification' in window && perm === 'granted') {
      try {
        new Notification(`Test Reminder: Return "${item.name}" home`, {
          body: `Designated spot: ${currentHome?.room} → ${currentHome?.name}. Browser notifications are working!`,
          icon: '/assets/tiles/tile_house_keys.png',
        });
        sounds.playScanChime();
      } catch {
        // ignore
      }
    } else {
      sounds.playHomeChime();
    }
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-3">
            <ItemArtwork
              illustration={item.stickerIllustration}
              name={item.name}
              photoUrl={item.photoUrl}
              size="sm"
            />
            <div>
              <div className="text-xs text-stone-500 flex items-center gap-2">
                <span>{item.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-stone-400">UID: {item.nfcTagUid}</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                {item.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={startEdit}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
                title="Edit Item"
              >
                <Edit3 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Edit Form */}
          {isEditing ? (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Edit Item Details
              </h4>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Category (Optional, e.g. Electronics, Documents, Keys)</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Electronics, Documents, Keys, Medication..."
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Designated Home</label>
                <select
                  value={editHomeId}
                  onChange={(e) => setEditHomeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                >
                  {homes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.room} → {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Notes / Visual Description</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-900 hover:bg-amber-950 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : null}

          {/* Current Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div>
              <span className="text-xs text-stone-500 font-medium">Current Status:</span>
              <div className="text-sm font-bold text-stone-900 flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.currentStatus === 'at_home'
                      ? 'bg-emerald-600'
                      : item.currentStatus === 'with_me'
                      ? 'bg-sky-600'
                      : 'bg-rose-600'
                  }`}
                />
                <span>
                  {item.currentStatus === 'at_home' && 'Resting at Designated Home'}
                  {item.currentStatus === 'with_me' && 'In Active Use / With You'}
                  {item.currentStatus === 'misplaced' && 'Misplaced / Needing Retrieval'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStatusChange('at_home')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  item.currentStatus === 'at_home'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Put Home
              </button>
              <button
                onClick={() => handleStatusChange('with_me')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  item.currentStatus === 'with_me'
                    ? 'bg-sky-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Take With Me
              </button>
              <button
                onClick={() => handleStatusChange('misplaced')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  item.currentStatus === 'misplaced'
                    ? 'bg-rose-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Misplaced
              </button>
            </div>
          </div>

          {/* Remind Me To Return This Card */}
          <div
            className={`rounded-xl border p-4 transition-all space-y-3.5 ${
              activeReminder
                ? 'bg-amber-50/70 border-amber-800/30 ring-1 ring-amber-800/10'
                : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    activeReminder
                      ? 'bg-amber-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200'
                  }`}
                >
                  {activeReminder ? <BellRing size={18} className="animate-pulse" /> : <Bell size={18} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Remind me to return this</span>
                    {activeReminder && (
                      <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full lowercase">
                        active
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {activeReminder
                      ? `Notification scheduled for ${new Date(activeReminder.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Triggers a browser notification after a set duration'}
                  </p>
                </div>
              </div>

              {/* Accessible Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={!!activeReminder}
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-800 focus:ring-offset-2 ${
                  activeReminder ? 'bg-amber-900' : 'bg-stone-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    activeReminder ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Controls when Toggle is Active */}
            {activeReminder && (
              <div className="pt-2 border-t border-amber-900/10 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-800" />
                      <span>Reminder Duration:</span>
                    </span>
                    <span className="font-mono text-amber-900 font-semibold">
                      {activeReminder.durationMinutes} min ({Math.max(1, Math.round((activeReminder.dueAt - Date.now()) / (1000 * 60)))}m left)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '15 min', minutes: 15 },
                      { label: '30 min', minutes: 30 },
                      { label: '1 hour', minutes: 60 },
                      { label: '2 hours', minutes: 120 },
                      { label: 'Tonight (8 PM)', minutes: getMinutesUntil8PM() },
                    ].map((preset) => {
                      const isCurrent = activeReminder.durationMinutes === preset.minutes;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectDuration(preset.minutes)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                            isCurrent
                              ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                              : 'bg-white text-stone-700 hover:bg-amber-100/60 border border-stone-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
                    >
                      Custom...
                    </button>
                  </div>

                  {showCustomInput && (
                    <form onSubmit={handleCustomDurationSubmit} className="flex gap-2 mt-2">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Minutes (e.g. 45)"
                        className="w-32 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-700"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-semibold bg-amber-900 text-white rounded-lg hover:bg-amber-950"
                      >
                        Set
                      </button>
                    </form>
                  )}
                </div>

                {/* Browser notification permission status banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white/90 rounded-lg border border-stone-200 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-600">
                    {permissionState === 'granted' ? (
                      <>
                        <Check size={14} className="text-emerald-700" />
                        <span>Browser notifications active</span>
                      </>
                    ) : permissionState === 'denied' ? (
                      <>
                        <AlertCircle size={14} className="text-rose-700" />
                        <span>Notifications blocked in browser — gentle sound chime will play</span>
                      </>
                    ) : (
                      <>
                        <Bell size={14} className="text-amber-800" />
                        <span>Click to confirm browser notification prompt</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="text-xs text-amber-900 hover:underline font-medium"
                    >
                      {testSent ? 'Notification Sent!' : 'Test Notification'}
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => reminderService.cancelReminder(item.id)}
                      className="text-xs text-stone-500 hover:text-rose-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Designated Home Info */}
          {currentHome && (
            <div className="bg-[#FAF7EE] border border-stone-200/90 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 uppercase tracking-wider">
                <MapPin size={15} />
                <span>Designated Home Location</span>
              </div>
              <div className="text-base font-bold text-stone-900">
                {currentHome.room} <span className="text-stone-400 font-normal">→</span> {currentHome.name}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                {currentHome.specificSpot}
              </p>
              {currentHome.notes && (
                <div className="text-xs text-stone-500 italic bg-white/80 p-2.5 rounded-lg border border-stone-200/80">
                  "{currentHome.notes}"
                </div>
              )}
            </div>
          )}

          {/* Guided Recovery Tips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} className="text-amber-800" />
                Where to Look If Misplaced
              </h4>
              <span className="text-xs text-stone-400">{item.searchTips.length} check points</span>
            </div>

            <ul className="space-y-2">
              {item.searchTips.map((tip, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-700 group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-stone-400 font-mono text-[11px]">{idx + 1}.</span>
                    <span>{tip}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveSearchTip(idx)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-opacity p-1"
                    title="Remove tip"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddSearchTip} className="flex gap-2">
              <input
                type="text"
                value={newTipInput}
                onChange={(e) => setNewTipInput(e.target.value)}
                placeholder="Add another hiding spot / search tip..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Tip</span>
              </button>
            </form>
          </div>

          {/* NFC Sticker Hardware Details */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Radio size={14} className="text-amber-800" />
                <span>25mm NTAG213 Sticker Information</span>
              </div>
              <div className="font-mono text-stone-500 text-[11px] mt-0.5">
                Hardware Tag UID: {item.nfcTagUid}
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenWriter(item.id);
              }}
              className="px-3.5 py-2 font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-lg transition-colors whitespace-nowrap text-xs shadow-2xs"
            >
              Program / Re-write Tag
            </button>
          </div>

          {/* Activity / Retrieval Log */}
          {itemLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} className="text-stone-400" />
                Recent Activity & Retrievals
              </h4>
              <div className="space-y-1.5 text-xs">
                {itemLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-stone-600"
                  >
                    <span>{log.notes || `${log.action} - ${log.locationName}`}</span>
                    <span className="text-[11px] text-stone-400 shrink-0 ml-2">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (confirm(`Remove "${item.name}" from Things Have Homes?`)) {
                onDeleteItem(item.id);
                onClose();
              }
            }}
            className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
          >
            <Trash2 size={13} />
            <span>Delete Item</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-stone-700 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
