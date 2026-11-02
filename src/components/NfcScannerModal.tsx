import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  Check, 
  Smartphone, 
  MapPin, 
  Volume2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Droplets
} from 'lucide-react';
import { Item, HomeLocation, NFCTagSimulation } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';
import { nfcController, isWebNFCSupported, NFCScanResult } from '../services/nfcService';
import { medTimerService } from '../services/medTimerService';
import { waterTrackerService } from '../services/waterTrackerService';

interface NfcScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  homes: HomeLocation[];
  simulatedTags: NFCTagSimulation[];
  onUpdateItemStatus: (itemId: string, newStatus: Item['currentStatus'], logNote?: string) => void;
  onSelectItemForDetail: (item: Item) => void;
}

export const NfcScannerModal: React.FC<NfcScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  homes,
  simulatedTags,
  onUpdateItemStatus,
  onSelectItemForDetail,
}) => {
  const [isScanningHardware, setIsScanningHardware] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    uid: string;
    item?: Item;
    home?: HomeLocation;
    type: 'item' | 'home_station' | 'unknown';
    message: string;
    medCompletion?: string;
    waterCompletion?: string;
  } | null>(null);

  const [activeStageItem, setActiveStageItem] = useState<Item | null>(null);
  const [manualUidInput, setManualUidInput] = useState('');

  const hasWebNFC = isWebNFCSupported();

  useEffect(() => {
    if (!isOpen) {
      if (isScanningHardware) {
        nfcController.stopListening();
        setIsScanningHardware(false);
      }
      setScannedResult(null);
      setActiveStageItem(null);
      setHardwareError(null);
    }
  }, [isOpen, isScanningHardware]);

  if (!isOpen) return null;

  const handleStartHardwareScan = async () => {
    setHardwareError(null);
    setIsScanningHardware(true);
    sounds.playScanChime();

    const success = await nfcController.startListening(
      (result: NFCScanResult) => {
        handleProcessUid(result.serialNumber);
      },
      (err: Error) => {
        setIsScanningHardware(false);
        setHardwareError(err.message);
      }
    );

    if (!success) {
      setIsScanningHardware(false);
    }
  };

  const handleStopHardwareScan = () => {
    nfcController.stopListening();
    setIsScanningHardware(false);
  };

  const handleProcessUid = (uid: string) => {
    sounds.playScanChime();
    sounds.triggerHaptic([40, 20, 40]);

    // Check if UID belongs to an Item
    const matchedItem = items.find(
      (i) => i.nfcTagUid.toLowerCase() === uid.toLowerCase()
    );

    // Check if UID belongs to a Home Station
    const matchedHome = homes.find(
      (h) => h.nfcTagUid && h.nfcTagUid.toLowerCase() === uid.toLowerCase()
    );

    // Check if this NFC tap completes a Medication Reminder
    const medDoseResult = medTimerService.completeViaNfc(uid);

    // Check if this NFC tap logs Hydration
    const waterResult = waterTrackerService.logViaNfc(uid);

    if (matchedItem) {
      // If we previously staged another item, this switches active item
      setActiveStageItem(matchedItem);
      const home = homes.find((h) => h.id === matchedItem.homeLocationId);
      setScannedResult({
        uid,
        item: matchedItem,
        type: 'item',
        message: medDoseResult
          ? `Recognized "${matchedItem.name}". 💊 Dose logged via NFC Med Ring! Next 3-hour timer started.`
          : waterResult
          ? `Recognized "${matchedItem.name}". 💧 ${waterResult.message}`
          : `Recognized "${matchedItem.name}". Designated home: ${home?.name || 'Home'}.`,
        medCompletion: medDoseResult?.message,
        waterCompletion: waterResult?.message,
      });
    } else if (matchedHome) {
      // Scanned a Home Station!
      if (activeStageItem) {
        // We have an item staged! Dock it here!
        const wasHome = activeStageItem.homeLocationId === matchedHome.id;
        sounds.playHomeChime();
        sounds.triggerHaptic([30, 40, 70]);

        onUpdateItemStatus(
          activeStageItem.id,
          'at_home',
          `Checked in via NFC Home Station scan at "${matchedHome.name}"`
        );

        setScannedResult({
          uid,
          home: matchedHome,
          type: 'home_station',
          message: wasHome
            ? `Docked "${activeStageItem.name}" safely at its official designated home!`
            : `Placed "${activeStageItem.name}" at temporary station "${matchedHome.name}".`,
        });
        setActiveStageItem(null);
      } else {
        // Scanned home station without staged item: show all items belonging to this home
        const homeItems = items.filter((i) => i.homeLocationId === matchedHome.id);
        setScannedResult({
          uid,
          home: matchedHome,
          type: 'home_station',
          message: `Station "${matchedHome.name}" active (${homeItems.length} items belong here).`,
        });
      }
    } else {
      setScannedResult({
        uid,
        type: 'unknown',
        message: `Unrecognized NFC tag (UID: ${uid}). You can assign this UID to an existing item or create a new one!`,
      });
    }
  };

  const handleQuickDockItem = (item: Item) => {
    const home = homes.find((h) => h.id === item.homeLocationId);
    sounds.playHomeChime();
    sounds.triggerHaptic([30, 40, 60]);
    onUpdateItemStatus(
      item.id,
      'at_home',
      `Checked into designated home (${home?.name || 'Home'}) via 1-tap NFC dock.`
    );
    setScannedResult((prev) =>
      prev
        ? {
            ...prev,
            message: `"${item.name}" has returned to its home: ${home?.name || 'Home'}! Spoons preserved.`,
          }
        : null
    );
    setActiveStageItem(null);
  };

  const handleManualUidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUidInput.trim()) {
      handleProcessUid(manualUidInput.trim());
      setManualUidInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                NFC Tap & Scan Station
              </h3>
              <p className="text-xs text-stone-500">
                NTAG213 / NTAG215 coin stickers & home station reader
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Hardware Scan Card / Status */}
          <div className="bg-[#FAF7EE] border border-amber-900/15 rounded-xl p-5 text-center relative overflow-hidden">
            {/* Animated Waves */}
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-amber-100/80 flex items-center justify-center relative">
              <Radio size={32} className="text-amber-800" />
              {isScanningHardware && (
                <div className="absolute inset-0 rounded-full border-2 border-amber-600 animate-ping opacity-60" />
              )}
            </div>

            <h4 className="text-base font-bold text-stone-900 font-display mb-1">
              {isScanningHardware
                ? 'Ready for NFC Tag Tap...'
                : hasWebNFC
                ? 'Hardware NFC Available'
                : 'Interactive NFC Touch Emulation Active'}
            </h4>
            <p className="text-xs text-stone-600 max-w-md mx-auto mb-4">
              {hasWebNFC
                ? 'Hold your physical 25mm NFC coin sticker or phone against the back of your device.'
                : 'Tap any simulated item or home station tag below to test scanning, docking, and retrieval in real-time.'}
            </p>

            {hasWebNFC ? (
              <div className="flex items-center justify-center gap-3">
                {!isScanningHardware ? (
                  <button
                    onClick={handleStartHardwareScan}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-2xs flex items-center gap-2"
                  >
                    <Smartphone size={15} />
                    <span>Start Hardware NFC Scanner</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopHardwareScan}
                    className="px-5 py-2.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors"
                  >
                    Stop Scanning
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-stone-500 bg-white/80 px-3 py-1.5 rounded-lg border border-stone-200">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Simulated Mode (Works on all browsers & desktop)</span>
              </div>
            )}

            {hardwareError && (
              <div className="mt-3 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200/60 text-left">
                {hardwareError}
              </div>
            )}
          </div>

          {/* Active / Scanned Result Card */}
          {scannedResult && (
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                <span className="font-semibold text-stone-700">Last Scanned Result</span>
                <span className="font-mono text-[11px] text-stone-400">UID: {scannedResult.uid}</span>
              </div>

              <div className="flex items-start gap-3">
                {scannedResult.item ? (
                  <ItemArtwork
                    illustration={scannedResult.item.stickerIllustration}
                    name={scannedResult.item.name}
                    photoUrl={scannedResult.item.photoUrl}
                    size="sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 shrink-0">
                    <MapPin size={18} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {scannedResult.message}
                  </p>

                  {scannedResult.medCompletion && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200/90 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-700 shrink-0" />
                      <span className="font-medium">{scannedResult.medCompletion}</span>
                    </div>
                  )}

                  {scannedResult.waterCompletion && (
                    <div className="mt-2 p-2.5 bg-sky-50 border border-sky-200/90 rounded-lg text-xs text-sky-950 flex items-center gap-2">
                      <Droplets size={14} className="text-sky-600 shrink-0" />
                      <span className="font-medium">{scannedResult.waterCompletion}</span>
                    </div>
                  )}

                  {scannedResult.item && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleQuickDockItem(scannedResult.item!)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check size={13} />
                        <span>Confirm Docked at Home</span>
                      </button>
                      <button
                        onClick={() => {
                          sounds.playScanChime();
                          onUpdateItemStatus(
                            scannedResult.item!.id,
                            'with_me',
                            'Checked out for daily travel'
                          );
                          setScannedResult((prev) =>
                            prev ? { ...prev, message: `Marked "${scannedResult.item!.name}" as With You.` } : null
                          );
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ArrowRight size={13} />
                        <span>Take With Me</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectItemForDetail(scannedResult.item!);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
                      >
                        View Full Retrieval Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Virtual NFC Tags Drawer (Click to Simulate Physical NFC Tap) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-700" />
                Simulate Physical 25mm NFC Tag Taps
              </h5>
              <span className="text-xs text-stone-400">Click any tag to simulate scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {simulatedTags.map((tag) => (
                <button
                  key={tag.uid}
                  onClick={() => handleProcessUid(tag.uid)}
                  className="text-left p-3 rounded-xl border border-stone-200 hover:border-amber-800/40 hover:bg-[#FAF7EE] transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center text-stone-600 group-hover:text-amber-900 shrink-0 border border-stone-200">
                    <Radio size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {tag.name}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {tag.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Tag UID Entry */}
          <div className="pt-2 border-t border-stone-100">
            <form onSubmit={handleManualUidSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualUidInput}
                onChange={(e) => setManualUidInput(e.target.value)}
                placeholder="Enter custom NFC Tag UID (e.g. 04:88:1A:2B:3C:4D:01)"
                className="flex-1 px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700 text-stone-800"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors"
              >
                Simulate UID
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-stone-400" />
            <span>Gentle sensory haptic & audio feedback enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-medium text-stone-600 hover:text-stone-900"
          >
            Close Station
          </button>
        </div>
      </div>
    </div>
  );
};
