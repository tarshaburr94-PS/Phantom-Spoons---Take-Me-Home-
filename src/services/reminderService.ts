// Service to manage "Remind me to return this" browser notifications and in-app alerts
import { sounds } from './soundEffects';

export interface ActiveReminder {
  itemId: string;
  itemName: string;
  homeName: string;
  room: string;
  dueAt: number; // Unix timestamp ms
  durationMinutes: number;
}

const STORAGE_KEY = 'phantom_spoons_reminders_v1';

class ReminderService {
  private activeTimers = new Map<string, number>(); // itemId -> window.setTimeout id
  private listeners = new Set<(reminders: ActiveReminder[]) => void>();
  private notificationCallback: ((reminder: ActiveReminder) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage();
    }
  }

  setNotificationCallback(cb: (reminder: ActiveReminder) => void) {
    this.notificationCallback = cb;
  }

  private getStoredReminders(): ActiveReminder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredReminders(list: ActiveReminder[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.notifyListeners();
    } catch {
      // ignore
    }
  }

  subscribe(listener: (reminders: ActiveReminder[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStoredReminders());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const reminders = this.getStoredReminders();
    this.listeners.forEach((l) => l(reminders));
  }

  private initFromStorage() {
    const list = this.getStoredReminders();
    const now = Date.now();
    const active: ActiveReminder[] = [];

    list.forEach((rem) => {
      if (rem.dueAt > now) {
        active.push(rem);
        this.scheduleTimer(rem);
      } else {
        // Expired while offline or closed; fire immediately if within 30 mins
        if (now - rem.dueAt < 1000 * 60 * 30) {
          setTimeout(() => this.triggerNotification(rem), 1000);
        }
      }
    });

    if (active.length !== list.length) {
      this.saveStoredReminders(active);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'default') {
      try {
        return await Notification.requestPermission();
      } catch {
        return 'denied';
      }
    }
    return Notification.permission;
  }

  async setReminder(params: {
    itemId: string;
    itemName: string;
    homeName: string;
    room: string;
    durationMinutes: number;
  }): Promise<boolean> {
    await this.requestPermission();

    const dueAt = Date.now() + params.durationMinutes * 60 * 1000;
    const reminder: ActiveReminder = {
      ...params,
      dueAt,
    };

    // Clear existing timer if any
    this.cancelReminder(params.itemId, false);

    // Save
    const list = this.getStoredReminders().filter((r) => r.itemId !== params.itemId);
    list.push(reminder);
    this.saveStoredReminders(list);

    // Schedule timer
    this.scheduleTimer(reminder);
    return true;
  }

  private scheduleTimer(reminder: ActiveReminder) {
    const delay = Math.max(0, reminder.dueAt - Date.now());
    const timerId = window.setTimeout(() => {
      this.triggerNotification(reminder);
      this.cancelReminder(reminder.itemId);
    }, delay);

    this.activeTimers.set(reminder.itemId, timerId);
  }

  cancelReminder(itemId: string, updateStorage = true) {
    const timerId = this.activeTimers.get(itemId);
    if (timerId) {
      clearTimeout(timerId);
      this.activeTimers.delete(itemId);
    }
    if (updateStorage) {
      const list = this.getStoredReminders().filter((r) => r.itemId !== itemId);
      this.saveStoredReminders(list);
    }
  }

  getReminder(itemId: string): ActiveReminder | undefined {
    return this.getStoredReminders().find((r) => r.itemId === itemId);
  }

  private triggerNotification(reminder: ActiveReminder) {
    // 1. Play gentle sound
    sounds.playHomeChime();
    sounds.triggerHaptic([50, 40, 50, 40, 80]);

    // 2. Browser native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `Time to return "${reminder.itemName}" home!`;
        const body = `Designated spot: ${reminder.room} → ${reminder.homeName}. Preserve tomorrow's spoons!`;
        new Notification(title, {
          body,
          icon: '/assets/tiles/tile_house_keys.png',
          tag: `return-${reminder.itemId}`,
        });
      } catch {
        // ignore notification error
      }
    }

    // 3. In-App callback for toast alert
    if (this.notificationCallback) {
      this.notificationCallback(reminder);
    }
  }
}

export const reminderService = new ReminderService();
