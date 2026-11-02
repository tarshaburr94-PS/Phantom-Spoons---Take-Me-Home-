/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { SpoonsBanner } from './components/SpoonsBanner';
import { QuickFinder } from './components/QuickFinder';
import { AllItemsView } from './components/AllItemsView';
import { LocationManager } from './components/LocationManager';
import { NfcScannerModal } from './components/NfcScannerModal';
import { NfcWriterModal } from './components/NfcWriterModal';
import { PrintableStickersModal } from './components/PrintableStickersModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddItemModal } from './components/AddItemModal';
import { EveningRoutineModal } from './components/EveningRoutineModal';
import { BackupModal } from './components/BackupModal';
import { MedReminderCard } from './components/MedReminderCard';
import { HomeScreenWidgetModal } from './components/HomeScreenWidgetModal';
import { Item, HomeLocation, ScanEvent } from './types';
import { INITIAL_HOMES, INITIAL_ITEMS, INITIAL_LOGS, SIMULATED_TAGS } from './data/initialData';
import { sounds } from './services/soundEffects';
import { reminderService, ActiveReminder } from './services/reminderService';
import { medTimerService, MedTimerState } from './services/medTimerService';
import { BellRing, Check, Clock, Pill, Smartphone, X as XIcon } from 'lucide-react';

const STORAGE_KEYS = {
  HOMES: 'phantom_spoons_homes_v1',
  ITEMS: 'phantom_spoons_items_v1',
  LOGS: 'phantom_spoons_logs_v1',
  SPOONS: 'phantom_spoons_saved_count',
  SOUND: 'phantom_spoons_sound_pref',
};

