# 🕒 Bandit Assault Tracker - Design Specification

## 1. Overview
The Bandit Assault Tracker is a tactical tool for Albion Online players to track Faction Warfare "Bandit Assault" events. Since these events trigger within specific UTC windows with varying probabilities, this tool provides a deterministic countdown and scheduling system to help players plan their transports and PvP activities.

## 2. Goals & Success Criteria
- **Accurate Timing:** Sync with the 2-hour roll windows for Americas, Asia, and Europe servers.
- **Visual Clarity:** Immediate understanding of when the next window is and how likely it is to trigger.
- **Enhanced Notifications:** Configurable reminders (5, 10, 15 mins) before a window opens.
- **Mobile Friendly:** Optimized for use on second screens or mobile devices while playing.

## 3. Technical Architecture

### 3.1 Data Layer (`src/data/bandit-schedule.ts`)
Static mapping of UTC windows and trigger chances for all three servers.

```typescript
export interface BanditWindow {
  utcHour: number; // 0-23 UTC
  chance: number;  // 0.0 to 1.0
}

export const BANDIT_SCHEDULES: Record<'west' | 'east' | 'europe', BanditWindow[]> = {
  west: [
    { utcHour: 1, chance: 0.6 },
    { utcHour: 3, chance: 0.6 },
    { utcHour: 5, chance: 0.4 },
    // ... rest of Americas schedule
  ],
  east: [ /* Asia schedule */ ],
  europe: [ /* Europe schedule */ ]
};
```

### 3.2 Logic & Services
A utility service `src/lib/bandit-service.ts` will handle time calculations:
- `getNextWindow(server, currentTime)`: Returns the next `BanditWindow` and its `targetDate`.
- `getRemainingTime(targetDate)`: Formatted string (e.g., "01:45:22").
- `getStatus(timeRemaining)`: 
  - `WAITING`: > 15m
  - `IMMINENT`: <= 15m (Visual warning)
  - `ROLLING`: During the first 10m of the hour.

### 3.3 UI Components
- **`BanditTrackerCard.tsx`**: The main dashboard component.
  - Circular progress ring for countdown.
  - "Probability Meter" showing intensity (High/Med/Low).
  - Server selector integration.
- **`ScheduleList.tsx`**: A table of the day's windows.
  - Highlights current/next window.
  - Color-coded rows based on probability.
- **`ReminderToggle.tsx`**: Configuration for PWA/Browser notifications.

## 4. Design Details

### 4.1 Visuals & Feedback
- **High Chance (60%):** Vibrant Green / Success theme.
- **Medium Chance (40%-50%):** Yellow / Warning theme.
- **Low Chance (20%-30%):** Muted / Neutral theme.
- **Active Window:** Pulsing animation on the "Rolling" status.

### 4.2 Reminder Logic
- User selects lead time (5, 10, or 15 mins).
- Service uses `setTimeout` or a web worker to trigger notifications.
- Audio: A low-profile "War Horn" sound effect.
- PWA: Web Push API for background notifications (if supported).

## 5. Persistence
- `bandit_reminder_enabled`: boolean
- `bandit_reminder_lead_time`: number (minutes)
- `bandit_preferred_server`: string (linked to global server preference)

## 6. Testing Strategy
- **Unit Tests:** Verify `getNextWindow` logic across UTC day boundaries.
- **Component Tests:** Ensure countdown updates every second.
- **Notification Tests:** Mock browser notification API to verify triggers.
