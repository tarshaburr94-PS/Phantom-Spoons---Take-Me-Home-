import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Check, Info, ExternalLink } from 'lucide-react';
import { Item } from '../types';
import { ItemArtwork } from './ItemArtwork';

interface PrintableStickersModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
}

export const PrintableStickersModal: React.FC<PrintableStickersModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'generator' | 'guide'>('generator');
  const [selectedItemsForPrint, setSelectedItemsForPrint] = useState<string[]>(
    items.map((i) => i.id)
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const toggleItem = (id: string) => {
    setSelectedItemsForPrint((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItemsForPrint.length === items.length) {
      setSelectedItemsForPrint([]);
    } else {
      setSelectedItemsForPrint(items.map((i) => i.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header - Hidden on Print */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-900/20 shrink-0 bg-amber-50">
              <img
                src="/assets/aistudio/unnamed__5__11efe0ac.jpg"
                alt="Phantom Spoons"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Printable 25mm NFC Coin Stickers (1-Inch Ø)
              </h3>
              <p className="text-xs text-stone-500">
                Templates, custom print layout, and NTAG213/215 assembly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print Sticker Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Bar - Hidden on Print */}
        <div className="no-print flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-white">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'generator'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Custom Printable Sheet ({selectedItemsForPrint.length} Selected)
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'template'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Master Collector Template Sheet
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Assembly & Hardware Guide
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {/* Controls bar (Hidden on Print) */}
              <div className="no-print p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-stone-700">Include on sheet:</span>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-amber-800 hover:underline font-medium"
                  >
                    {selectedItemsForPrint.length === items.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Info size={14} className="text-stone-400" />
                  <span>Formatted for 1:1 scale (25mm / 0.98 inch diameter circles)</span>
                </div>
              </div>

              {/* Printable Grid Paper Area */}
              <div className="print-page bg-[#FAF7EE] p-6 rounded-2xl border border-stone-300 shadow-inner">
                <div className="text-center mb-6 pb-4 border-b border-stone-300/80">
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-950 font-display">
                    Master Collector Printing Template · Phantom Spoons NFC Lite
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    25mm Ø Circular Stickers · NTAG213 / NTAG215 Compatible Coin Tags
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-items-center">
                  {items
                    .filter((item) => selectedItemsForPrint.includes(item.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col items-center text-center group cursor-pointer"
                        onClick={() => toggleItem(item.id)}
                      >
                        {/* 25mm Round Sticker Token */}
                        <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-stone-400/80 p-1 bg-white shadow-xs flex items-center justify-center hover:border-amber-700 transition-colors">
                          <ItemArtwork
                            illustration={item.stickerIllustration}
                            name={item.name}
                            photoUrl={item.photoUrl}
                            size="md"
                            showNfcCoil={true}
                          />
                        </div>

                        <div className="mt-2 text-xs font-bold text-stone-900 max-w-[100px] truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          25mm Ø
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-stone-300/80 flex items-center justify-between text-[10px] text-stone-500">
                  <span>Phantom Spoons · Things Have Homes Collection</span>
                  <span>Est. 2026 · Avery 1" Circular Sticker Layout</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600">
                Official master template sheet showing 25mm circular coin stickers with authentic copper antenna tracks:
              </div>

              <div className="rounded-xl overflow-hidden border border-stone-300 shadow-sm bg-stone-100">
                <img
                  src="/assets/aistudio/a_master_collector_printable_template_sheet_of_25mm_1_inch_circular_coin_nfc_baf65919.png"
                  alt="Master Collector Printing Template"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2">
                <span>Features 10 essentials: House Keys, Car Keys, ANC Headphones, Wicker Hamper, Work Shoes, Slide Sandals, Street Runners, Water Bottle, Spring Water, Rotary Pill Tower</span>
                <a
                  href="/assets/aistudio/a_master_collector_printable_template_sheet_of_25mm_1_inch_circular_coin_nfc_baf65919.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open Full Resolution</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-2xl text-stone-800">
              <div className="space-y-1">
                <h4 className="text-base font-bold font-display text-stone-900">
                  How to Build Your Physical NFC "Things Have Homes" System
                </h4>
                <p className="text-xs text-stone-500">
                  Total assembly takes ~10 minutes and completely eliminates lost item stress.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      Get Blank 25mm (1 Inch) NFC Coin Tags
                    </h5>
                    <p className="text-xs text-stone-600">
                      Order standard NTAG213 or NTAG215 PVC coin cards or adhesive stickers ($8–$12 for a pack of 20 online). NTAG213 has 144 bytes of writable memory, perfect for deep links and home locations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      Print Stickers on 25mm Labels or Matte Sticker Paper
                    </h5>
                    <p className="text-xs text-stone-600">
                      Use the "Custom Printable Sheet" tab and click "Print Sticker Sheet". Standard 1-inch round templates (such as Avery #94500) match the 25mm coin tags seamlessly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      Program Your Tag in the App
                    </h5>
                    <p className="text-xs text-stone-600">
                      Open "Program NFC Coin Tag", choose the item, and tap "Write / Program". Tap the blank sticker to your phone to write the NDEF retrieval record!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-6 h-6 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      Create "Home Station Tags"
                    </h5>
                    <p className="text-xs text-stone-600">
                      Put an NFC tag on your entryway key dish, bedside table, or headphone hook. When you return items, simply tap the item on the station tag to instantly record "Home Check-in".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="no-print px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Phantom Spoons Master Collector NFC System</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-stone-600 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
