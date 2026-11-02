import { sounds } from './soundEffects';

export interface DoseLog {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  method: 'nfc_tap' | 'manual';
  notes?: string;
}

export interface MedTimerState {
  isActive: boolean;
  cycleHours: number; // default 3
  medItemId: string; // 'item-work-meds' or 'item-rotary-pill-tower'
  medName: string;
  startedAt: number; // Unix ms
  nextDueAt: number; // Unix ms
  history: DoseLog[];
  dosesLoggedToday: number;
}

const STORAGE_KEY = 'phantom_spoons_med_timer_v1';
const DEFAULT_CYCLE_HOURS = 3;

class MedTimerService {
  private timerId: number | null = null;
  private listeners = new Set<(state: MedTimerState) => void>();
  private notificationCallback: ((state: MedTimerState) => void) | null = null;

  private state: MedTimerState = {
    isActive: true,
    cycleHours: DEFAULT_CYCLE_HOURS,
    medItemId: 'item-work-meds',
    medName: 'Work Meds (Extra Strength)',
    startedAt: Date.now(),
    nextDueAt: Date.now() + DEFAULT_CYCLE_HOURS * 60 * 60 * 1000,
    history: [],
    dosesLoggedToday: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.reschedule();
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.state = {
          ...this.state,
          ...parsed,
          // ensure valid numbers
          startedAt: parsed.startedAt || Date.now(),
          nextDueAt: parsed.nextDueAt || Date.now() + DEFAULT_CYCLE_HOURS * 60 * 60 * 1000,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch {
      // ignore
    }
  }

  setNotificationCallback(cb: (state: MedTimerState) => void) {
    this.notificationCallback = cb;
  }

  subscribe(listener: (state: MedTimerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  getState(): MedTimerState {
    const todayStr = new Date().toDateString();
    const dosesToday = this.state.history.filter(
      (d) => new Date(d.timestamp).toDateString() === todayStr
    ).length;

    return {
      ...this.state,
      dosesLoggedToday: dosesToday,
    };
  }

  // Complete / Log dose via NFC Tap simulation or widget shortcut
  completeDoseWithNFC(tagUid: string = '04:88:1A:2B:3C:4D:11', label?: string) {
    const res = this.completeViaNfc(tagUid);
    if (!res) {
      // Fallback: log for current active medication
      this.recordDose(this.state.medItemId, this.state.medName, 'nfc_tap', label || 'Logged via NFC Med Ring shortcut');
    }
    return this.getState();
  }

  // Start or restart a 3-hour timer
  start3HourTimer(hours = 3, medItemId = 'item-work-meds', medName = 'Work Meds (Extra Strength)') {
    const now = Date.now();
    this.state = {
      ...this.state,
      isActive: true,
      cycleHours: hours,
      medItemId,
      medName,
      startedAt: now,
      nextDueAt: now + hours * 60 * 60 * 1000,
    };
    this.saveToStorage();
    this.reschedule();
  }

  // Stop or pause
  togglePause() {
    this.state.isActive = !this.state.isActive;
    if (this.state.isActive) {
      // resume: reset from now with remaining or full cycle
      const now = Date.now();
      this.state.startedAt = now;
      this.state.nextDueAt = now + this.state.cycleHours * 60 * 60 * 1000;
    }
    this.saveToStorage();
    this.reschedule();
  }

  // Complete / Log dose via NFC Tap!
  completeViaNfc(tagUid: string): { success: boolean; message: string; medName: string } | null {
    const uid = tagUid.toLowerCase();
    let matchedName = '';
    let matchedId = '';

    // Check if tag is Work Meds or Rotary Pill Tower
    if (uid.includes('4d:11') || uid === '04:88:1a:2b:3c:4d:11') {
      matchedName = 'Work Meds (Extra Strength)';
      matchedId = 'item-work-meds';
    } else if (uid.includes('4d:10') || uid === '04:88:1a:2b:3c:4d:10') {
      matchedName = 'Rotary Pill Tower (7-Day)';
      matchedId = 'item-rotary-pill-tower';
    }

    if (!matchedName) {
      return null;
    }

    // Log the dose!
    this.recordDose(matchedId, matchedName, 'nfc_tap');

    return {
      success: true,
      message: `NFC Med Ring scanned! Dose logged for "${matchedName}". Next 3-hour reminder started.`,
      medName: matchedName,
    };
  }

  // Manual completion
  completeManual() {
    this.recordDose(this.state.medItemId, this.state.medName, 'manual');
  }

  private recordDose(itemId: string, itemName: string, method: 'nfc_tap' | 'manual', customNote?: string) {
    const now = Date.now();
    const newEntry: DoseLog = {
      id: `dose-${now}`,
      timestamp: new Date(now).toISOString(),
      itemId,
      itemName,
      method,
      notes: customNote || (method === 'nfc_tap' ? 'Logged via physical NFC Med Ring tap' : 'Logged manually'),
    };

    // Restart the 3-hour timer for the next interval!
    this.state = {
      ...this.state,
      isActive: true,
      medItemId: itemId,
      medName: itemName,
      startedAt: now,
      nextDueAt: now + this.state.cycleHours * 60 * 60 * 1000,
      history: [newEntry, ...this.state.history],
    };

    sounds.playHomeChime();
    sounds.triggerHaptic([40, 30, 40, 30, 70]);

    this.saveToStorage();
    this.reschedule();
  }

  private reschedule() {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (!this.state.isActive) return;

    const delay = Math.max(0, this.state.nextDueAt - Date.now());
    this.timerId = window.setTimeout(() => {
      this.triggerDueAlert();
    }, delay);
  }

  private triggerDueAlert() {
    sounds.playScanChime();
    sounds.triggerHaptic([60, 50, 60, 50, 90]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ 3-Hour Med Reminder: ${this.state.medName}`, {
          body: `It's time for your scheduled dose! Tap your 25mm NFC Med Ring to log completion.`,
          icon: '/assets/tiles/tile_work_meds.png',
          tag: 'med-reminder-3hr',
        });
      } catch {
        // ignore
      }
    }

    if (this.notificationCallback) {
      this.notificationCallback(this.getState());
    }
  }
}

export const medTimerService = new MedTimerService();
