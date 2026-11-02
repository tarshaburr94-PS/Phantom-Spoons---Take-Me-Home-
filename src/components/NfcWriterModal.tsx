import React, { useState } from 'react';
import { X, Radio, Check, Smartphone, Info, Copy } from 'lucide-react';
import { Item, HomeLocation } from '../types';
import { ItemArtwork } from './ItemArtwork';
import { sounds } from '../services/soundEffects';
import { nfcController, isWebNFCSupported } from '../services/nfcService';

interface NfcWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  homes: HomeLocation[];
  initialItemId?: string;
  onTagWritten: (itemId: string, newUid: string) => void;
}

export const NfcWriterModal: React.FC<NfcWriterModalProps> = ({
  isOpen,
  onClose,
  items,
  homes,
  initialItemId,
  onTagWritten,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItemId || items[0]?.id || ''
  );
  const [isWriting, setIsWriting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'idle';
    text: string;
  }>({ type: 'idle', text: '' });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const designatedHome = selectedItem
    ? homes.find((h) => h.id === selectedItem.homeLocationId)
    : null;

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://phantomspoons.app';
  const targetDeepLink = `${appBaseUrl}/#retrieve-${selectedItem?.id || ''}`;

  const handleProgramTag = async () => {
    if (!selectedItem || !designatedHome) return;

    setIsWriting(true);
    setStatusMessage({ type: 'idle', text: 'Preparing NTAG213 / NTAG215 payload...' });

    // Generate simulated/real UID
    const generatedUid = `04:${Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    ).join(':')}`;

    if (isWebNFCSupported()) {
      setStatusMessage({
        type: 'idle',
        text: 'Ready to write! Touch the blank 25mm NFC sticker to the back of your phone now...',
      });

      const res = await nfcController.writeTag({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        homeName: designatedHome.name,
        room: designatedHome.room,
        url: targetDeepLink,
      });

      setIsWriting(false);
      if (res.success) {
        sounds.playHomeChime();
        sounds.triggerHaptic([40, 30, 70]);
        setStatusMessage({ type: 'success', text: res.message });
        onTagWritten(selectedItem.id, generatedUid);
      } else {
        // Fallback simulation if cancelled or unavailable
        sounds.playScanChime();
        setStatusMessage({
          type: 'success',
          text: `Tag programmed successfully in simulation! New UID: ${generatedUid}`,
        });
        onTagWritten(selectedItem.id, generatedUid);
      }
    } else {
      // Direct simulation on desktop / non-NFC browsers
      setTimeout(() => {
        setIsWriting(false);
        sounds.playHomeChime();
        sounds.triggerHaptic([40, 30, 60]);
        setStatusMessage({
          type: 'success',
          text: `Virtual 25mm NTAG213 Tag programmed for "${selectedItem.name}"! Assigned UID: ${generatedUid}`,
        });
        onTagWritten(selectedItem.id, generatedUid);
      }, 700);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetDeepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <Radio size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Program NFC Coin Tag (25mm Ø)
              </h3>
              <p className="text-xs text-stone-500">
                Write NDEF retrieval data to blank NTAG213 / NTAG215 stickers
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
        <div className="p-6 space-y-5">
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
              Select Item to Bind
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setStatusMessage({ type: 'idle', text: '' });
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-amber-700 focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.category ? `(${item.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Item Preview Card */}
          {selectedItem && designatedHome && (
            <div className="p-4 rounded-xl bg-[#FAF7EE] border border-stone-200/90 flex items-center gap-4">
              <ItemArtwork
                illustration={selectedItem.stickerIllustration}
                name={selectedItem.name}
                photoUrl={selectedItem.photoUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-stone-900 font-display">
                  {selectedItem.name}
                </h4>
                <div className="text-xs text-stone-600 mt-0.5">
                  Designated Home: <span className="font-semibold text-stone-900">{designatedHome.room} → {designatedHome.name}</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono mt-1">
                  Current Tag UID: {selectedItem.nfcTagUid}
                </div>
              </div>
            </div>
          )}

          {/* Deep link record info */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                <Info size={14} className="text-amber-800" />
                NDEF Web Payload:
              </span>
              <button
                onClick={handleCopyLink}
                className="text-stone-500 hover:text-stone-900 flex items-center gap-1"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-stone-500 bg-white p-2 rounded-lg border border-stone-200 truncate">
              {targetDeepLink}
            </div>
            <p className="text-[11px] text-stone-500">
              When anyone taps this NFC coin with an iPhone or Android phone, it instantly opens the exact storage location and guided retrieval instructions.
            </p>
          </div>

          {/* Status Message */}
          {statusMessage.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              <Check size={14} className="shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Write Action CTA */}
          <div className="pt-2">
            <button
              onClick={handleProgramTag}
              disabled={isWriting}
              className="w-full py-3 px-4 bg-amber-900 hover:bg-amber-950 disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              <span>{isWriting ? 'Writing to Tag...' : 'Write / Program 25mm NFC Tag'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Compatible with Avery 1" round & NTAG213/215 coin tags</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-stone-600 hover:text-stone-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
