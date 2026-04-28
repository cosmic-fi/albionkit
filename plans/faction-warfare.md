# 🚩 Faction Warfare Suite - Implementation Plan

This document outlines the strategy for implementing the Faction Warfare toolset in AlbionKit. This suite will provide players with economic efficiency tools and tactical analytics for Faction Warfare.

## 1. Feature Overview

### 💰 Faction Point Profit Calculator
*   **Goal:** Determine the most profitable item to purchase with Faction Points.
*   **Logic:** (Current Market Price - Market Tax) / Point Cost = Silver Per Point (SPP).
*   **Items:** Hearts, Crests (T4-T8), Baby Mounts, Faction Chests.

### 🚛 Heart Transport Profitability
*   **Goal:** Calculate net profit for transporting hearts between cities.
*   **Logic:** (Target City Price * Quantity) - (Source City Price * Quantity) - Transport Fees.
*   **UI:** Matrix view showing potential profit from any source city to any destination city.

### 🕒 Bandit Assault Tracker
*   **Goal:** Provide a countdown to the next Bandit Assault event.
*   **Logic:** Calculation based on the standard 3-5 hour window after the previous assault ends.
*   **Feature:** \"Notify Me\" button for push notifications 10 minutes before the event.

### 📊 Campaign Progress Tracker
*   **Goal:** Help players hit their monthly Campaign Chest goals.
*   **Logic:** Linear projection of points needed per day/week to reach 1,000,000 points (or specific tiers) by month-end.

### 🗺️ Faction Activity Heatmap
*   **Goal:** Visualize active faction battles.
*   **Logic:** Aggregating recent deaths from the Killboard API filtered by faction-enlisted players.

---

## 2. Technical Architecture

### Data Layer (`src/data/faction-data.ts`)
Static data mapping for point costs and reward metadata.

```typescript
export const FACTION_REWARDS = [
  { id: 'MOUNTAIN_HEART', pointCost: 3000, faction: 'Martlock' },
  { id: 'T4_CREST_MARTLOCK', pointCost: 1000, faction: 'Martlock' },
  // ... etc
];
```

### Service Layer (`src/lib/faction-service.ts`)
Core business logic for calculations.

```typescript
export async function getFactionProfitability(region: string, faction?: string) {
  // 1. Fetch market prices for all reward items
  // 2. Calculate SPP for each item
  // 3. Sort by efficiency
}
```

### UI Components
*   `FactionPointTable.tsx`: Sorted list of rewards with sparklines for price trends.
*   `TransportMatrix.tsx`: Grid showing city-to-city profit margins.
*   `BanditTimer.tsx`: Circular countdown with status indicators (Active, Cooling Down, Imminent).

---

## 3. Implementation Phases

### Phase 1: Market Foundations (Week 1)
*   Define all reward point costs in `faction-data.ts`.
*   Build the `getFactionProfitability` service.
*   Create the `/tools/faction` route and the basic Efficiency Table.

### Phase 2: Tactical Tools (Week 2)
*   Implement the **Heart Transport** calculator.
*   Build the **Campaign Tracker** with persistence (saving user goals to Firestore/LocalStorage).

### Phase 3: Live Events (Week 3)
*   Develop the **Bandit Assault Tracker**.
*   Implement **Activity Heatmap** using the existing PvP Intel infrastructure.
*   Add **Notification Support** for PWA users.

---

## 4. Design Guidelines
*   **Visual Cues:** Use faction icons (Martlock Shield, Fort Sterling Hammer, etc.) liberally.
*   **Responsive:** Ensure the transport matrix is usable on mobile (Albion players often use phones while transporting).
*   **Premium:** Advanced historical trends for faction items will be locked to 'Supporter' status to encourage monetization.
