# Bandit Assault Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a real-time Bandit Assault tracker with server-specific schedules, countdowns, and probability-based visual cues.

**Architecture:** 
- **Data Layer:** Static schedules for West, East, and Europe servers.
- **Service Layer:** Client-side logic for time calculation and status tracking.
- **UI Components:** Modular React components for the timer, schedule list, and reminder settings.

**Tech Stack:** Next.js 16 (React 19), TypeScript, Tailwind CSS, LocalStorage for persistence.

---

### Task 1: Data Definition

**Files:**
- Create: `src/data/bandit-schedule.ts`

- [ ] **Step 1: Define the Bandit Window types and the full schedule for all servers**

```typescript
export interface BanditWindow {
  utcHour: number; // 0-23
  chance: number;  // 0.0 - 1.0
}

export type ServerRegion = 'west' | 'east' | 'europe';

export const BANDIT_SCHEDULES: Record<ServerRegion, BanditWindow[]> = {
  west: [
    { utcHour: 1, chance: 0.6 },
    { utcHour: 3, chance: 0.6 },
    { utcHour: 5, chance: 0.4 },
    { utcHour: 7, chance: 0.2 },
    { utcHour: 11, chance: 0.2 },
    { utcHour: 13, chance: 0.3 },
    { utcHour: 15, chance: 0.3 },
    { utcHour: 17, chance: 0.4 },
    { utcHour: 19, chance: 0.5 },
    { utcHour: 21, chance: 0.5 },
    { utcHour: 23, chance: 0.6 },
  ],
  east: [
    { utcHour: 2, chance: 0.3 },
    { utcHour: 5, chance: 0.3 },
    { utcHour: 7, chance: 0.5 },
    { utcHour: 9, chance: 0.6 },
    { utcHour: 11, chance: 0.4 },
    { utcHour: 13, chance: 0.6 },
    { utcHour: 15, chance: 0.6 },
    { utcHour: 17, chance: 0.6 },
    { utcHour: 19, chance: 0.3 },
    { utcHour: 21, chance: 0.2 },
  ],
  europe: [
    { utcHour: 1, chance: 0.3 },
    { utcHour: 3, chance: 0.2 },
    { utcHour: 5, chance: 0.2 },
    { utcHour: 7, chance: 0.2 },
    { utcHour: 11, chance: 0.4 },
    { utcHour: 13, chance: 0.5 },
    { utcHour: 15, chance: 0.5 },
    { utcHour: 17, chance: 0.6 },
    { utcHour: 19, chance: 0.6 },
    { utcHour: 21, chance: 0.6 },
    { utcHour: 23, chance: 0.5 },
  ]
};
```

- [ ] **Step 2: Commit data definition**

```bash
git add src/data/bandit-schedule.ts
git commit -m "feat(data): add bandit assault schedules for all servers"
```

---

### Task 2: Calculation Service

**Files:**
- Create: `src/lib/bandit-service.ts`
- Test: `src/lib/__tests__/bandit-service.test.ts`

- [ ] **Step 1: Implement time calculation logic**

```typescript
import { BANDIT_SCHEDULES, ServerRegion, BanditWindow } from '@/data/bandit-schedule';

export interface NextWindowInfo {
  window: BanditWindow;
  targetDate: Date;
}

export function getNextWindow(region: ServerRegion, currentTime: Date = new Date()): NextWindowInfo {
  const schedule = BANDIT_SCHEDULES[region];
  const currentUTCHour = currentTime.getUTCHours();
  
  // Find the next hour in the schedule today
  let nextWindow = schedule.find(w => w.utcHour > currentUTCHour);
  let targetDate = new Date(currentTime);
  
  if (!nextWindow) {
    // Wrap to the first window of tomorrow
    nextWindow = schedule[0];
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }
  
  targetDate.setUTCHours(nextWindow.utcHour, 0, 0, 0);
  
  return {
    window: nextWindow,
    targetDate
  };
}

export function getRemainingTime(targetDate: Date, currentTime: Date = new Date()): number {
  return Math.max(0, targetDate.getTime() - currentTime.getTime());
}

export type BanditStatus = 'WAITING' | 'IMMINENT' | 'ROLLING';

export function getBanditStatus(remainingMs: number, currentTime: Date = new Date()): BanditStatus {
  if (remainingMs <= 0) {
    // If we're within the first 10 minutes of the hour, it's "ROLLING"
    const currentUTCMin = currentTime.getUTCMinutes();
    if (currentUTCMin < 10) return 'ROLLING';
  }
  
  if (remainingMs <= 15 * 60 * 1000) return 'IMMINENT';
  
  return 'WAITING';
}
```

- [ ] **Step 2: Write tests for edge cases (day wrap-around)**

- [ ] **Step 3: Commit calculation service**

```bash
git add src/lib/bandit-service.ts
git commit -m "feat(lib): add bandit-service for time and status calculations"
```

---

### Task 3: Core UI Component (BanditTrackerCard)

**Files:**
- Create: `src/components/faction/BanditTrackerCard.tsx`

- [ ] **Step 1: Build the card with real-time countdown**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ServerRegion } from '@/data/bandit-schedule';
import { getNextWindow, getRemainingTime, getBanditStatus } from '@/lib/bandit-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface BanditTrackerCardProps {
  region: ServerRegion;
}

export const BanditTrackerCard: React.FC<BanditTrackerCardProps> = ({ region }) => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { window, targetDate } = getNextWindow(region, now);
  const remainingMs = getRemainingTime(targetDate, now);
  const status = getBanditStatus(remainingMs, now);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (status === 'ROLLING') return 'text-green-500 animate-pulse';
    if (status === 'IMMINENT') return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Next Bandit Window</span>
          <span className={`text-sm font-bold uppercase ${getStatusColor()}`}>
            {status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="text-5xl font-mono font-bold mb-4">
          {status === 'ROLLING' ? '00:00:00' : formatTime(remainingMs)}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">Probability:</span>
          <span className="font-bold text-lg" style={{ color: window.chance >= 0.6 ? '#22c55e' : window.chance >= 0.4 ? '#eab308' : '#94a3b8' }}>
            {Math.round(window.chance * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 2: Commit Core UI**

---

### Task 4: Schedule List and Page Integration

**Files:**
- Create: `src/components/faction/BanditScheduleList.tsx`
- Modify: `src/app/faction/bandit/page.tsx`

- [ ] **Step 1: Create the schedule list component**
- [ ] **Step 2: Update the page to use the new components**
- [ ] **Step 3: Integrate with useServer hook for region selection**

---

### Task 5: Reminders and Notifications

**Files:**
- Create: `src/components/faction/BanditReminder.tsx`
- Modify: `src/lib/notification-service.ts`

- [ ] **Step 1: Implement the reminder toggle with lead-time selection**
- [ ] **Step 2: Add logic to check for notification triggers in the countdown loop**
- [ ] **Step 3: Add audio alert (War Horn) support**

---

### Task 6: Final Verification

- [ ] **Step 1: Test across all 3 regions**
- [ ] **Step 2: Verify notifications fire correctly**
- [ ] **Step 3: Verify responsive layout on mobile**
