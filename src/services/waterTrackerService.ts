import { sounds } from './soundEffects';

export interface WaterLog {
  id: string;
  timestamp: string; // ISO
  amountMl: number;
  method: 'nfc_tap' | 'manual' | 'widget' | 'shortcut';
  itemName?: string;
  note?: string;
}

export interface WaterTrackerState {
  dailyGoalMl: number;
  currentMlToday: number;
  lastSipTimestamp: number | null;
  history: WaterLog[];
  remindersEnabled: boolean;
  reminderIntervalMinutes: number;
  spoonsRestoredToday: number;
  nextReminderDueAt: number | null;
}

const STORAGE_KEY = 'phantom_spoons_water_tracker_v1';
const DEFAULT_GOAL_ML = 2000;
const DEFAULT_REMINDER_MINUTES = 60;

class WaterTrackerService {
  private timerId: number | null = null;
  private listeners = new Set<(state: WaterTrackerState) => void>();
  private notificationCallback: ((state: WaterTrackerState) => void) | null = null;
  private onSpoonEarnedCallback: ((spoons: number, reason: string) => void) | null = null;

  private state: WaterTrackerState = {
    dailyGoalMl: DEFAULT_GOAL_ML,
    currentMlToday: 0,
    lastSipTimestamp: null,
    history: [],
    remindersEnabled: true,
    reminderIntervalMinutes: DEFAULT_REMINDER_MINUTES,
    spoonsRestoredToday: 0,
    nextReminderDueAt: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.rescheduleReminder();
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const history: WaterLog[] = Array.isArray(parsed.history) ? parsed.history : [];
        
        // Compute today's total from history
        const todayStr = new Date().toDateString();
        const todaysLogs = history.filter(
          (log) => new Date(log.timestamp).toDateString() === todayStr
        );
        const currentMlToday = todaysLogs.reduce((sum, item) => sum + item.amountMl, 0);

        this.state = {
          ...this.state,
          ...parsed,
          currentMlToday,
          history,
          lastSipTimestamp: parsed.lastSipTimestamp || (todaysLogs.length > 0 ? new Date(todaysLogs[0].timestamp).getTime() : null),
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

  setNotificationCallback(cb: (state: WaterTrackerState) => void) {
    this.notificationCallback = cb;
  }

  setOnSpoonEarnedCallback(cb: (spoons: number, reason: string) => void) {
    this.onSpoonEarnedCallback = cb;
  }

  subscribe(listener: (state: WaterTrackerState) => void): () => void {
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

  getState(): WaterTrackerState {
    const todayStr = new Date().toDateString();
    const todaysLogs = this.state.history.filter(
      (log) => new Date(log.timestamp).toDateString() === todayStr
    );
    const currentMlToday = todaysLogs.reduce((sum, item) => sum + item.amountMl, 0);

    // Calculate spoons: 1 spoon per 500ml + 1 spoon bonus when goal reached
    const milestoneSpoons = Math.floor(currentMlToday / 500);
    const goalBonusSpoons = currentMlToday >= this.state.dailyGoalMl ? 1 : 0;
    const totalSpoons = milestoneSpoons + goalBonusSpoons;

    return {
      ...this.state,
      currentMlToday,
      spoonsRestoredToday: totalSpoons,
    };
  }

  // Log water intake
  logIntake(
    amountMl: number,
    method: 'nfc_tap' | 'manual' | 'widget' | 'shortcut' = 'manual',
    itemName = 'Hydration Intake',
    note?: string
  ): { currentTotal: number; spoonsEarned: number } {
    const now = Date.now();
    const prevTotal = this.getState().currentMlToday;
    const prevSpoons = this.getState().spoonsRestoredToday;

    const newLog: WaterLog = {
      id: `water-${now}`,
      timestamp: new Date(now).toISOString(),
      amountMl,
      method,
      itemName,
      note: note || (method === 'nfc_tap' ? `Logged via NFC tap on ${itemName}` : undefined),
    };

    const newHistory = [newLog, ...this.state.history];
    const newTotal = prevTotal + amountMl;

    // Milestone calculation
    const newMilestoneSpoons = Math.floor(newTotal / 500);
    const newGoalBonus = newTotal >= this.state.dailyGoalMl ? 1 : 0;
    const newSpoons = newMilestoneSpoons + newGoalBonus;
    const earnedSpoonsDelta = Math.max(0, newSpoons - prevSpoons);

    this.state = {
      ...this.state,
      currentMlToday: newTotal,
      lastSipTimestamp: now,
      history: newHistory,
      spoonsRestoredToday: newSpoons,
      nextReminderDueAt: this.state.remindersEnabled
        ? now + this.state.reminderIntervalMinutes * 60 * 1000
        : null,
    };

    sounds.playWaterChime();
    sounds.triggerHaptic([35, 45, 60]);

    if (earnedSpoonsDelta > 0 && this.onSpoonEarnedCallback) {
      const reason =
        newTotal >= this.state.dailyGoalMl && prevTotal < this.state.dailyGoalMl
          ? '🎯 Daily Hydration Goal Reached! Brain fatigue mitigated.'
          : '💧 Hydration milestone (+500ml) reached!';
      this.onSpoonEarnedCallback(earnedSpoonsDelta, reason);
    }

    this.saveToStorage();
    this.rescheduleReminder();

    return {
      currentTotal: newTotal,
      spoonsEarned: earnedSpoonsDelta,
    };
  }

  // Remove the most recent log (undo)
  undoLastLog(): boolean {
    const todayStr = new Date().toDateString();
    const firstTodayIdx = this.state.history.findIndex(
      (log) => new Date(log.timestamp).toDateString() === todayStr
    );

    if (firstTodayIdx === -1) return false;

    const updatedHistory = [...this.state.history];
    updatedHistory.splice(firstTodayIdx, 1);

    const nextMostRecent = updatedHistory.find(
      (log) => new Date(log.timestamp).toDateString() === todayStr
    );

    this.state = {
      ...this.state,
      history: updatedHistory,
      lastSipTimestamp: nextMostRecent ? new Date(nextMostRecent.timestamp).getTime() : null,
    };

    sounds.playMisplacedTone();
    this.saveToStorage();
    return true;
  }

  // Process physical NFC tap for Water Bottle or Carafe
  logViaNfc(tagUid: string): { success: boolean; amountMl: number; itemName: string; message: string } | null {
    const uid = tagUid.toLowerCase();

    // Check matching tags
    if (uid === '04:88:1a:2b:3c:4d:08' || uid.includes('4d:08')) {
      // 24oz Insulated Water Bottle -> 750ml
      this.logIntake(750, 'nfc_tap', 'Insulated Water Bottle (24oz)', 'Scanned physical NFC water bottle tag');
      return {
        success: true,
        amountMl: 750,
        itemName: 'Insulated Water Bottle (24oz)',
        message: 'NFC Bottle Tap recognized! +750 ml (24oz) logged to hydration goal.',
      };
    } else if (uid === '04:88:1a:2b:3c:4d:09' || uid.includes('4d:09')) {
      // Pure Spring Water Carafe -> 250ml glass
      this.logIntake(250, 'nfc_tap', 'Pure Spring Water Carafe', 'Scanned NFC carafe pour tag');
      return {
        success: true,
        amountMl: 250,
        itemName: 'Pure Spring Water Carafe',
        message: 'NFC Carafe Pour recognized! +250 ml (8oz glass) logged to hydration goal.',
      };
    } else if (uid === '04:e1:05:e4:9f:70:84' || uid.includes('9f:70')) {
      // Kitchen Hydration Station Home Station -> 500ml tall glass
      this.logIntake(500, 'nfc_tap', 'Kitchen Hydration Station', 'Scanned Kitchen Hydration Station NFC dock');
      return {
        success: true,
        amountMl: 500,
        itemName: 'Kitchen Hydration Station',
        message: 'Kitchen Hydration Station docked! +500 ml logged to hydration goal.',
      };
    }

    return null;
  }

  // Customize daily goal
  setDailyGoal(goalMl: number) {
    this.state.dailyGoalMl = Math.max(500, Math.min(6000, goalMl));
    this.saveToStorage();
  }

  // Toggle or configure gentle interval reminder
  setReminderSettings(enabled: boolean, intervalMinutes = 60) {
    this.state.remindersEnabled = enabled;
    this.state.reminderIntervalMinutes = intervalMinutes;
    this.saveToStorage();
    this.rescheduleReminder();
  }

  private rescheduleReminder() {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (!this.state.remindersEnabled) {
      this.state.nextReminderDueAt = null;
      return;
    }

    const intervalMs = this.state.reminderIntervalMinutes * 60 * 1000;
    const baseTime = this.state.lastSipTimestamp || Date.now();
    const targetDue = baseTime + intervalMs;
    this.state.nextReminderDueAt = targetDue;

    const delay = Math.max(1000, targetDue - Date.now());

    this.timerId = window.setTimeout(() => {
      this.triggerSipAlert();
    }, delay);
  }

  private triggerSipAlert() {
    sounds.playWaterChime();
    sounds.triggerHaptic([40, 30, 40]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`💧 Gentle Hydration Sip Reminder`, {
          body: `It's been ${this.state.reminderIntervalMinutes}m since your last logged sip. Take a swig from your bottle or tap your NFC tag!`,
          icon: '/assets/tiles/tile_water_bottle.png',
          tag: 'phantom-water-sip-reminder',
        });
      } catch {
        // ignore
      }
    }

    if (this.notificationCallback) {
      this.notificationCallback(this.getState());
    }

    // Reschedule next cycle
    this.rescheduleReminder();
  }
}

export const waterTrackerService = new WaterTrackerService();
