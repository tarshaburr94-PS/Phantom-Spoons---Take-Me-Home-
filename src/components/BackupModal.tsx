import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Check, AlertCircle, Database, Shield } from 'lucide-react';
import { Item, HomeLocation, ScanEvent } from '../types';
import { INITIAL_HOMES, INITIAL_ITEMS, INITIAL_LOGS } from '../data/initialData';
import { sounds } from '../services/soundEffects';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  homes: HomeLocation[];
  logs: ScanEvent[];
  spoonsSaved: number;
  onRestoreData: (data: {
    items: Item[];
    homes: HomeLocation[];
    logs: ScanEvent[];
    spoonsSaved: number;
  }) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  items,
  homes,
  logs,
  spoonsSaved,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'idle';
    text: string;
  }>({ type: 'idle', text: '' });

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const backupPayload = {
        app: 'Phantom Spoons NFC - Things Have Homes',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        spoonsSaved,
        homes,
        items,
        logs,
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phantom-spoons-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sounds.playScanChime();
      setStatusMessage({
        type: 'success',
        text: 'Backup file exported successfully! Keep it safe or transfer it to your phone.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to create export file.',
      });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed.homes) || !Array.isArray(parsed.items)) {
          throw new Error('Invalid backup file structure. Missing homes or items.');
        }

        onRestoreData({
          homes: parsed.homes,
          items: parsed.items,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
          spoonsSaved: typeof parsed.spoonsSaved === 'number' ? parsed.spoonsSaved : 38,
        });

        sounds.playHomeChime();
        setStatusMessage({
          type: 'success',
          text: `Successfully restored ${parsed.items.length} items and ${parsed.homes.length} designated homes!`,
        });
      } catch (err) {
        sounds.playMisplacedTone();
        setStatusMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Could not parse the backup file.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToTemplate = () => {
    if (confirm('Reset all items and homes to the original Master Collector template?')) {
      onRestoreData({
        homes: INITIAL_HOMES,
        items: INITIAL_ITEMS,
        logs: INITIAL_LOGS,
        spoonsSaved: 38,
      });
      sounds.playScanChime();
      setStatusMessage({
        type: 'success',
        text: 'Reset to Master Collector template items.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <Database size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Data Backup & Device Sync
              </h3>
              <p className="text-xs text-stone-500">
                Safeguard your designated homes and NFC tag registry
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

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-stone-600 leading-relaxed">
            Your customized homes, tag UIDs, and search tips are stored locally in your browser. Exporting a backup lets you easily transfer your system to a phone or recover data at any time.
          </p>

          {/* Action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="p-4 rounded-xl border border-stone-200 hover:border-amber-700/60 hover:bg-[#FAF7EE] transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs mb-1">
                <Download size={15} className="text-amber-800" />
                <span>Export Backup (JSON)</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Downloads a file with your {items.length} items & {homes.length} homes.
              </p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border border-stone-200 hover:border-amber-700/60 hover:bg-[#FAF7EE] transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs mb-1">
                <Upload size={15} className="text-amber-800" />
                <span>Import Backup</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Restore data from a previously saved backup file.
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {/* Status Message */}
          {statusMessage.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check size={14} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={handleResetToTemplate}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset to Master Collector Template</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1 text-[11px]">
            <Shield size={12} className="text-stone-400" />
            <span>100% private, client-side data storage</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-stone-700 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