export default function App() {
  // Persistent State
  const [homes, setHomes] = useState<HomeLocation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOMES);
      return stored ? JSON.parse(stored) : INITIAL_HOMES;
    } catch {
      return INITIAL_HOMES;
    }
  });

  const [items, setItems] = useState<Item[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return stored ? JSON.parse(stored) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [logs, setLogs] = useState<ScanEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      return stored ? JSON.parse(stored) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [spoonsSaved, setSpoonsSaved] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPOONS);
      return stored ? parseInt(stored, 10) : 38;
    } catch {
      return 38;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SOUND);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<'retrieve' | 'items' | 'homes' | 'stickers' | 'routine'>('retrieve');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWriterOpen, setIsWriterOpen] = useState(false);
  const [writerItemId, setWriterItemId] = useState<string | undefined>(undefined);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isRoutineOpen, setIsRoutineOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgetToast, setWidgetToast] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);
  const [firedReminder, setFiredReminder] = useState<ActiveReminder | null>(null);
  const [firedMedAlert, setFiredMedAlert] = useState<MedTimerState | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOMES, JSON.stringify(homes));
  }, [homes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPOONS, spoonsSaved.toString());
  }, [spoonsSaved]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
    sounds.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Home Screen Widget & App Shortcuts URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action) {
      if (action === 'tap-med-ring') {
        sounds.playCheckInChime();
        sounds.triggerHaptic(50);
        medTimerService.completeDoseWithNFC('shortcut-url-tap', 'Phone Home Screen Widget');
        setWidgetToast('💊 Dose logged via Home Screen Shortcut! 3-hour timer reset.');
        setTimeout(() => setWidgetToast(null), 5000);
      } else if (action === 'scan') {
        setIsScannerOpen(true);
      } else if (action === 'routine') {
        setIsRoutineOpen(true);
      } else if (action === 'widget') {
        setIsWidgetModalOpen(true);
      } else if (action === 'find-essentials' || action === 'find-keys') {
        setCurrentTab('retrieve');
      }
      // Clean up the URL query parameter without triggering full reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Deep Link handling for NFC physical scans (e.g. #retrieve-item-house-keys)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#retrieve-')) {
        const targetId = hash.replace('#retrieve-', '');
        const matched = items.find((i) => i.id === targetId);
        if (matched) {
          setSelectedItemDetail(matched);
          setCurrentTab('retrieve');
          sounds.playScanChime();
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [items]);

  useEffect(() => {
    reminderService.setNotificationCallback((reminder) => {
      setFiredReminder(reminder);
    });
    medTimerService.setNotificationCallback((mState) => {
      setFiredMedAlert(mState);
    });
  }, []);

  // Actions
  const handleAddHome = (newHomeData: Omit<HomeLocation, 'id'>): string => {
    const newId = `home-custom-${Date.now()}`;
    const newHome: HomeLocation = {
      ...newHomeData,
      id: newId,
    };
    setHomes((prev) => [...prev, newHome]);
    return newId;
  };

  const handleUpdateHome = (updatedHome: HomeLocation) => {
    setHomes((prev) => prev.map((h) => (h.id === updatedHome.id ? updatedHome : h)));
  };

  const handleDeleteHome = (homeId: string) => {
    setHomes((prev) => prev.filter((h) => h.id !== homeId));
  };

  const handleAddItem = (newItemData: Omit<Item, 'id' | 'totalRetrievals'>) => {
    const newItem: Item = {
      ...newItemData,
      id: `item-custom-${Date.now()}`,
      totalRetrievals: 1,
    };
    setItems((prev) => [newItem, ...prev]);

    // Add log
    const home = homes.find((h) => h.id === newItem.homeLocationId);
    const newLog: ScanEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'checked_in_home',
      locationName: home ? `${home.room} → ${home.name}` : 'Designated Home',
      notes: 'Initial home location locked into system',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateItem = (updatedItem: Item) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    if (selectedItemDetail?.id === updatedItem.id) {
      setSelectedItemDetail(updatedItem);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (selectedItemDetail?.id === itemId) {
      setSelectedItemDetail(null);
    }
  };

  const handleUpdateStatus = (itemId: string, newStatus: Item['currentStatus'], logNote?: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const home = homes.find((h) => h.id === targetItem.homeLocationId);
    const updatedLocation =
      newStatus === 'at_home'
        ? `${home?.name || 'Home'} (${home?.room || 'Designated Home'})`
        : newStatus === 'with_me'
        ? 'In active use with you'
        : 'Unknown / Misplaced';

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            currentStatus: newStatus,
            lastKnownLocation: updatedLocation,
            lastUpdated: new Date().toISOString(),
            totalRetrievals: newStatus === 'at_home' ? i.totalRetrievals + 1 : i.totalRetrievals,
          };
        }
        return i;
      })
    );

    if (newStatus === 'at_home') {
      setSpoonsSaved((prev) => prev + 1);
    }

    const newLog: ScanEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: targetItem.id,
      itemName: targetItem.name,
      action:
        newStatus === 'at_home'
          ? 'checked_in_home'
          : newStatus === 'misplaced'
          ? 'misplaced_reported'
          : 'taken_with_me',
      locationName: home ? `${home.room} → ${home.name}` : 'Designated Home',
      notes: logNote || `Status updated to ${newStatus}`,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleTagWritten = (itemId: string, newUid: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, nfcTagUid: newUid } : i))
    );
  };

  const handleSelectTab = (tab: string) => {
    if (tab === 'stickers') {
      setIsStickersOpen(true);
      return;
    }
    if (tab === 'routine') {
      setIsRoutineOpen(true);
      return;
    }
    setCurrentTab(tab as typeof currentTab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top Navigation Bar adhering to the Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAddItem={() => setIsAddItemOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Widget Shortcut Success Toast */}
      {widgetToast && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 shadow-md border-b border-emerald-700 animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Check size={16} className="text-emerald-300" />
              <span>{widgetToast}</span>
            </div>
            <button
              onClick={() => setWidgetToast(null)}
              className="text-emerald-200 hover:text-white transition-colors"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App Return Reminder Banner */}
      {firedReminder && (
        <div className="bg-amber-950 text-white px-4 py-3 shadow-lg border-b border-amber-800/40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900 text-amber-200 flex items-center justify-center shrink-0">
                <BellRing size={18} className="animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-sm block font-display text-amber-100">
                  Time to return "{firedReminder.itemName}" home!
                </span>
                <span className="text-stone-300">
                  Designated spot: <strong className="text-white">{firedReminder.room} → {firedReminder.homeName}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  handleUpdateStatus(firedReminder.itemId, 'at_home', `Returned home after scheduled reminder`);
                  setFiredReminder(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Check size={14} />
                <span>I Put It Back Home!</span>
              </button>
              <button
                onClick={() => {
                  reminderService.setReminder({
                    ...firedReminder,
                    durationMinutes: 15,
                  });
                  setFiredReminder(null);
                  sounds.playScanChime();
                }}
                className="px-3 py-1.5 text-xs font-medium bg-amber-900 hover:bg-amber-800 text-amber-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Clock size={13} />
                <span>Snooze 15m</span>
              </button>
              <button
                onClick={() => setFiredReminder(null)}
                className="w-7 h-7 rounded-lg hover:bg-amber-900 flex items-center justify-center text-amber-300 hover:text-white transition-colors"
                title="Dismiss"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Med Reminder Due Alert */}
      {firedMedAlert && (
        <div className="bg-amber-900 text-white px-4 py-3 shadow-lg border-b border-amber-800 animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-200 flex items-center justify-center shrink-0">
                <Pill size={18} className="animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-sm block font-display text-amber-100">
                  ⏰ 3-Hour Med Reminder: {firedMedAlert.medName}
                </span>
                <span className="text-stone-300">
                  Time for your scheduled dose! Tap your 25mm NFC Med Ring to complete & restart interval.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  medTimerService.completeViaNfc('04:88:1A:2B:3C:4D:11');
                  setFiredMedAlert(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Check size={14} />
                <span>Tap NFC Med Ring (Complete)</span>
              </button>
              <button
                onClick={() => {
                  medTimerService.completeManual();
                  setFiredMedAlert(null);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-amber-950/60 hover:bg-amber-950 text-amber-100 rounded-lg transition-colors"
              >
                Log Manually
              </button>
              <button
                onClick={() => setFiredMedAlert(null)}
                className="w-7 h-7 rounded-lg hover:bg-amber-800 flex items-center justify-center text-amber-300 hover:text-white transition-colors"
                title="Dismiss"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADHD & Spoon Theory Banner */}
      <SpoonsBanner
        items={items}
        spoonsSaved={spoonsSaved}
        onOpenRoutine={() => setIsRoutineOpen(true)}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {currentTab === 'retrieve' && (
          <div className="space-y-6">
            <MedReminderCard onOpenScanner={() => setIsScannerOpen(true)} />
            <QuickFinder
              items={items}
              homes={homes}
              onSelectItem={(item) => setSelectedItemDetail(item)}
              onUpdateStatus={handleUpdateStatus}
              onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'items' && (
          <AllItemsView
            items={items}
            homes={homes}
            onSelectItem={(item) => setSelectedItemDetail(item)}
            onOpenAddItem={() => setIsAddItemOpen(true)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {currentTab === 'homes' && (
          <LocationManager
            homes={homes}
            items={items}
            onAddHome={handleAddHome}
            onUpdateHome={handleUpdateHome}
            onDeleteHome={handleDeleteHome}
            onSelectItem={(item) => setSelectedItemDetail(item)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/60 py-6 text-xs text-stone-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 font-display">
              Phantom Spoons NFC
            </span>
            <span>·</span>
            <span>Things Have Homes</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-stone-400">NTAG213 / NTAG215 (25mm Ø)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsWidgetModalOpen(true)}
              className="hover:text-stone-900 transition-colors font-medium text-amber-900 flex items-center gap-1"
            >
              <span>📱</span>
              <span>Phone Widget</span>
            </button>
            <button
              onClick={() => setIsStickersOpen(true)}
              className="hover:text-stone-900 transition-colors"
            >
              Print Sticker Sheet
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="hover:text-stone-900 transition-colors"
            >
              Virtual NFC Dock
            </button>
            <button
              onClick={() => setIsRoutineOpen(true)}
              className="hover:text-stone-900 transition-colors"
            >
              Evening Reset
            </button>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-stone-900 transition-colors font-medium text-amber-900"
            >
              Backup & Sync
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <HomeScreenWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        items={items}
        homes={homes}
        spoonsSaved={spoonsSaved}
        onOpenScanner={() => setIsScannerOpen(true)}
        onSelectItem={(item) => setSelectedItemDetail(item)}
      />

      <NfcScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        homes={homes}
        simulatedTags={SIMULATED_TAGS}
        onUpdateItemStatus={handleUpdateStatus}
        onSelectItemForDetail={(item) => setSelectedItemDetail(item)}
      />

      <NfcWriterModal
        isOpen={isWriterOpen}
        onClose={() => {
          setIsWriterOpen(false);
          setWriterItemId(undefined);
        }}
        items={items}
        homes={homes}
        initialItemId={writerItemId}
        onTagWritten={handleTagWritten}
      />

      <PrintableStickersModal
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        items={items}
      />

      <ItemDetailModal
        item={selectedItemDetail}
        homes={homes}
        logs={logs}
        isOpen={!!selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onOpenWriter={(itemId) => {
          setWriterItemId(itemId);
          setIsWriterOpen(true);
        }}
        onDeleteItem={handleDeleteItem}
        onUpdateItem={handleUpdateItem}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        homes={homes}
        onAddItem={handleAddItem}
        onAddHome={handleAddHome}
      />

      <EveningRoutineModal
        isOpen={isRoutineOpen}
        onClose={() => setIsRoutineOpen(false)}
        items={items}
        homes={homes}
        onCheckInItem={(itemId) => handleUpdateStatus(itemId, 'at_home', 'Checked in via Evening Reset Routine')}
        onCompletedRoutine={() => setSpoonsSaved((prev) => prev + 5)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        items={items}
        homes={homes}
        logs={logs}
        spoonsSaved={spoonsSaved}
        onRestoreData={(restored) => {
          setHomes(restored.homes);
          setItems(restored.items);
          setLogs(restored.logs);
          setSpoonsSaved(restored.spoonsSaved);
        }}
      />
    </div>
  );
}
