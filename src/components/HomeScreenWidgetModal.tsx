import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Share2,
  Download,
  PlusSquare,
  Check,
  Copy,
  Radio,
  Pill,
  ExternalLink,
  Sparkles,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { HomeScreenWidgetView } from './HomeScreenWidgetView';
import { Item, HomeLocation } from '../types';
import { sounds } from '../services/soundEffects';

interface HomeScreenWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  homes: HomeLocation[];
  spoonsSaved: number;
  onOpenScanner: () => void;
  onSelectItem: (item: Item) => void;
}

export const HomeScreenWidgetModal: React.FC<HomeScreenWidgetModalProps> = ({
  isOpen,
  onClose,
  items,
  homes,
  spoonsSaved,
  onOpenScanner,
  onSelectItem,
}) => {
  const { isInstalled, canInstall, platform, triggerInstall } = usePWAInstall();
  const [activeGuideTab, setActiveGuideTab] = useState<'ios' | 'android' | 'shortcuts'>(
    platform === 'ios' ? 'ios' : 'android'
  );
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const medTapUrl = `${currentOrigin}/?action=tap-med-ring`;
  const scanUrl = `${currentOrigin}/?action=scan`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    sounds.playCheckInChime();
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleInstallClick = async () => {
    sounds.triggerHaptic(40);
    const success = await triggerInstall();
    if (success) {
      sounds.playRoutineFinishChime();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-50 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-100/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center shadow-xs">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-display">
                Phone Home Screen Widget & App
              </h2>
              <p className="text-xs text-stone-500">
                Put 3h med timer and 1-tap NFC ring logging on your phone home screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close phone widget modal"
            className="w-8 h-8 rounded-lg hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Live Interactive Widget Simulation */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 font-mono">
                <Sparkles size={13} className="text-amber-700" />
                Live Widget Preview
              </span>
              <span className="text-xs text-stone-500">Try tapping buttons below</span>
            </div>

            <HomeScreenWidgetView
              items={items}
              homes={homes}
              spoonsSaved={spoonsSaved}
              onOpenScanner={() => {
                onClose();
                onOpenScanner();
              }}
              onSelectItem={(item) => {
                onClose();
                onSelectItem(item);
              }}
              onExpandToFullApp={onClose}
            />
          </div>

          {/* Section 2: Install Button if PWA prompt is ready */}
          {canInstall && !isInstalled && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-stone-100 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  <Download size={16} className="text-amber-700" />
                  Install Phantom Spoons onto Home Screen
                </p>
                <p className="text-xs text-stone-600">
                  Runs standalone without browser bars with instant NFC scanning.
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Download size={14} />
                <span>Install 1-Click</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>App is already installed!</strong> Long-press the icon on your phone home screen to reveal the "Tap Med Ring" and "Scan Tag" widget shortcuts.
              </span>
            </div>
          )}

          {/* Section 3: Platform Setup Guides */}
          <div>
            <div className="flex border-b border-stone-200 mb-4">
              <button
                onClick={() => setActiveGuideTab('android')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeGuideTab === 'android'
                    ? 'border-amber-800 text-amber-900 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Smartphone size={14} />
                <span>Android (Chrome & Shortcuts)</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('ios')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeGuideTab === 'ios'
                    ? 'border-amber-800 text-amber-900 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Share2 size={14} />
                <span>iPhone / iPad (Safari)</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('shortcuts')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeGuideTab === 'shortcuts'
                    ? 'border-amber-800 text-amber-900 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Zap size={14} />
                <span>iOS WidgetKit / Shortcuts</span>
              </button>
            </div>

            {/* Guide Content */}
            {activeGuideTab === 'android' && (
              <div className="space-y-3 text-xs text-stone-700 bg-white p-4 rounded-xl border border-stone-200">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Add to Home Screen</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      In Chrome on Android, tap the three dots (<strong>⋮</strong>) in the top-right and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Long-Press Icon for Quick Widgets</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      On your home screen, press and hold the Phantom Spoons icon. A popup menu appears with <strong>"Tap Med Ring"</strong>, <strong>"NFC Scan Tag"</strong>, and <strong>"Find Keys"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Drag Shortcut to Home Screen (Instant 1-Tap Widget)</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Drag the <strong>"Tap Med Ring"</strong> shortcut tile directly onto your home screen! Tapping it immediately records your dose and restarts the 3-hour timer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === 'ios' && (
              <div className="space-y-3 text-xs text-stone-700 bg-white p-4 rounded-xl border border-stone-200">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Open in Safari</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Make sure you are viewing this page in Apple Safari on your iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Tap the Share Button (⎋)</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Tap the square Share icon at the bottom of Safari, then scroll down and tap <strong>"Add to Home Screen"</strong> (⊞).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Tap "Add"</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      The Phantom Spoons icon will appear directly on your iOS home screen as a standalone web application.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === 'shortcuts' && (
              <div className="space-y-3 text-xs text-stone-700 bg-white p-4 rounded-xl border border-stone-200">
                <p className="text-stone-600">
                  Want an actual native iOS home screen widget that completes your 3h meds with a single tap? Use Apple's built-in <strong>Shortcuts</strong> app:
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="font-semibold text-stone-800 block">1-Tap Med Ring Log URL:</span>
                      <code className="text-[10px] text-stone-600 font-mono truncate block max-w-sm">
                        {medTapUrl}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(medTapUrl, 'med')}
                      className="px-2.5 py-1.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiedLink === 'med' ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      <span>{copiedLink === 'med' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="font-semibold text-stone-800 block">Quick NFC Scan URL:</span>
                      <code className="text-[10px] text-stone-600 font-mono truncate block max-w-sm">
                        {scanUrl}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(scanUrl, 'scan')}
                      className="px-2.5 py-1.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiedLink === 'scan' ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      <span>{copiedLink === 'scan' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <strong>How to set up:</strong>
                  <ol className="list-decimal list-inside space-y-1 mt-1 text-stone-600">
                    <li>Open iPhone <strong>Shortcuts</strong> app → Tap <strong>+</strong> → Add Action <strong>"Open URL"</strong>.</li>
                    <li>Paste the copied URL above into the action.</li>
                    <li>Go to your iPhone Home Screen → Long press → Tap <strong>+</strong> top-left → Add the <strong>Shortcuts Widget</strong>!</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-100/60 flex items-center justify-between">
          <div className="text-[11px] text-stone-500">
            Supports Web NFC (Android Chromium) and Safari Home Screen (iOS 16.4+)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
